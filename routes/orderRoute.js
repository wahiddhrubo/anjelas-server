const express = require("express");
const {
  getAllUserOrders,
  getSingleUserOrders,
  getAllUserOrdersByStatus,
  getAllOrders,
  getSingleOrders,
  getAllOrdersByStatus,
  updateOrderStatus,
  payment,
  createOrUpdateReview,
  createCODOrder,
  createBkashOrder,
  createNagadOrder,
  createRocketOrder,
  createCoupon,
  getCoupon,
  getAllCoupon,
  deleteCoupons,
  updateCoupon,
  getCouponAdmin,
  getFeaturedCoupon,
} = require("../controllers/orderController.js");

const {
  isAuthorized,
  isAuthenticatedUser,
} = require("../middleware/authUser.js");

const router = express.Router();

// COUPONS
router
  .route("/coupon")
  .get(isAuthenticatedUser, isAuthorized("admin"), getAllCoupon)
  .post(isAuthenticatedUser, isAuthorized("admin"), createCoupon)
  .delete(isAuthenticatedUser, isAuthorized("admin"), deleteCoupons);
router.route("/coupon/:code").post(isAuthenticatedUser, getCoupon);
router.route("/featured/coupon").get(getFeaturedCoupon);

router
  .route("/coupon/:id")
  .get(isAuthenticatedUser, isAuthorized("admin"), getCouponAdmin);

router
  .route("/coupon/update/:id")
  .post(isAuthenticatedUser, isAuthorized("admin"), updateCoupon);

//USER ORDERS
router
  .route("/order/cash-on-delivery")
  .post(isAuthenticatedUser, createCODOrder);
router.route("/order/bkash").post(isAuthenticatedUser, createBkashOrder);
router.route("/order/nagad").post(isAuthenticatedUser, createNagadOrder);
router.route("/order/rocket").post(isAuthenticatedUser, createRocketOrder);
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
