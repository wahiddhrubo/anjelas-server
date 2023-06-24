const app = require("./app.js");
const dotenv = require("dotenv");
const connectToDb = require("./config/db.js");

//CONFIG
dotenv.config({ path: "config/config.env" });

//DATABASE CONNECTION
connectToDb();

app.listen(process.env.PORT, () => {
  console.log("Server is running!!!");
});
