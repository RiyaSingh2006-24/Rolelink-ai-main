const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads/resumes');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'application/x-pdf', 'application/octet-stream', 'binary/octet-stream'];
  const hasPdfExtension = path.extname(file.originalname || '').toLowerCase() === '.pdf';

  if (!hasPdfExtension || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Please upload a valid PDF resume.'), false);
  }

  cb(null, true);
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = uploadResume;
