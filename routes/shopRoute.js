const express = require("express");
const {
	getAllItems,
	createItem,
	updateItem,
	deleteItem,
	getSingleItem,
} = require("../controllers/shopController.js");
const {
	isAuthorized,
	isAuthenticatedUser,
} = require("../middleware/authUser.js");

const router = express.Router();

router.route("/items").get(getAllItems);
router
	.route("/admin/items/new")
	.post(isAuthenticatedUser, isAuthorized("admin"), createItem);
router
	.route("/items/:id")
	.put(isAuthenticatedUser, isAuthorized("admin"), updateItem)
	.delete(isAuthenticatedUser, isAuthorized("admin"), deleteItem)
	.get(getSingleItem);

module.exports = router;
