const sendToken = (user, res, statusCode) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      new Date().getTime() + process.env.COOKIE_EXPIRE * 24 * 60 * 60
    ),
    httpOnly: true,
    // domain: ".localhost",
    // sameSite: "strict",
  };
  console.log({ statusCode, token, options });

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
