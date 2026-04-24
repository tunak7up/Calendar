const multer = require('multer');
const path = require('path');
const fs = require('fs');

// T?o th? m?c uploads n?u ch?a c?
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}