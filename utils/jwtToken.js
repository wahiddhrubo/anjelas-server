const sendToken = (user, res, statusCode) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      new Date().getTime() + process.env.COOKIE_EXPIRE * 24 * 60 * 60
    ),
    httpOnly: true,
    domain:
      process.env.NODE_ENV === "development"
        ? ".localhost"
        : process.env.FRONTEND_DOMAIN,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
