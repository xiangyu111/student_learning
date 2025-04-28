const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 认证中间件 - 验证用户是否已登录
 */
exports.auth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.header('x-auth-token');

    // 检查是否有token
    if (!token) {
      return res.status(401).json({ message: '无访问权限，请先登录' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // 获取用户信息
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在或已被删除' });
    }
    
    // 将用户信息添加到请求对象中
    req.user = user;
    next();
  } catch (err) {
    console.error('认证失败:', err);
    return res.status(401).json({ message: '认证失败，请重新登录' });
  }
};

/**
 * 管理员权限中间件 - 检查用户是否有管理员权限
 */
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: '没有管理员权限' });
  }
};

/**
 * 教师权限中间件 - 检查用户是否有教师权限
 */
exports.teacher = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: '没有教师权限' });
  }
};

/**
 * 学生权限中间件 - 检查用户是否有学生权限
 */
exports.student = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ message: '没有学生权限' });
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

// 可选的身份验证中间件
exports.optionalAuth = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const token = req.header('x-auth-token');

    // 如果没有token，则直接进入下一步中间件
    if (!token) {
      console.log('未提供token，匿名访问');
      return next();
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (user) {
      // 将用户信息添加到请求对象
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.log('token验证失败，匿名访问:', error.message);
    next();
  }
}; 