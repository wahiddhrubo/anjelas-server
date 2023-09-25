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
const Coupon = require("../models/couponModel.js");

// COUPONS

const applyCoupon = (discount, discountType, totalAmount, deliveryCharge) => {
  if (discountType === "percent-discount") {
    const newTotal =
      parseFloat(totalAmount) * (100 - parseFloat(discount)) * 0.01;
    const newDiscount = parseFloat(totalAmount) * parseFloat(discount) * 0.01;
    return { newTotal, newDiscount };
  }
  if (discountType === "flat-discount") {
    const newTotal = parseFloat(totalAmount) - parseFloat(discount);
    return { newTotal, newDiscount: parseFloat(discount) };
  }
  if (discountType === "zero-delivery") {
    const newTotal = parseFloat(totalAmount) - parseFloat(deliveryCharge);
    return { newTotal, newDiscount: deliveryCharge };
  }
};

const checkCouponValidity = (coupon, totalAmount, user) => {
  const { expires, maxUses, totalUses, brakingAmount, firstOrder } = coupon;
  const isExpired = new Date() < expires;
  const maxUsesReached = maxUses ? totalUses >= maxUses : false;
  const orderAmountTooLow = brakingAmount
    ? brakingAmount >= totalAmount
    : false;
  const notFirstOrder = firstOrder ? user.orders.length : false;
  const validCoupon = !(
    isExpired ||
    maxUsesReached ||
    orderAmountTooLow ||
    notFirstOrder
  );
  return validCoupon;
};

exports.createCoupon = catchAsyncError(async (req, res, next) => {
  const { code, expires } = req.body;

  const expiry = new Date(new Date().getTime() + expires * 24 * 60 * 60 * 1000);
  const oldCoupon = await Coupon.findOne({ code });
  if (oldCoupon) {
    return next(new ErrorHandler("Coupon  Already Registered", 400));
  }
  const coupon = await Coupon.create({
    ...req.body,
    expires: expiry,
    totalUses: 0,
  });

  res.status(201).json({
    success: true,
    coupon,
  });
});
exports.getCoupon = catchAsyncError(async (req, res, next) => {
  const { totalAmount, deliveryCharge } = req.body;
  const { code } = req.params;
  const coupon = await Coupon.findOne({ code });
  if (!coupon) {
    return next(new ErrorHandler("Coupon Not Found", 404));
  }
  const user = await User.findById(req.user.id);
  const {
    expires,
    maxUses,
    firstOrder,
    totalUses,
    brakingAmount,
    discount,
    discountType,
  } = coupon;
  const today = new Date();

  const isExpired = today >= new Date(expires);

  const maxUsesReached = maxUses ? totalUses >= maxUses : false;

  if (isExpired || maxUsesReached) {
    return next(new ErrorHandler("Coupon Expired or Max Usage Reached", 404));
  }

  const orderAmountTooLow = brakingAmount
    ? brakingAmount >= totalAmount
    : false;
  if (orderAmountTooLow) {
    return next(
      new ErrorHandler(
        `Please Order More Than ${brakingAmount} To Use The Coupon`,
        404
      )
    );
  }

  const notFirstOrder = firstOrder ? user.orders.length : false;
  if (notFirstOrder) {
    return next(new ErrorHandler("Coupon Availiable Only For First User", 404));
  }

  const { newTotal, newDiscount } = applyCoupon(
    discount,
    discountType,
    totalAmount,
    deliveryCharge
  );

  res.status(201).json({
    success: true,
    total: newTotal,
    discount: newDiscount,
    coupon,
  });
});
exports.getCouponAdmin = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    return next(new ErrorHandler(`Coupon Not Found ${id}`, 404));
  }

  res.status(201).json({
    success: true,
    coupon,
  });
});

exports.updateCoupon = catchAsyncError(async (req, res, next) => {
  const { expires } = req.body;

  const expiry = new Date(new Date().getTime() + expires * 24 * 60 * 60 * 1000);

  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ErrorHandler("Coupon not found", 404));
  }
  coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...(expires && { expires: expiry }) },
    {
      new: true,
      runValidator: true,
      useFindAndModify: false,
    }
  );
  res.status(201).json({
    success: true,

    coupon,
  });
});
exports.getAllCoupon = catchAsyncError(async (req, res, next) => {
  const coupons = await Coupon.find({});

  res.status(201).json({
    success: true,
    coupons,
  });
});
exports.deleteCoupons = catchAsyncError(async (req, res, next) => {
  const { ids } = req.body;
  const data = await Coupon.deleteMany({
    _id: {
      $in: ids,
    },
  });
  res.status(201).json({
    success: true,
    data,
  });
});

