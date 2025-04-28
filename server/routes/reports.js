const express = require('express');
const router = express.Router();
const { auth } = require('../uploads/auth');
const reportController = require('../controllers/reportController');

// 生成学生活动参与报告
router.get('/student/:id', auth, reportController.generateStudentReport);

// 生成活动统计报告
router.get('/activity/:id', auth, reportController.generateActivityReport);

// 生成系统整体使用报告
router.get('/system', auth, reportController.generateSystemReport);

module.exports = router; 