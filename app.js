const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");

//CONFIG
dotenv.config({ path: "config/config.env" });

const errorMiddleware = require("./middleware/error.js");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://anjelas-kitchen-wahiddhrubo.vercel.app",
    ],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
app.use(express.json());
app.use(cookieParser());

const shop = require("./routes/shopRoute.js");
const order = require("./routes/orderRoute.js");
const image = require("./routes/image.js");
const user = require("./routes/userRoute.js");

app.use("/api/v1", shop);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", image);

app.use(errorMiddleware);

module.exports = app;
