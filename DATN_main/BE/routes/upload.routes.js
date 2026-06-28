import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    const urls = req.files.map(file => `/uploads/${file.filename}`);
    
    res.json({
      message: 'Upload thành công',
      urls
    });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ error: 'Lỗi server khi upload ảnh' });
  }
});

export default router;
