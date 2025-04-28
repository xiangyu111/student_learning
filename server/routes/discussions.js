const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { auth } = require('../uploads/auth');
const upload = require('../uploads/upload');

// 获取所有讨论
router.get('/', discussionController.getAllDiscussions);

// 获取讨论分类和标签统计
router.get('/categories-tags', discussionController.getCategoriesAndTags);

// 获取讨论详情
router.get('/:id', discussionController.getDiscussionById);

// 创建讨论 - 需要认证
router.post('/', auth, upload.array('attachments', 5), discussionController.createDiscussion);

// 更新讨论 - 需要认证
router.put('/:id', auth, upload.array('attachments', 5), discussionController.updateDiscussion);

// 删除讨论 - 需要认证
router.delete('/:id', auth, discussionController.deleteDiscussion);

// 置顶/取消置顶讨论 - 需要管理员权限
router.patch('/:id/sticky', auth, discussionController.toggleSticky);

// 锁定/解锁讨论 - 需要管理员权限
router.patch('/:id/lock', auth, discussionController.toggleLock);

// 创建回复 - 需要认证
router.post('/:discussionId/replies', auth, upload.array('attachments', 5), discussionController.createReply);

// 获取回复的子回复
router.get('/replies/:replyId/children', discussionController.getChildReplies);

// 更新回复 - 需要认证
router.put('/replies/:replyId', auth, upload.array('attachments', 5), discussionController.updateReply);

// 删除回复 - 需要认证
router.delete('/replies/:replyId', auth, discussionController.deleteReply);

// 接受最佳回复 - 需要认证
router.patch('/replies/:replyId/accept', auth, discussionController.acceptReply);

module.exports = router; 