const { UAParser } = require('ua-parser-js');

const getClientDevice = (req) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const os = `${result.os.name || ''} ${result.os.version || ''}`.trim();
    const browser = `${result.browser.name || ''} ${result.browser.version || ''}`.trim();
    const deviceType = result.device.type ? (result.device.type.charAt(0).toUpperCase() + result.device.type.slice(1)) : 'Desktop';

    const info = [deviceType, browser, os].filter(Boolean).join(' | ');
    return info || 'Unknown Device';
  } catch (err) {
    return 'Unknown Device';
  }
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const remoteAddr = req.socket.remoteAddress?.replace('::ffff:', '') || req.ip;
  return remoteAddr;
};

const captureClientIp = (req, res, next) => {
  req.clientIp = getClientIp(req);
  req.clientDevice = getClientDevice(req);
  console.log(`[IP Capture] IP: ${req.clientIp} | path: ${req.path}`);
  next();
};

module.exports = {
  captureClientIp,
  getClientIp,
  getClientDevice
};