const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 创建文件存储配置
const createStorage = (destination) => {
  const uploadDir = path.join(__dirname, '..', 'uploads', destination);
  ensureDir(uploadDir);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    }
  });
};

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  
  // 检查文件扩展名和MIME类型
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型! 仅支持图片、文档、压缩包等常见文件类型'));
  }
};

// 创建上传中间件
exports.createUploader = (destination, fieldName, maxCount = 5) => {
  const storage = createStorage(destination);
  
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 默认10MB
    },
    fileFilter: fileFilter
  });
  
  // 返回中间件
  return upload.array(fieldName, maxCount);
};

// 处理上传错误的中间件
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件过大，超出了允许的大小限制' });
    }
    return res.status(400).json({ message: `上传文件错误: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// 获取上传文件的相对路径
exports.getUploadedFilePaths = (req) => {
  if (!req.files || req.files.length === 0) {
    return [];
  }
  
  return req.files.map(file => {
    // 返回相对于uploads目录的路径
    return file.path.split('uploads')[1];
  });
}; 