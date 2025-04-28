const express = require('express');
const router = express.Router();
const { auth, isTeacherOrAdmin } = require('../uploads/auth');
const analysisController = require('../controllers/analysisController');

// 防止缓存的中间件
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '-1');
  res.set('Pragma', 'no-cache');
  next();
};

// 通用分析数据路由 - 匹配前端的 /api/analysis 请求
router.get('/', [auth, noCache], analysisController.getAnalysisData);

// 获取学生参与统计数据
router.get('/student-participation', [auth, noCache], analysisController.getStudentParticipation);

// 获取活动类型统计
router.get('/activity-types', [auth, noCache], analysisController.getActivityTypeStats);

// 获取学分累积统计
router.get('/credit-accumulation', [auth, noCache], analysisController.getCreditAccumulation);

// 获取班级学情分析
router.get('/classes/:id/analysis', [auth, isTeacherOrAdmin, noCache], analysisController.getStudentParticipation);

module.exports = router; 