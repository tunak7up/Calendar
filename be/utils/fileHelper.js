const fs = require('fs');
const path = require('path');

const extractFileName = (fileUrl) => {
    if (!fileUrl) return null;
    try {
        let cleanUrl = String(fileUrl).trim();
        // Remove query parameters or hashes
        cleanUrl = cleanUrl.split('?')[0].split('#')[0];
        
        // Strip http://... or https://... domain prefix if present
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            const match = cleanUrl.match(/^https?:\/\/[^\/]+(\/.*)$/i);
            if (match && match[1]) {
                cleanUrl = match[1];
            }
        }
        // Decode URL encoding (%20 to space, etc.)
        cleanUrl = decodeURIComponent(cleanUrl);
        return path.basename(cleanUrl);
    } catch (e) {
        try {
            return path.basename(decodeURIComponent(String(fileUrl).split('?')[0]));
        } catch (err) {
            return path.basename(String(fileUrl).split('?')[0]);
        }
    }
};

const getPossibleUploadPaths = (fileName) => {
    if (!fileName) return [];
    const possibleDirs = [
        process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : null,
        path.join(__dirname, '../uploads'),
        path.join(process.cwd(), 'uploads'),
        path.join(process.cwd(), 'be/uploads'),
        '/app/uploads'
    ].filter(Boolean);

    return Array.from(new Set(possibleDirs.map(dir => path.join(dir, fileName))));
};

const deletePhysicalFile = (fileUrl) => {
    if (!fileUrl) return false;
    try {
        const fileName = extractFileName(fileUrl);
        if (!fileName) return false;

        const candidatePaths = getPossibleUploadPaths(fileName);
        for (const filePath of candidatePaths) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[fileHelper] Successfully deleted physical file: ${filePath}`);
                return true;
            }
        }
        console.warn(`[fileHelper] File not found on disk for URL: ${fileUrl} (extracted fileName: ${fileName})`);
        return false;
    } catch (err) {
        console.error(`[fileHelper] Error deleting physical file for ${fileUrl}:`, err);
        return false;
    }
};

module.exports = {
    extractFileName,
    deletePhysicalFile
};
