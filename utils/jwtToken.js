const sendToken = (user, res, statusCode, social = false) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      new Date().getTime() + process.env.COOKIE_EXPIRE * 24 * 60 * 60
    ),
    sameSite: "none",
    secure: true,
  };
  if (social) {
    res.cookie("token", token, options);
    res.redirect(process.env.CLIENT_URL);
  } else {
    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      token,
      user,
    });
  }
};

module.exports = sendToken;
