const express = require('express');
const router = express.Router();
const { auth } = require('../uploads/auth');
const dashboardController = require('../controllers/dashboardController');

// 获取学生仪表盘数据
router.get('/student', auth, dashboardController.getStudentDashboard);

// 获取教师/管理员仪表盘数据
router.get('/teacher', auth, dashboardController.getTeacherDashboard);

module.exports = router; 