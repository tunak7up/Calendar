const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail');
const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.secure,
  auth: mailConfig.auth,
});

const sendMail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: mailConfig.from,
    to,
    subject,
    html,
    text, 
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Mail sent:', info.messageId);
  return info;
};

module.exports = { 
    sendMail,
};