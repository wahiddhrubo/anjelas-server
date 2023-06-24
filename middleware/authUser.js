const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler.js");
const catchAsyncError = require("../utils/catchAsyncError.js");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
	const { token } = req.cookies;
	console.log(req.cookies);
	if (!token) {
		return next(new ErrorHandler("Please Login First", 401));
	}
	const decodedData = jwt.verify(token, process.env.JWT_SECRET);

	req.user = await User.findById(decodedData.id);

	next();
});

exports.isAuthorized = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new ErrorHandler(`${req.user.role} Can't Access This Page`, 401)
			);
		}
		next();
	};
};
