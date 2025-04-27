const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证用户Token
exports.auth = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const token = req.header('x-auth-token');

    // 检查是否有token
    if (!token) {
      return res.status(401).json({ message: '无访问权限，未提供认证令牌' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '令牌无效' });
  }
};

// 验证用户角色 - 教师
exports.isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ message: '权限不足，需要教师角色' });
  }
  next();
};

// 验证用户角色 - 学生
exports.isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: '权限不足，需要学生角色' });
  }
  next();
};

// 验证用户角色 - 管理员
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '权限不足，需要管理员角色' });
  }
  next();
};

// 验证用户角色 - 教师或管理员
exports.isTeacherOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: '权限不足，需要教师或管理员角色' });
  }
  next();
}; 