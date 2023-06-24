const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  password: {
    type: String,
    required: false,
    select: false,
  },
  phone: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    required: false,
    select: false,
  },
  googleSecret: {
    type: String,
    required: false,
    select: false,
  },
  cart: {
    type: mongoose.Schema.ObjectId,
    ref: "Cart",
    required: true,
  },
  orders: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
    },
  ],
  homeLoc: {
    type: mongoose.Schema.ObjectId,
    ref: "Location",
    required: false,
  },
  workLoc: {
    type: mongoose.Schema.ObjectId,
    ref: "Location",
    required: false,
  },
  locations: [{ type: mongoose.Schema.ObjectId, ref: "Location" }],
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

//ENCRYPT PASSWORD
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);
});

//GENERATE JWT TOKEN
userSchema.methods.getJwtToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
  console.log(token);
  return token;
};

//COMPARE PASSWORD
userSchema.methods.comparePassword = async function (password) {
  const match = await bcrypt.compare(password, this.password);
  return match;
};

//CREATE RESET TOKEN
userSchema.methods.createResetToken = async function () {
  const token = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = await crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.resetPasswordExpire = new Date(
    new Date().getTime() + process.env.PASSWORD_EXPIRE * 60 * 60 * 1000
  );

  return token;
};

userSchema.index({ username: "string", phone: "string", email: "string" });

module.exports = mongoose.model("User", userSchema);
