const multer = require("multer");

//FOR TESTING
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

//FOR TESTING
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

//FOR TESTING
const testStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: "Anjelas-kitchen",
	},
});
module.exports = multer({ storage: testStorage });
