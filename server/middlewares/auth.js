const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证用户Token
exports.auth = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const token = req.header('x-auth-token');

    // 检查是否有token
    if (!token) {
      console.log('警告: 请求没有提供token，设置默认用户');
      // 临时设置一个模拟用户，方便测试
      req.user = {
        id: 1001,
        name: '测试用户',
        studentId: '202100001',
        role: 'student',
        suketuoCredits: 2.5,
        lectureCredits: 1.5,
        volunteerCredits: 1.0
      };
      return next();
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
    console.log('验证token失败，设置默认用户:', error.message);
    // 临时设置一个模拟用户，方便测试
    req.user = {
      id: 1001,
      name: '测试用户',
      studentId: '202100001',
      role: 'student',
      suketuoCredits: 2.5,
      lectureCredits: 1.5,
      volunteerCredits: 1.0
    };
    next();
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