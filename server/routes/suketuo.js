const express = require('express');
const router = express.Router();
const { 
  createSuketuoActivity,
  getSuketuoActivities,
  getSuketuoActivityById,
  updateSuketuoActivity,
  deleteSuketuoActivity,
  applySuketuoCredit,
  getMyApplications,
  getPendingApplications,
  reviewApplication,
  getActivityTypes
} = require('../controllers/suketuoController');
const { auth, isTeacherOrAdmin, isAdmin, isStudent } = require('../uploads/auth');
const { check } = require('express-validator');
const { createUploader, handleUploadError } = require('../utils/fileUpload');

// 文件上传中间件
const uploadProofMaterials = createUploader('suketuo', 'proofMaterials', 5);

// @route   POST /api/suketuo/activities
// @desc    创建素拓活动
// @access  Private (Teacher, Admin)
router.post('/activities', [
  auth,
  isTeacherOrAdmin,
  check('activityName', '活动名称不能为空').notEmpty(),
  check('activityType', '活动类型不能为空').notEmpty(),
  check('creditValue', '学分值必须为有效数字').isNumeric()
], createSuketuoActivity);

// @route   GET /api/suketuo/activities
// @desc    获取素拓活动列表
// @access  Private
router.get('/activities', auth, getSuketuoActivities);

// @route   GET /api/suketuo/activities/:id
// @desc    获取素拓活动详情
// @access  Private
router.get('/activities/:id', auth, getSuketuoActivityById);

// @route   PUT /api/suketuo/activities/:id
// @desc    更新素拓活动
// @access  Private (Teacher, Admin)
router.put('/activities/:id', [
  auth,
  isTeacherOrAdmin,
  check('creditValue', '学分值必须为有效数字').optional().isNumeric()
], updateSuketuoActivity);

// @route   DELETE /api/suketuo/activities/:id
// @desc    删除素拓活动
// @access  Private (Admin)
router.delete('/activities/:id', auth, isAdmin, deleteSuketuoActivity);

// @route   POST /api/suketuo/apply
// @desc    申请素拓学分
// @access  Private (Student)
router.post('/apply', [
  auth,
  isStudent,
  uploadProofMaterials,
  handleUploadError,
  check('activityId', '活动ID不能为空').notEmpty(),
  check('creditValue', '学分值必须为有效数字').isNumeric()
], applySuketuoCredit);

// @route   GET /api/suketuo/applications
// @desc    获取我的素拓学分申请记录
// @access  Private (Student)
router.get('/applications', auth, isStudent, getMyApplications);

// @route   GET /api/suketuo/pending-applications
// @desc    获取待审核的素拓学分申请
// @access  Private (Teacher, Admin)
router.get('/pending-applications', auth, isTeacherOrAdmin, getPendingApplications);

// @route   PUT /api/suketuo/applications/:id
// @desc    审核素拓学分申请
// @access  Private (Teacher, Admin)
router.put('/applications/:id', [
  auth,
  isTeacherOrAdmin,
  check('status', '状态必须是approved或rejected').isIn(['approved', 'rejected']),
  check('adjustedCreditValue', '调整后的学分值必须为有效数字').optional().isNumeric()
], reviewApplication);

// @route   GET /api/suketuo/activity-types
// @desc    获取素拓活动类型列表
// @access  Private
router.get('/activity-types', auth, getActivityTypes);

module.exports = router; 