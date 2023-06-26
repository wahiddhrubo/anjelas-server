const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Location = require("../models/locationModel");
const Item = require("../models/itemsModel");
const ErrorHandler = require("../utils/errorHandler.js");
const catchAsyncError = require("../utils/catchAsyncError.js");
const sendToken = require("../utils/jwtToken.js");
const ApiOptions = require("../utils/apiOptions");
const EmailHandler = require("../utils/emailHandler.js");
const crypto = require("crypto");

//CREATE A USER BY EMAIL
exports.createUserByEmail = catchAsyncError(async (req, res, next) => {
  const newCart = await Cart.create({});
  const cartId = newCart._id;

  const { email, password, username } = req.body;
  const newUser = await User.create({
    email,
    password,
    username,
    cart: cartId,
  });

  sendToken(newUser, res, 201);
});

//CREATE A USER BY ADMIN
exports.createAdminUser = catchAsyncError(async (req, res, next) => {
  const newCart = await Cart.create({});
  const cartId = newCart._id;

  const { email, password, username } = req.body;
  console.log({ email, password, username });

  const newUser = await User.create({
    email,
    password,
    username,
    cart: cartId,
    role: "admin",
  });

  console.log({ newUser });
  const token = await newUser.createResetToken();
  newUser.save();
  try {
    await EmailHandler({
      receiver: email,
      tempLoc: "/forgotPasswordEmailTemplate.html",
      subject: "Forgot Password",
      link: `${process.env.BACKEND_URL}/password/${token}`,
    });

    res.status(201).json({
      success: true,
      message: `Message Sent to ${email} `,
      newUser,
    });
  } catch (err) {
    console.log(err);
  }
});

//LOGIN BY EMAIL ADDRESS
exports.loginByEmail = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email and Password", 401));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password ", 401));
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return next(new ErrorHandler("Invalid  Email or Password", 401));
  }

  sendToken(user, res, 201);
});

exports.logout = catchAsyncError((user, res, next) => {
  const options = {
    expires: new Date(),
    httpOnly: true,
  };

  res.status(201).cookie("token", null, options).json({
    success: true,
    message: "Logged Out Successfully",
  });
});

// GET ACCOUNT
exports.getAccount = catchAsyncError(async (req, res, next) => {
  const populateQuery = [
    {
      path: "locations",
      model: Location,
      select: { area: 1, streetAddress: 1, _id: 1 },
    },
    {
      path: "homeLoc",
      model: Location,
      select: { area: 1, streetAddress: 1, _id: 1 },
    },
    {
      path: "workLoc",
      model: Location,
      select: { area: 1, streetAddress: 1, _id: 1 },
    },
  ];
  const user = await User.findById(req.user.id).populate(populateQuery);
  if (!user) {
    return next(new ErrorHandler("Invalid User", 404));
  }

  res.status(201).json({
    success: true,
    user,
  });
});

//FORGOT PASSWORD
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new ErrorHandler("No User Found", 404));
  }

  const token = await user.createResetToken();
  user.save();
  try {
    await EmailHandler({
      receiver: email,
      tempLoc: "/forgotPasswordEmailTemplate.html",
      subject: "Forgot Password",
      link: `${req.protocol}://${req.get("host")}/reset/password/${token}`,
    });

    res.status(201).json({
      success: true,
      message: `Message Sent to ${email} `,
    });
  } catch (err) {
    console.log(err);
  }
});

//RESET PASSWORD
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const token = req.params.token;

  const resetPasswordToken = await crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Token or Token Exprired", 401));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("New Password and Confirm Password Doesn't Match", 401)
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.save();
  sendToken(user, res, 201);
});

//UPDATE ACCOUNT
exports.updateAccount = catchAsyncError(async (req, res, next) => {
  const id = req.user.id;
  const { username, email, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { username, email, phone },
    {
      runValidator: true,
    }
  );

  res.status(201).json({
    success: true,
    message: "Updated Successfully",
    user,
  });
});

//UPDATE PASSWORD
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const id = req.user.id;
  const { oldPassword, password, confirmPassword } = req.body;

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  const passwordMatch = await user.comparePassword(oldPassword);

  if (!passwordMatch) {
    return next(new ErrorHandler("Incorrect Old Password", 403));
  }

  if (!password) {
    return next(new ErrorHandler("Enter New Password", 401));
  } else if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords Doesn't Match", 401));
  } else if (password === oldPassword) {
    return next(new ErrorHandler("Enter A New Password. ", 401));
  }

  user.password = req.body.password;
  user.save();
  res.status(201).json({
    success: true,
    message: "Updated Successfully",
  });
});

// GET ALL USERS -- ADMIN
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const populateQuery = [
    {
      path: "homeLoc",
      model: Location,
      select: { area: 1, streetAddress: 1, _id: 1 },
    },
    {
      path: "workLoc",
      model: Location,
      select: { area: 1, streetAddress: 1, _id: 1 },
    },
    {
      path: "locations",
      model: Location,
      select: { area: 1, streetAddress: 1, _id: 1 },
    },
  ];

  let regex = new RegExp(req.query.keyword, "i");

  const users = await User.find({
    $or: [
      { username: regex },
      { email: regex },
      {
        phone: regex,
      },
    ],
  })
    .populate(populateQuery)
    .lean();

  if (!users) {
    return next(new ErrorHandler("No Users Found", 404));
  }
  res.status(201).json({
    success: true,
    users,
  });
});

// GET SINGLE USERS -- ADMIN
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
  const users = await User.findById(req.params.id);
  if (!users) {
    return next(new ErrorHandler("No Users Found", 404));
  }

  res.status(201).json({
    success: true,
    users,
  });
});

// GET SINGLE USERS -- ADMIN
exports.updateUserRole = catchAsyncError(async (req, res, next) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("No Users Found", 404));
  }
  user.role = role;
  user.save();

  res.status(201).json({
    success: true,
    user,
  });
});

// DELETE USER -- ADMIN
exports.deleteSingleUser = catchAsyncError(async (req, res, next) => {
  const users = await User.findById(req.params.id);
  if (!users) {
    return next(new ErrorHandler("No Users Found", 404));
  }
  users.remove();

  res.status(201).json({
    success: true,
    message: "User Removed",
  });
});
