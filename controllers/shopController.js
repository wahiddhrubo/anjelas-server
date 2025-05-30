const Item = require("../models/itemsModel.js");
const ErrorHandler = require("../utils/errorHandler.js");
const catchAsyncError = require("../utils/catchAsyncError.js");
const ApiOptions = require("../utils/apiOptions");
const User = require("../models/userModel");
const { default: mongoose } = require("mongoose");

exports.createItem = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const item = await Item.create({ ...req.body, user: req.user.id });
  res.status(201).json({
    success: true,
    item,
  });
});

//GET ALL PRODUCTS WITH CATEGORIES AND PAGINATION -- USERS
exports.getAllItems = catchAsyncError(async (req, res) => {
  const limit = parseInt(req.query.itemPerPage) || 10;
  const page = parseInt(req.query.page) || 1;

  // SORTING OPTIONS =["skus.price","name","reviewsNo","reviews.rating","createdAt---[default]"]
  const sortBy = req.query.sortBy || "createdAt";
  // const order = parseInt(req.query.order) || 1;

  const filteredItemsApi = new ApiOptions(req.query).searchAndFilterOptions(
    page,
    limit
  );

  const { matchOptions, groupOptions, facet } = filteredItemsApi;

  let items = await Item.aggregate([
    { $match: matchOptions },
    { $group: groupOptions },
    { $sort: { [sortBy]: 1 } },
    { $facet: facet },
  ]);

  items = await Item.populate(items, {
    path: "data.user",
    select: "username",
    model: User,
  });

  items[0].data.forEach((item) => {
    item.skus.sort((a, b) => a.price - b.price);
  });

  res.status(201).json({
    success: true,
    items,
  });
});

exports.updateItem = catchAsyncError(async (req, res, next) => {
  let item = await Item.findById(req.params.id);
  if (!item) {
    return next(new ErrorHandler("Item not found", 404));
  }
  item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidator: true,
    useFindAndModify: false,
  });
  res.status(201).json({
    success: true,
    sortBy,
    item,
  });
});

exports.deleteItem = catchAsyncError(async (req, res, next) => {
  let item = await Item.findById(req.params.id);
  if (!item) {
    return next(new ErrorHandler("Item not found", 404));
  }
  await item.remove();

  res.status(201).json({
    success: true,
    message: "Item removed successfully",
  });
});

exports.getSingleItem = catchAsyncError(async (req, res, next) => {
  let item = await Item.findById(req.params.id);
  if (!item) {
    return next(new ErrorHandler("Item not found", 404));
  }

  res.status(201).json({
    success: true,
    item,
  });
});

exports.addFavourite = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);
  if (user.favourites.includes(id)) {
    return next(new ErrorHandler("Item Already Added To Favourites", 400));
  }

  user.favourites.push(id);
  user.save();

  res.status(201).json({
    success: true,
    id,
    user,
  });
});

exports.removeFavourite = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id);

  if (!user.favourites.includes(id)) {
    return next(new ErrorHandler("Item is not favourite", 404));
  }

  await User.findByIdAndUpdate(req.user.id, {
    $pull: { favourites: id },
  });

  res.status(201).json({
    success: true,
  });
});

exports.getFavourite = catchAsyncError(async (req, res, next) => {
  let user = await User.findById(req.user.id);

  user = await User.populate(user, {
    path: "favourites",
    select: { name: 1, _id: 1, featuredImage: 1, "skus.price": 1 },
  });

  const favourites = user.favourites;

  res.status(201).json({
    success: true,
    favourites,
  });
});
