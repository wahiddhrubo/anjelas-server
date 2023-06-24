const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const ErrorHandler = require("../utils/errorHandler.js");
const catchAsyncError = require("../utils/catchAsyncError.js");
const ApiOptions = require("../utils/apiOptions");

//GET USER CART
exports.getCart = catchAsyncError(async (req, res, next) => {
  const cartId = req.user.cart;
  const filteredItemsApi = new ApiOptions(req.query).getCartOptions();

  const { cartOptions } = filteredItemsApi;

  let cart = await Cart.findById(cartId);
  if (!cart) {
    return next(new ErrorHandler("No Cart Found", 404));
  }
  cart = await Cart.populate(cart, {
    path: "items.item",
    select: { name: 1, _id: 1, featuredImage: 1 },
  });
  const total = cart.items.reduce(
    (total, i) => total + i.quantity * i.pricePerUnit,
    0
  );

  res.status(201).json({
    success: true,
    cart,
    total,
  });
});

//ADD A ITEM TO A CART
exports.addItemToCart = catchAsyncError(async (req, res, next) => {
  const { item, pricePerUnit, quantity, variant } = req.body;

  const cartId = req.user.cart;

  const newCart = await Cart.findById(cartId);
  let oldCart = await Cart.find({
    _id: cartId,
    variant,
    "items.item": item,
    "items.variant": variant,
  });

  if (!oldCart.length) {
    newCart.items.push({
      item,
      pricePerUnit,
      quantity,
      variant: variant,
    });
    newCart.save();
  } else {
    oldCart = await Cart.findOneAndUpdate(
      {
        _id: cartId,
        "items.item": item,
        "items.variant": variant,
      },
      {
        $inc: {
          "items.$.quantity": quantity,
        },
      }
    );
  }

  res.status(201).json({
    success: true,
    message: "Item Added",
  });
});

exports.updateItemInCart = catchAsyncError(async (req, res, next) => {
  const { item, quantity, variant } = req.body;
  const cartId = req.user.cart;
  let cart = await Cart.findOneAndUpdate(
    {
      _id: cartId,
      "items.item": item,
      "items.variant": variant,
    },
    {
      $set: {
        "items.$.quantity": quantity,
      },
    }
  );

  res.status(201).json({
    success: true,
    message: "Item Updated",
  });
});

//REMOVE AN ITEM FROM CART
exports.removeItemFromCart = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const cartId = req.user.cart;

  const newCart = await Cart.findByIdAndUpdate(cartId, {
    $pull: { items: { item: id } },
  });

  res.status(201).json({
    success: true,
    message: "Item Removed",
  });
});
