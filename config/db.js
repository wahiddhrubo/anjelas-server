const mongoose = require("mongoose");

const connectToDb = () => {
  mongoose
    .connect(process.env.MONGODB_URL, {})
    .then((data) => {
      console.log("MongoDb Running!!! ");
    })
    .catch((err) => {
      console.log({ error: err });
    });
};
const db = mongoose.connection;
db.once("open", (_) => {
  console.log("Database connected:", process.env.MONGODB_URL);
});

db.on("error", (err) => {
  console.error("connection error:", err);
});

module.exports = connectToDb;
