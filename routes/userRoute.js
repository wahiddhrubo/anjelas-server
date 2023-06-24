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
} = require("../controllers/userController.js");

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
} = require("../controllers/locationController");

const router = express.Router();

//AUTHENTICATION USER
router.route("/register").post(createUserByEmail);
router.route("/user/login").post(loginByEmail);
router.route("/logout").get(logout);
router.route("/user/indentify").post(forgotPassword);
router.route("/recover/:token").post(resetPassword);
router.route("/user/password").post(isAuthenticatedUser, updatePassword);
router
  .route("/user")
  .post(isAuthenticatedUser, updateAccount)
  .get(isAuthenticatedUser, getAccount);

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

router.route("/user/locations").post(isAuthenticatedUser, createLoc);
router.route("/user/locations/home").post(isAuthenticatedUser, createHomeLoc);
router.route("/user/locations/work").post(isAuthenticatedUser, createWorkLoc);
router.route("/user/locations").delete(isAuthenticatedUser, deleteLoc);

module.exports = router;
