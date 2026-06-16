module.exports = {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT || 587,
  secure: false, // true nếu port 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  name: process.env.MAIL_NAME || (process.env.MAIL_USER && process.env.MAIL_USER.split('@')[1]) || 'smtp.gmail.com',
  from: process.env.MAIL_FROM || process.env.MAIL_USER || '"App Name" <no-reply@yourapp.com>',
};