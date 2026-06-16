const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail');
const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.secure,
  auth: mailConfig.auth,
  name: mailConfig.name,
});

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const htmlToPlainText = (html) => {
  if (!html) return '';
  const plain = html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain;
};

const sendMail = async ({ to, subject, html, text }) => {
  if (!to || !isValidEmail(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  const mailOptions = {
    from: mailConfig.from,
    to,
    subject,
    html,
    text: text || htmlToPlainText(html) || 'Nội dung email tự động từ hệ thống. Vui lòng không trả lời.',
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Mail sent:', info.messageId);
  return info;
};

module.exports = { 
    sendMail,
};