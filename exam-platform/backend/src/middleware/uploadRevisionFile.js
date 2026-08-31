const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'revision-sets',
    resource_type: 'raw', // required for PDFs — cloudinary treats non-image files as 'raw'
    // allowed_formats: ['pdf'],
    // keeps original filename instead of a random hash
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\.pdf$/i, '')}`,
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

const uploadRevisionFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = uploadRevisionFile;