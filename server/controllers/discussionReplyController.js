const { DiscussionReply, Discussion } = require('../models/Discussion');
const User = require('../models/User');

// 添加讨论回复
exports.addReply = async (req, res) => {
  try {
    const { discussionId, content, parentReplyId } = req.body;
    const userId = req.user.id;
    
    // 检查讨论是否存在
    const discussion = await Discussion.findByPk(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    // 创建回复
    const reply = await DiscussionReply.create({
      discussionId,
      userId,
      content,
      parentReplyId: parentReplyId || null
    });
    
    // 更新讨论的回复计数和最后回复信息
    await Discussion.update({
      replyCount: discussion.replyCount + 1,
      lastReplyTime: new Date(),
      lastReplierId: userId
    }, { where: { id: discussionId } });
    
    // 获取包含用户信息的回复
    const replyWithUser = await DiscussionReply.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        }
      ]
    });
    
    res.status(201).json(replyWithUser);
  } catch (error) {
    console.error('添加回复失败:', error);
    res.status(500).json({ message: '添加回复失败', error: error.message });
  }
};

// 获取讨论的所有回复
exports.getRepliesByDiscussionId = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: replies } = await DiscussionReply.findAndCountAll({
      where: { discussionId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        }
      ]
    });
    
    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      replies
    });
  } catch (error) {
    console.error('获取回复列表失败:', error);
    res.status(500).json({ message: '获取回复列表失败', error: error.message });
  }
};

// 获取回复的子回复
exports.getChildReplies = async (req, res) => {
  try {
    const { replyId } = req.params;
    
    const childReplies = await DiscussionReply.findAll({
      where: { parentReplyId: replyId },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        }
      ]
    });
    
    res.json(childReplies);
  } catch (error) {
    console.error('获取子回复失败:', error);
    res.status(500).json({ message: '获取子回复失败', error: error.message });
  }
};

// 删除回复
exports.deleteReply = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const reply = await DiscussionReply.findByPk(id);
    
    if (!reply) {
      return res.status(404).json({ message: '回复不存在' });
    }
    
    // 检查是否是回复的作者或管理员
    if (reply.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权删除此回复' });
    }
    
    // 查找并计算将被删除的回复数（包括子回复）
    const childReplies = await DiscussionReply.findAll({
      where: { parentReplyId: id }
    });
    
    const totalDeleteCount = 1 + childReplies.length;
    
    // 先删除子回复
    if (childReplies.length > 0) {
      await DiscussionReply.destroy({
        where: { parentReplyId: id }
      });
    }
    
    // 再删除主回复
    await reply.destroy();
    
    // 更新讨论的回复计数
    await Discussion.decrement('replyCount', { 
      by: totalDeleteCount, 
      where: { id: reply.discussionId } 
    });
    
    // 如果删除的是最后一条回复，更新最后回复信息
    const discussion = await Discussion.findByPk(reply.discussionId);
    const lastReply = await DiscussionReply.findOne({
      where: { discussionId: reply.discussionId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id']
        }
      ]
    });
    
    if (lastReply) {
      await discussion.update({
        lastReplyTime: lastReply.createdAt,
        lastReplierId: lastReply.userId
      });
    } else {
      // 如果没有回复了，重置最后回复信息
      await discussion.update({
        lastReplyTime: null,
        lastReplierId: null
      });
    }
    
    res.json({ message: '回复已删除', deletedCount: totalDeleteCount });
  } catch (error) {
    console.error('删除回复失败:', error);
    res.status(500).json({ message: '删除回复失败', error: error.message });
  }
}; 