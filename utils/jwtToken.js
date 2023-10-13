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
    res.redirect("exp://192.168.0.185:8081");
  } else {
    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      token,
      user,
    });
  }
};

module.exports = sendToken;
