const Order = require("../models/orderModel.js");
const ErrorHandler = require("../utils/errorHandler.js");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Location = require("../models/locationModel");
const Review = require("../models/reviewModel");
const Item = require("../models/itemsModel.js");
const catchAsyncError = require("../utils/catchAsyncError.js");
const axios = require("axios");
const querystring = require("querystring");

const crypto = require("crypto");

//CREATE ORDERS
exports.createOrder = catchAsyncError(async (req, res, next) => {
  const {
    location,
    deliveryCharge,
    tax,
    subTotal,
    total,
    coupon,
    discount,
    paymentMethod,
    deliveryDate,
    deliveryTime,
  } = req.body;

  const uID = crypto.randomBytes(6).toString("hex");

  const user = await User.findById(req.user.id);
  const cart = await Cart.findById(user.cart);
  console.log(cart.items.length);
  if (!cart.items.length) {
    return next(new ErrorHandler("No Item Found In Cart", 404));
  }

  const order = await Order.create({
    uID,
    location,
    subTotal,
    deliveryCharge,
    tax,
    coupon,
    discount,
    total,
    paymentMethod,
    deliveryDate,
    deliveryTime,
    items: cart.items,
    user: user._id,
  });
  user.orders.push(order._id);
  user.save();
  cart.items = [];
  cart.save();

  res.status(201).json({
    success: true,
    order,
  });
});

//GET ALL ORDERS --USER
exports.getAllUserOrders = catchAsyncError(async (req, res, next) => {
  const user = req.user.id;
  const populateQuery = [
    {
      path: "location",
      model: Location,
      select: { phone: 1, area: 1, streetAddress: 1, _id: 1 },
    },
  ];
  const orders = await Order.find({ user }).populate(populateQuery).lean();
  res.status(201).json({
    success: true,
    orders,
  });
});

//GET SINGLE ORDER --USER
exports.getSingleUserOrders = catchAsyncError(async (req, res, next) => {
  const user = req.user.id;
  const { id } = req.params;
  console.log(id);
  const populateQuery = [
    {
      path: "user",
      model: User,
      select: { username: 1, _id: 1 },
    },
    {
      path: "location",
      model: Location,
      select: { phone: 1, area: 1, streetAddress: 1, _id: 1 },
    },
    {
      path: "items.item",
      model: Item,
      select: { name: 1, _id: 1, featuredImage: 1, skus: 1 },
    },
  ];

  const order = await Order.findOne({ user, _id: id })
    .populate(populateQuery)
    .lean();
  res.status(201).json({
    success: true,
    order,
  });
});

//GET ALL ORDERS BY STATUS --USER
exports.getAllUserOrdersByStatus = catchAsyncError(async (req, res, next) => {
  const populateQuery = {
    path: "user",
    model: User,
    select: { username: 1, _id: 1 },
  };

  const user = req.user.id;
  const { status } = req.params;
  const orders = await Order.find({ user, status })
    .populate(populateQuery)
    .lean();
  res.status(201).json({
    success: true,
    orders,
  });
});

//GET ALL ORDERS --ADMIN
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  const populateQuery = [
    {
      path: "user",
      model: User,
      select: { username: 1, _id: 1 },
    },
    {
      path: "location",
      model: Location,
      select: { phone: 1, area: 1, streetAddress: 1, _id: 1 },
    },
    {
      path: "items.item",
      model: Item,
      select: { name: 1, _id: 0 },
    },
  ];

  const orders = await Order.find({}).populate(populateQuery).lean();
  res.status(201).json({
    success: true,
    orders,
  });
});

//GET SINGLE ORDER --ADMIN
exports.getSingleOrders = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const orders = await Order.findById(id);
  res.status(201).json({
    success: true,
    orders,
  });
});

//GET ALL ORDERS BY STATUS --ADMIN
exports.getAllOrdersByStatus = catchAsyncError(async (req, res, next) => {
  const { status } = req.params;
  const orders = await Order.find({ status });
  res.status(201).json({
    success: true,
    orders,
  });
});

//UPDATE ORDER  STATUS --ADMIN
exports.updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params;
  const orders = await Order.findByIdAndUpdate(id, { status });
  res.status(201).json({
    success: true,
    orders,
  });
});

// CREATE OR UPDATE REVIEW  --USER
exports.createOrUpdateReview = catchAsyncError(async (req, res, next) => {
  const { orderId, itemId, rating, comment } = req.body;
  const user = req.user.id;
  const itemInOrder = await Item.findById(itemId);
  const orders = await Order.find({
    user,
    _id: orderId,
    "items.item": itemId,
  });

  if (!orders.length) {
    return next(new ErrorHandler("No Order Found", 404));
  }

  const review = Review.create({
    item: itemId,
    order: orderId,
    rating,
    comment,
    user,
  });

  await itemInOrder.reviews.push(review._id);
  await itemInOrder.save();

  res.status(201).json({
    success: true,
    orders,
  });
});

exports.payment = catchAsyncError(async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params;

  const data = {
    api: process.env.EDOKAN_API_KEY,
    secret: process.env.EDOKAN_API_SECRET,
    client: process.env.EDOKAN_API_CLIENT,
    position: "http://localhost:3001",
    amount: 10,
    cus_name: "wahid",
    cus_email: "wahiddhrubo@gmail.com",
    success_url: "google.com",
    cancel_url: "fb.com",
  };
  // const curlTest = new Curl();
  // curlTest.setOpt("URL", "https://pay.edokanpay.com/checkout.php");
  // curlTest.setOpt("POST", true);

  request(
    "https://pay.edokanpay.com/checkout.php",
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body);
      } else {
        console.log(error);
      }
    }
  );

  // try {
  //   const result = await axios({
  //     url: "https://pay.edokanpay.com/checkout.php",
  //     method: "post",
  //     data: JSON.stringify(data),
  //   });
  //   console.log(result);

  //   res.status(201).json({
  //     success: true,
  //   });
  // } catch (err) {
  //   console.log(err);
  //   res.status(201).json({
  //     success: false,
  //     error: err.response,
  //   });
  // }
});
