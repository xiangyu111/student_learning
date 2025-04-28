const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require('../uploads/auth');
const progressController = require('../controllers/progressController');

// 获取当前用户的所有进度目标
// GET /api/progress
router.get('/', auth, progressController.getUserProgress);

// 获取统计数据
// GET /api/progress/stats
router.get('/stats', auth, progressController.getProgressStats);

// 获取单个进度目标
// GET /api/progress/:id
router.get('/:id', auth, progressController.getProgressById);

// 创建进度目标
// POST /api/progress
router.post('/', 
  [
    auth,
    check('goalTitle', '目标标题为必填项').not().isEmpty(),
    check('targetDate', '目标日期为必填项').not().isEmpty()
  ],
  progressController.createProgress
);

// 更新进度目标
// PUT /api/progress/:id
router.put('/:id', auth, progressController.updateProgress);

// 删除进度目标
// DELETE /api/progress/:id
router.delete('/:id', auth, progressController.deleteProgress);

// 更新任务状态
// PATCH /api/progress/task/:taskId
router.patch('/task/:taskId', 
  [
    auth,
    check('isCompleted', '任务完成状态为必填项').isBoolean()
  ],
  progressController.updateTaskStatus
);

module.exports = router; 