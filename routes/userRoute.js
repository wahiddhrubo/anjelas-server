const express = require("express");
const {
  createUserByEmail,
  loginByEmail,
  forgotPassword,
  getAccount,
  logout,
  resetPassword,
  updatePassword,
  updateAccount,
  getAllUsers,
  getSingleUser,
  deleteSingleUser,
  updateUserRole,
  createAdminUser,
  createOrLoginUserByGoogle,
} = require("../controllers/userController.js");

require("../utils/googlePassport.js");
const {
  addItemToCart,
  removeItemFromCart,
  getCart,
  updateItemInCart,
} = require("../controllers/cartController.js");

const {
  isAuthorized,
  isAuthenticatedUser,
} = require("../middleware/authUser.js");

const {
  createHomeLoc,
  createWorkLoc,
  createLoc,
  deleteLoc,
  getUserLoc,
} = require("../controllers/locationController");
const {
  addFavourite,
  removeFavourite,
  getFavourite,
} = require("../controllers/shopController.js");
const passport = require("passport");

const router = express.Router();

//AUTHENTICATION USER
router.route("/register").post(createUserByEmail);
router.route("/user/login").post(loginByEmail);
router.route("/auth/google").get(
  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
  })
);
router.route("/auth/google/callback").get(
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  createOrLoginUserByGoogle
);

router.route("/auth/google/sucess").get((req, res, next) => {
  console.log(req._user);
  res.send("HI");
});

router.route("/logout").get(logout);
router.route("/user/indentify").post(forgotPassword);
router.route("/recover/:token").post(resetPassword);
router.route("/user/password").post(isAuthenticatedUser, updatePassword);
router
  .route("/user")
  .post(isAuthenticatedUser, updateAccount)
  .get(isAuthenticatedUser, getAccount);

router
  .route("/user/favourite/:id")
  .post(isAuthenticatedUser, addFavourite)
  .delete(isAuthenticatedUser, removeFavourite);

router.route("/user/favourite").get(isAuthenticatedUser, getFavourite);

//ADMIN PRIVILIGE
router
  .route("/admin/users")
  .get(isAuthenticatedUser, isAuthorized("admin"), getAllUsers)
  .post(isAuthenticatedUser, isAuthorized("admin"), createAdminUser);
router
  .route("/admin/users/:id")
  .get(isAuthenticatedUser, isAuthorized("admin"), getSingleUser)
  .post(isAuthenticatedUser, isAuthorized("admin"), updateUserRole)
  .delete(isAuthenticatedUser, isAuthorized("admin"), deleteSingleUser);

// UPDATE CART
router
  .route("/user/cart")
  .get(isAuthenticatedUser, getCart)
  .post(isAuthenticatedUser, addItemToCart);

router.route("/update/cart").post(isAuthenticatedUser, updateItemInCart);

router.route("/user/cart/:id").delete(isAuthenticatedUser, removeItemFromCart);

router
  .route("/user/locations")
  .get(isAuthenticatedUser, getUserLoc)
  .post(isAuthenticatedUser, createLoc);
router.route("/user/locations/home").post(isAuthenticatedUser, createHomeLoc);
router.route("/user/locations/work").post(isAuthenticatedUser, createWorkLoc);
router.route("/user/locations").delete(isAuthenticatedUser, deleteLoc);

module.exports = router;