//CREATE ORDERS
exports.createNagadOrder = catchAsyncError(async (req, res, next) => {
  const {
    location,
    deliveryCharge,
    tax,
    subTotal,
    total,
    couponCode,
    deliveryDate,
    deliveryTime,
  } = req.body;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });
    console.log(coupon);

    if (!coupon) {
      return next(new ErrorHandler("Coupon Not Found", 404));
    }

    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);
    const couponValid = checkCouponValidity(coupon, total, user);
    if (!couponValid) {
      return next(new ErrorHandler("Coupon Not Working", 404));
    }
    const { discount, discountType } = coupon;
    const { newDiscount: totalDiscount, newTotal } = applyCoupon(
      discount,
      discountType,
      total,
      deliveryCharge,
      user
    );

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      coupon: couponCode,
      discount: totalDiscount,
      total: newTotal || total,
      paymentMethod: "Nagad",
      deliveryDate,
      deliveryTime,
      items: cart.items,
      user: user._id,
    });
    user.orders.push(order._id);
    user.save();
    cart.items = [];
    cart.save();

    coupon.totalUses += 1;
    coupon.save();

    res.status(201).json({
      success: true,
      order,
    });
  } else {
    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      total,
      paymentMethod: "Nagad",
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
  }
});

exports.createCODOrder = catchAsyncError(async (req, res, next) => {
  const {
    location,
    deliveryCharge,
    tax,
    subTotal,
    total,
    couponCode,
    deliveryDate,
    deliveryTime,
  } = req.body;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return next(new ErrorHandler("Coupon Not Found", 404));
    }

    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);
    const couponValid = checkCouponValidity(coupon, total, user);
    if (!couponValid) {
      return next(new ErrorHandler("Coupon Not Working", 404));
    }
    const { discount, discountType } = coupon;
    const { newDiscount: totalDiscount, newTotal } = applyCoupon(
      discount,
      discountType,
      total,
      deliveryCharge,
      user
    );

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      coupon: couponCode,
      discount: totalDiscount,
      total: newTotal || total,
      paymentMethod: "COD",
      deliveryDate,
      deliveryTime,
      items: cart.items,
      user: user._id,
    });
    user.orders.push(order._id);
    user.save();
    cart.items = [];
    cart.save();

    coupon.totalUses += 1;
    coupon.save();
    res.status(201).json({
      success: true,
      order,
    });
  } else {
    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      total,
      paymentMethod: "COD",
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
  }
});

exports.createBkashOrder = catchAsyncError(async (req, res, next) => {
  const {
    location,
    deliveryCharge,
    tax,
    subTotal,
    total,
    couponCode,
    deliveryDate,
    deliveryTime,
  } = req.body;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon.length) {
      return next(new ErrorHandler("Coupon Not Found", 404));
    }

    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);
    const couponValid = checkCouponValidity(coupon, total, user);
    if (!couponValid) {
      return next(new ErrorHandler("Coupon Not Working", 404));
    }
    const { discount, discountType } = coupon;
    const { newDiscount: totalDiscount, newTotal } = applyCoupon(
      discount,
      discountType,
      total,
      deliveryCharge,
      user
    );

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      coupon: couponCode,
      discount: totalDiscount,
      total: newTotal || total,
      paymentMethod: "Bkash",
      deliveryDate,
      deliveryTime,
      items: cart.items,
      user: user._id,
    });
    user.orders.push(order._id);
    user.save();
    cart.items = [];
    cart.save();

    coupon.totalUses += 1;
    coupon.save();
    res.status(201).json({
      success: true,
      order,
    });
  } else {
    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      total,
      paymentMethod: "Bkash",
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
  }
});

exports.createRocketOrder = catchAsyncError(async (req, res, next) => {
  const {
    location,
    deliveryCharge,
    tax,
    subTotal,
    total,
    couponCode,
    deliveryDate,
    deliveryTime,
  } = req.body;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return next(new ErrorHandler("Coupon Not Found", 404));
    }

    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);
    const couponValid = checkCouponValidity(coupon, total, user);
    if (!couponValid) {
      return next(new ErrorHandler("Coupon Not Working", 404));
    }
    const { discount, discountType } = coupon;
    const { newDiscount: totalDiscount, newTotal } = applyCoupon(
      discount,
      discountType,
      total,
      deliveryCharge,
      user
    );

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      coupon: couponCode,
      discount: totalDiscount,
      total: newTotal || total,
      paymentMethod: "Rocket",
      deliveryDate,
      deliveryTime,
      items: cart.items,
      user: user._id,
    });
    user.orders.push(order._id);
    user.save();
    cart.items = [];
    cart.save();

    coupon.totalUses += 1;
    coupon.save();
    res.status(201).json({
      success: true,
      order,
    });
  } else {
    const uID = crypto.randomBytes(6).toString("hex");

    const user = await User.findById(req.user.id);

    const cart = await Cart.findById(user.cart);
    if (!cart.items.length) {
      return next(new ErrorHandler("No Item Found In Cart", 404));
    }

    const order = await Order.create({
      uID,
      location,
      subTotal,
      deliveryCharge,
      tax,
      total,
      paymentMethod: "Rocket",
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
  }
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
