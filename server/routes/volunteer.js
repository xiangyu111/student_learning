const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, isTeacherOrAdmin, isAdmin, isStudent } = require('../middlewares/auth');
const { createUploader, handleUploadError } = require('../utils/fileUpload');

// 文件上传中间件
const uploadProofMaterials = createUploader('volunteer', 'proofMaterials', 5);

// @route   POST /api/volunteer/services
// @desc    创建志愿服务活动
// @access  Private (Teacher, Admin)
router.post('/services', [
  auth,
  isTeacherOrAdmin,
  check('serviceName', '服务名称不能为空').notEmpty(),
  check('startTime', '开始时间不能为空').notEmpty(),
  check('location', '服务地点不能为空').notEmpty(),
  check('organizer', '组织单位不能为空').notEmpty(),
  check('creditValue', '学分值必须为有效数字').isNumeric()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/volunteer/services
// @desc    获取志愿服务活动列表
// @access  Private
router.get('/services', auth, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/volunteer/services/:id
// @desc    获取志愿服务活动详情
// @access  Private
router.get('/services/:id', auth, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   PUT /api/volunteer/services/:id
// @desc    更新志愿服务活动
// @access  Private (Teacher, Admin)
router.put('/services/:id', [
  auth,
  isTeacherOrAdmin,
  check('creditValue', '学分值必须为有效数字').optional().isNumeric()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   DELETE /api/volunteer/services/:id
// @desc    删除志愿服务活动
// @access  Private (Admin)
router.delete('/services/:id', auth, isAdmin, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/volunteer/services/:id/register
// @desc    学生报名参加志愿服务
// @access  Private (Student)
router.post('/services/:id/register', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/volunteer/services/:id/withdraw
// @desc    学生取消志愿服务报名
// @access  Private (Student)
router.post('/services/:id/withdraw', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/volunteer/services/:id/participants
// @desc    获取志愿服务活动参与者列表
// @access  Private (Teacher, Admin)
router.get('/services/:id/participants', auth, isTeacherOrAdmin, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/volunteer/apply
// @desc    申请志愿服务学分
// @access  Private (Student)
router.post('/apply', [
  auth,
  isStudent,
  uploadProofMaterials,
  handleUploadError,
  check('serviceId', '服务ID不能为空').optional(),
  check('serviceHours', '服务时长必须为有效数字').isNumeric(),
  check('description', '服务描述不能为空').notEmpty()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/volunteer/applications
// @desc    获取我的志愿服务学分申请
// @access  Private (Student)
router.get('/applications', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/volunteer/pending-applications
// @desc    获取待审核的志愿服务学分申请
// @access  Private (Teacher, Admin)
router.get('/pending-applications', auth, isTeacherOrAdmin, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   PUT /api/volunteer/applications/:id
// @desc    审核志愿服务学分申请
// @access  Private (Teacher, Admin)
router.put('/applications/:id', [
  auth,
  isTeacherOrAdmin,
  check('status', '状态必须是approved或rejected').isIn(['approved', 'rejected']),
  check('adjustedHours', '调整后的服务时长必须为有效数字').optional().isNumeric(),
  check('adjustedCreditValue', '调整后的学分值必须为有效数字').optional().isNumeric()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

module.exports = router; 