const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${unique}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const isPdf =
    file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf';

  if (!isPdf) {
    return cb(new Error('Only PDF files are accepted.'));
  }
  cb(null, true);
}

const maxSizeMb = Number(process.env.MAX_UPLOAD_MB || 15);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = upload;
