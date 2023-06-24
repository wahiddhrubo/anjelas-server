const express = require("express");
const {
  createOrder,
  getAllUserOrders,
  getSingleUserOrders,
  getAllUserOrdersByStatus,
  getAllOrders,
  getSingleOrders,
  getAllOrdersByStatus,
  updateOrderStatus,
  payment,
  createOrUpdateReview,
} = require("../controllers/orderController.js");

const {
  isAuthorized,
  isAuthenticatedUser,
} = require("../middleware/authUser.js");

const router = express.Router();

//USER ORDERS
router.route("/order").post(isAuthenticatedUser, createOrder);
router.route("/user/orders").get(isAuthenticatedUser, getAllUserOrders);

router
  .route("/user/orders/:status")
  .get(isAuthenticatedUser, getAllUserOrdersByStatus);
router
  .route("/user/orders/order/:id")
  .get(isAuthenticatedUser, getSingleUserOrders);

//CREATE OR UPDATE REVIEW
router.route("/user/review").post(isAuthenticatedUser, createOrUpdateReview);

//ADMIN ORDER
router.route("/admin/orders").get(isAuthenticatedUser, getAllOrders);
router
  .route("/admin/orders/:id")
  .get(isAuthenticatedUser, getSingleOrders)
  .post(isAuthenticatedUser, updateOrderStatus);

router.route("/test-payment").get(payment);
module.exports = router;
