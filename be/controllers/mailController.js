const mailService = require('../services/mailService');
const { sendRes } = require('../utils/responseHelper');

const sendMail = async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;
        await mailService.sendMail({to, subject, html, text});
        sendRes(res, 200, 'Email sent successfully');
    } catch (error) {
        sendRes(res, 500, 'Error sending email', null, error.message);
    }
};

module.exports = {
    sendMail
};