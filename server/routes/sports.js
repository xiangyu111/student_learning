const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth, isTeacherOrAdmin, isAdmin, isStudent } = require('../middlewares/auth');
const { createUploader, handleUploadError } = require('../utils/fileUpload');

// 文件上传中间件
const uploadProofMaterials = createUploader('sports', 'proofMaterials', 5);

// @route   POST /api/sports/activities
// @desc    创建体育活动
// @access  Private (Teacher, Admin)
router.post('/activities', [
  auth,
  isTeacherOrAdmin,
  check('activityName', '活动名称不能为空').notEmpty(),
  check('startTime', '开始时间不能为空').notEmpty(),
  check('endTime', '结束时间不能为空').notEmpty(),
  check('location', '活动地点不能为空').notEmpty(),
  check('organizer', '组织单位不能为空').notEmpty(),
  check('maxParticipants', '最大参与人数必须为有效数字').optional().isNumeric(),
  check('creditValue', '学分值必须为有效数字').isNumeric()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/sports/activities
// @desc    获取体育活动列表
// @access  Private
router.get('/activities', auth, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/sports/activities/:id
// @desc    获取体育活动详情
// @access  Private
router.get('/activities/:id', auth, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   PUT /api/sports/activities/:id
// @desc    更新体育活动
// @access  Private (Teacher, Admin)
router.put('/activities/:id', [
  auth,
  isTeacherOrAdmin,
  check('activityName', '活动名称不能为空').optional().notEmpty(),
  check('creditValue', '学分值必须为有效数字').optional().isNumeric()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   DELETE /api/sports/activities/:id
// @desc    删除体育活动
// @access  Private (Admin)
router.delete('/activities/:id', auth, isAdmin, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/sports/activities/:id/register
// @desc    学生报名参加体育活动
// @access  Private (Student)
router.post('/activities/:id/register', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/sports/activities/:id/withdraw
// @desc    学生取消体育活动报名
// @access  Private (Student)
router.post('/activities/:id/withdraw', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/sports/activities/:id/participants
// @desc    获取体育活动参与者列表
// @access  Private (Teacher, Admin)
router.get('/activities/:id/participants', auth, isTeacherOrAdmin, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/sports/activities/:id/attendance
// @desc    记录体育活动出勤
// @access  Private (Teacher, Admin)
router.post('/activities/:id/attendance', [
  auth,
  isTeacherOrAdmin,
  check('studentIds', '学生ID列表不能为空').isArray()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/sports/data
// @desc    提交日常体育锻炼数据
// @access  Private (Student)
router.post('/data', [
  auth,
  isStudent,
  uploadProofMaterials,
  handleUploadError,
  check('date', '日期不能为空').notEmpty(),
  check('activityType', '活动类型不能为空').notEmpty(),
  check('duration', '持续时间必须为有效数字(分钟)').isNumeric(),
  check('distance', '距离必须为有效数字(米)').optional().isNumeric(),
  check('steps', '步数必须为有效数字').optional().isNumeric(),
  check('calories', '卡路里必须为有效数字').optional().isNumeric()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/sports/data
// @desc    获取我的体育锻炼数据
// @access  Private (Student)
router.get('/data', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   POST /api/sports/apply
// @desc    申请体育锻炼学分
// @access  Private (Student)
router.post('/apply', [
  auth,
  isStudent,
  uploadProofMaterials,
  handleUploadError,
  check('activityIds', '活动ID列表不能为空').optional().isArray(),
  check('dataIds', '体育数据ID列表不能为空').optional().isArray(),
  check('description', '申请描述不能为空').notEmpty()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/sports/applications
// @desc    获取我的体育锻炼学分申请
// @access  Private (Student)
router.get('/applications', auth, isStudent, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   GET /api/sports/pending-applications
// @desc    获取待审核的体育锻炼学分申请
// @access  Private (Teacher, Admin)
router.get('/pending-applications', auth, isTeacherOrAdmin, (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

// @route   PUT /api/sports/applications/:id
// @desc    审核体育锻炼学分申请
// @access  Private (Teacher, Admin)
router.put('/applications/:id', [
  auth,
  isTeacherOrAdmin,
  check('status', '状态必须是approved或rejected').isIn(['approved', 'rejected']),
  check('creditValue', '学分值必须为有效数字').optional().isNumeric(),
  check('comment', '审核评语').optional()
], (req, res) => {
  res.status(501).json({ message: '功能尚未实现' });
});

module.exports = router; 