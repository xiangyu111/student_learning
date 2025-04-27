const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const analysisController = require('../controllers/analysisController');

// 通用分析数据路由 - 匹配前端的 /api/analysis 请求
router.get('/', auth, analysisController.getAnalysisData);

// 获取学生参与统计数据
router.get('/student-participation', auth, analysisController.getStudentParticipation);

// 获取活动类型统计
router.get('/activity-types', auth, analysisController.getActivityTypeStats);

// 获取学分累积统计
router.get('/credit-accumulation', auth, analysisController.getCreditAccumulation);

module.exports = router; 