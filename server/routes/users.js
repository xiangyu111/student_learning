const express = require('express');
const router = express.Router();
const { 
  getUserById, 
  updateUser, 
  getStudents, 
  getTeachers, 
  getDepartments, 
  getMajors, 
  getClasses, 
  getGrades,
  getRecommendedActivities
} = require('../controllers/userController');
const { auth, isTeacherOrAdmin, isAdmin } = require('../uploads/auth');
const { check } = require('express-validator');

// @route   GET /api/users/students
// @desc    获取学生列表
// @access  Private (Teacher, Admin)
router.get('/students', auth, isTeacherOrAdmin, getStudents);

// @route   GET /api/users/teachers
// @desc    获取教师列表
// @access  Private (Admin)
router.get('/teachers', auth, isAdmin, getTeachers);

// @route   GET /api/users/departments
// @desc    获取部门列表
// @access  Private
router.get('/departments', auth, getDepartments);

// @route   GET /api/users/majors
// @desc    获取专业列表
// @access  Private
router.get('/majors', auth, getMajors);

// @route   GET /api/users/classes
// @desc    获取班级列表
// @access  Private
router.get('/classes', auth, getClasses);

// @route   GET /api/users/grades
// @desc    获取年级列表
// @access  Private
router.get('/grades', auth, getGrades);

// @route   GET /api/users/recommended-activities
// @desc    获取个性化学习活动推荐
// @access  Private (Student)
router.get('/recommended-activities', auth, getRecommendedActivities);

// @route   GET /api/users/:id
// @desc    获取用户资料
// @access  Private
router.get('/:id', auth, getUserById);

// @route   PUT /api/users/:id
// @desc    更新用户资料
// @access  Private
router.put('/:id', [
  auth,
  check('email', '请提供有效的邮箱').optional().isEmail(),
  check('phoneNumber', '请提供有效的手机号').optional().isMobilePhone('zh-CN')
], updateUser);

module.exports = router; 