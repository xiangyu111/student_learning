const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/authController');
const { auth } = require('../middlewares/auth');
const { check } = require('express-validator');

// @route   POST /api/auth/register
// @desc    注册新用户
// @access  Public
router.post('/register', [
  check('username', '用户名不能为空').notEmpty(),
  check('password', '密码长度必须至少为6个字符').isLength({ min: 6 }),
  check('name', '姓名不能为空').notEmpty(),
  check('email', '请提供有效的邮箱').isEmail(),
  check('role', '角色必须是学生、教师或管理员').isIn(['student', 'teacher', 'admin'])
], register);

// @route   POST /api/auth/login
// @desc    用户登录并返回令牌
// @access  Public
router.post('/login', [
  check('username', '请输入用户名').notEmpty(),
  check('password', '请输入密码').exists()
], login);

// @route   GET /api/auth/me
// @desc    获取当前用户信息
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/password
// @desc    更新用户密码
// @access  Private
router.put('/password', [
  auth,
  check('currentPassword', '当前密码不能为空').notEmpty(),
  check('newPassword', '新密码长度必须至少为6个字符').isLength({ min: 6 })
], updatePassword);

module.exports = router;
