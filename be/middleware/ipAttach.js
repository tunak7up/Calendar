/**
 * IP Capture Middleware
 * Chỉ lấy IP của client và gắn vào req để controller lưu lại
 * (check_in_ip / check_out_ip). Không còn whitelist, không chặn request.
 */

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const remoteAddr = req.socket.remoteAddress?.replace('::ffff:', '') || req.ip;
  return remoteAddr;
};

/**
 * Middleware gắn clientIp vào req
 */
const captureClientIp = (req, res, next) => {
  req.clientIp = getClientIp(req);
  console.log(`[IP Capture] IP: ${req.clientIp} | path: ${req.path}`);
  next();
};

module.exports = {
  captureClientIp,
  getClientIp
};