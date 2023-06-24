const upload = require("../utils/cloudinary.js");

const express = require("express");
const router = express.Router();
const {
  isAuthorized,
  isAuthenticatedUser,
} = require("../middleware/authUser.js");

router
  .route("/admin/upload/image")
  .post(
    isAuthenticatedUser,
    isAuthorized("admin"),
    upload.single("image"),
    async (req, res) => {
      const imageUri = {
        public_id: "https://res.cloudinary.com",
        url: req.file.path,
        created_at: new Date(),
      };

      return res.status(200).json({ success: true, imageUri });
    }
  );

module.exports = router;
