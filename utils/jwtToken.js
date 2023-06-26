const { none } = require("./cloudinary");

const sendToken = (user, res, statusCode) => {
  const token = user.getJwtToken();

  const options = {
    maxAge: process.env.PASSWORD_EXPIRE * 24 * 60 * 60 * 100,
    httpOnly: true,
    // domain:
    //   process.env.NODE_ENV === "development"
    //     ? ".localhost"
    //     : `.${process.env.FRONTEND_DOMAIN}`,
    sameSite: true,
  };
  console.log({ statusCode, token, options });

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
