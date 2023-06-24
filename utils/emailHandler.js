const nodemailer = require("nodemailer");
const ejs = require("ejs");
const dotenv = require("dotenv");

//CONFIG
dotenv.config({ path: "config/config.env" });

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({ receiver, tempLoc, subject, link }) => {
  ejs.renderFile(__dirname + tempLoc, { link }, async (err, data) => {
    if (!err) {
      const mailOptions = {
        from: "email_username",
        to: receiver,
        subject: subject,
        html: data,
      };

      await transport.sendMail(mailOptions);
    } else {
      console.log(err);
    }
  });
};

module.exports = sendEmail;
