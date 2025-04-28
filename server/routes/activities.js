const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../uploads/auth');
const activitiesController = require('../controllers/activities');

// 获取所有活动 - 使用可选的身份验证
router.get('/', optionalAuth, activitiesController.getActivities);

// 获取我参与的活动
router.get('/my-activities', auth, activitiesController.getMyActivities);

// 获取单个活动详情
router.get('/:id', auth, activitiesController.getActivityById);

// 创建新活动
router.post('/', auth, activitiesController.createActivity);

// 更新活动
router.put('/:id', auth, activitiesController.updateActivity);

// 删除活动
router.delete('/:id', auth, activitiesController.deleteActivity);

// 报名活动
router.post('/:id/register', auth, activitiesController.registerActivity);

// 取消报名
router.post('/:id/cancel', auth, activitiesController.cancelRegistration);

// 标记参与者完成活动（仅限管理员/教师/活动组织者）
router.post('/:id/complete', auth, activitiesController.completeActivity);

module.exports = router; 