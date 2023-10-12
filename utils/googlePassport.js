const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const sendToken = require("./jwtToken");
const passport = require("passport");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACKURL,
      passReqToCallback: true,
    },
    function (req, accessToken, refreshToken, profile, done) {
      const userData = {
        email: profile.emails[0].value,
        firstname: profile.name.givenName,
        lastname: profile.name.familyName,
        username: profile.displayName || profile.name.familyName,
        authType: "oauth",
      };
      req._user = userData;

      done(null, req);
      //     const newCart = await Cart.create({});
      //     const cartId = newCart._id;

      //     const newUser = await User.create({
      //       email,
      //       username,
      //       cart: cartId,
      //     });
      //     sendToken(user, res, 201);
      // }

      // sendToken(user, res, 201);
    }
  )
);
