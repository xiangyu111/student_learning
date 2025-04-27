const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      username, 
      password, 
      name, 
      email, 
      role = 'student',
      studentId,
      teacherId,
      department,
      major,
      class: className,
      grade,
      phoneNumber
    } = req.body;

    // 检查用户名是否已存在
    let user = await User.findOne({ where: { username } });
    if (user) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 检查学号/工号是否已存在（如果提供了）
    if (studentId) {
      const existingStudent = await User.findOne({ where: { studentId } });
      if (existingStudent) {
        return res.status(400).json({ message: '学号已被注册' });
      }
    }

    if (teacherId) {
      const existingTeacher = await User.findOne({ where: { teacherId } });
      if (existingTeacher) {
        return res.status(400).json({ message: '工号已被注册' });
      }
    }

    // 创建用户
    user = await User.create({
      username,
      password,
      name,
      email,
      role,
      studentId: role === 'student' ? studentId : null,
      teacherId: role === 'teacher' ? teacherId : null,
      department,
      major,
      class: className,
      grade,
      phoneNumber,
      lastLoginAt: new Date()
    });

    // 生成令牌
    const token = generateToken(user);

    // 返回用户信息和令牌
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
        department: user.department,
        major: user.major,
        class: user.class,
        grade: user.grade,
        suketuoCredits: user.suketuoCredits,
        lectureCredits: user.lectureCredits,
        volunteerCredits: user.volunteerCredits
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() });

    // 生成令牌
    const token = generateToken(user);

    // 返回用户信息和令牌
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
        department: user.department,
        major: user.major,
        class: user.class,
        grade: user.grade,
        suketuoCredits: user.suketuoCredits,
        lectureCredits: user.lectureCredits,
        volunteerCredits: user.volunteerCredits
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取当前登录用户信息
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // 从数据库重新获取用户最新信息
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      teacherId: user.teacherId,
      department: user.department,
      major: user.major,
      class: user.class,
      grade: user.grade,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      suketuoCredits: user.suketuoCredits,
      lectureCredits: user.lectureCredits,
      volunteerCredits: user.volunteerCredits,
      lastLoginAt: user.lastLoginAt
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    更新用户密码
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 获取当前用户
    const user = await User.findByPk(req.user.id);

    // 验证当前密码
    const isMatch = await user.validatePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: '当前密码不正确' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码已成功更新' });
  } catch (error) {
    console.error('更新密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 