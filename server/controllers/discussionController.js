const { Discussion, DiscussionReply } = require('../models/Discussion');
const User = require('../models/User');
const { Op } = require('sequelize');

// 获取所有讨论
exports.getAllDiscussions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tag, 
      sortBy = 'createdAt', 
      order = 'DESC',
      search
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereClause = {};
    if (category) whereClause.category = category;
    if (tag) whereClause.tags = { [Op.like]: `%${tag}%` };
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 排序选项
    let orderOption;
    switch(sortBy) {
      case 'lastReply':
        orderOption = [['lastReplyTime', order]];
        break;
      case 'views':
        orderOption = [['viewCount', order]];
        break;
      case 'replies':
        orderOption = [['replyCount', order]];
        break;
      default:
        orderOption = [['createdAt', order]];
    }
    
    // 置顶帖子始终排在最前面
    if (order === 'DESC') {
      orderOption.unshift(['isSticky', 'DESC']);
    }
    
    const { count, rows: discussions } = await Discussion.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderOption,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        },
        {
          model: User,
          as: 'lastReplier',
          attributes: ['id', 'username', 'name', 'avatar']
        }
      ]
    });
    
    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      discussions
    });
  } catch (error) {
    console.error('获取讨论列表失败:', error);
    res.status(500).json({ message: '获取讨论列表失败', error: error.message });
  }
};

// 获取单个讨论详情及其回复
exports.getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 增加浏览次数
    await Discussion.increment('viewCount', { by: 1, where: { id } });
    
    const discussion = await Discussion.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        },
        {
          model: DiscussionReply,
          as: 'replies',
          where: { parentReplyId: null }, // 只获取顶级回复
          required: false,
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'name', 'avatar']
            }
          ]
        }
      ]
    });
    
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    res.json(discussion);
  } catch (error) {
    console.error('获取讨论详情失败:', error);
    res.status(500).json({ message: '获取讨论详情失败', error: error.message });
  }
};

// 创建新讨论
exports.createDiscussion = async (req, res) => {
  try {
    let { title, content, category, tags, attachments } = req.body;
    
    // 模拟用户认证，确保即使没有auth中间件也能创建讨论
    // 注意：在生产环境中，应该使用proper认证
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      // 使用默认用户ID，实际应用中应该要求用户登录
      userId = 1; // 默认用户ID
    }
    
    // 验证分类
    const validCategories = ['素拓活动', '讲座活动', '劳动学分', '综合'];
    if (!category || !validCategories.includes(category)) {
      category = '综合'; // 默认分类
    }
    
    const discussion = await Discussion.create({
      title,
      content,
      userId,
      category,
      tags,
      attachments
    });
    
    res.status(201).json(discussion);
  } catch (error) {
    console.error('创建讨论失败:', error);
    res.status(500).json({ message: '创建讨论失败', error: error.message });
  }
};

// 更新讨论
exports.updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, content, category, tags, attachments } = req.body;
    
    // 模拟用户认证
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      // 使用默认用户ID
      userId = 1;
    }
    
    // 验证分类
    const validCategories = ['素拓活动', '讲座活动', '劳动学分', '综合'];
    if (!category || !validCategories.includes(category)) {
      category = '综合'; // 默认分类
    }
    
    const discussion = await Discussion.findByPk(id);
    
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    // 检查是否是讨论作者或管理员
    if (discussion.userId !== userId) {
      return res.status(403).json({ message: '没有修改权限' });
    }
    
    await discussion.update({
      title,
      content,
      category,
      tags,
      attachments
    });
    
    res.json(discussion);
  } catch (error) {
    console.error('更新讨论失败:', error);
    res.status(500).json({ message: '更新讨论失败', error: error.message });
  }
};

// 删除讨论
exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 模拟用户认证
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      // 使用默认用户ID
      userId = 1;
    }
    
    const discussion = await Discussion.findByPk(id);
    
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    // 检查是否是讨论作者
    if (discussion.userId !== userId) {
      return res.status(403).json({ message: '没有删除权限' });
    }
    
    // 删除相关回复
    await DiscussionReply.destroy({ where: { discussionId: id } });
    
    // 删除讨论
    await discussion.destroy();
    
    res.json({ message: '讨论已删除' });
  } catch (error) {
    console.error('删除讨论失败:', error);
    res.status(500).json({ message: '删除讨论失败', error: error.message });
  }
};

// 创建回复
exports.createReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content, parentReplyId, attachments } = req.body;
    
    // 模拟用户认证
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      // 使用默认用户ID
      userId = 1;
    }
    
    const discussion = await Discussion.findByPk(discussionId);
    
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    if (discussion.isLocked) {
      return res.status(403).json({ message: '该讨论已锁定，不能回复' });
    }
    
    // 创建回复
    const reply = await DiscussionReply.create({
      discussionId,
      content,
      userId,
      parentReplyId,
      attachments
    });
    
    // 更新讨论的回复数和最后回复信息
    await discussion.update({ 
      replyCount: discussion.replyCount + 1,
      lastReplyTime: new Date(),
      lastReplyUserId: userId
    });
    
    // 加载回复作者信息
    const replyWithAuthor = await DiscussionReply.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        }
      ]
    });
    
    res.status(201).json(replyWithAuthor);
  } catch (error) {
    console.error('创建回复失败:', error);
    res.status(500).json({ message: '创建回复失败', error: error.message });
  }
};

// 获取回复的子回复
exports.getChildReplies = async (req, res) => {
  try {
    const { replyId } = req.params;
    
    const childReplies = await DiscussionReply.findAll({
      where: { parentReplyId: replyId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.json(childReplies);
  } catch (error) {
    console.error('获取子回复失败:', error);
    res.status(500).json({ message: '获取子回复失败', error: error.message });
  }
};

// 更新回复
exports.updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content, attachments } = req.body;
    const userId = req.user.id;
    
    const reply = await DiscussionReply.findByPk(replyId);
    
    if (!reply) {
      return res.status(404).json({ message: '回复不存在' });
    }
    
    // 检查是否是回复作者或管理员
    if (reply.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有修改权限' });
    }
    
    await reply.update({ content, attachments });
    
    res.json(reply);
  } catch (error) {
    console.error('更新回复失败:', error);
    res.status(500).json({ message: '更新回复失败', error: error.message });
  }
};

// 删除回复
exports.deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;
    
    const reply = await DiscussionReply.findByPk(replyId);
    
    if (!reply) {
      return res.status(404).json({ message: '回复不存在' });
    }
    
    // 检查是否是回复作者或管理员
    if (reply.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有删除权限' });
    }
    
    // 获取讨论信息，用于更新回复计数
    const discussion = await Discussion.findByPk(reply.discussionId);
    
    // 删除子回复
    await DiscussionReply.destroy({ where: { parentReplyId: replyId } });
    
    // 删除回复
    await reply.destroy();
    
    // 更新讨论的回复数
    if (discussion) {
      await discussion.update({ 
        replyCount: Math.max(0, discussion.replyCount - 1) 
      });
    }
    
    res.json({ message: '回复已删除' });
  } catch (error) {
    console.error('删除回复失败:', error);
    res.status(500).json({ message: '删除回复失败', error: error.message });
  }
};

// 管理员操作：置顶/取消置顶讨论
exports.toggleSticky = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discussion = await Discussion.findByPk(id);
    
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    // 检查是否是管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }
    
    await discussion.update({ isSticky: !discussion.isSticky });
    
    res.json({ 
      message: discussion.isSticky ? '讨论已置顶' : '讨论已取消置顶',
      isSticky: discussion.isSticky
    });
  } catch (error) {
    console.error('修改置顶状态失败:', error);
    res.status(500).json({ message: '修改置顶状态失败', error: error.message });
  }
};

// 管理员操作：锁定/解锁讨论
exports.toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discussion = await Discussion.findByPk(id);
    
    if (!discussion) {
      return res.status(404).json({ message: '讨论不存在' });
    }
    
    // 检查是否是管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }
    
    await discussion.update({ isLocked: !discussion.isLocked });
    
    res.json({ 
      message: discussion.isLocked ? '讨论已锁定' : '讨论已解锁',
      isLocked: discussion.isLocked
    });
  } catch (error) {
    console.error('修改锁定状态失败:', error);
    res.status(500).json({ message: '修改锁定状态失败', error: error.message });
  }
};

// 接受回复为最佳回复
exports.acceptReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.id;
    
    const reply = await DiscussionReply.findByPk(replyId, {
      include: [
        {
          model: Discussion,
          as: 'discussion'
        }
      ]
    });
    
    if (!reply) {
      return res.status(404).json({ message: '回复不存在' });
    }
    
    const discussion = reply.discussion;
    
    // 检查是否是讨论作者或管理员
    if (discussion.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }
    
    // 将所有回复设为非最佳回复
    await DiscussionReply.update(
      { isAccepted: false },
      { where: { discussionId: discussion.id } }
    );
    
    // 设置当前回复为最佳回复
    await reply.update({ isAccepted: true });
    
    res.json({ message: '已设置为最佳回复', reply });
  } catch (error) {
    console.error('设置最佳回复失败:', error);
    res.status(500).json({ message: '设置最佳回复失败', error: error.message });
  }
};

// 获取讨论分类和标签统计
exports.getCategoriesAndTags = async (req, res) => {
  try {
    // 固定分类
    const fixedCategories = [
      { name: '素拓活动', count: 0 },
      { name: '讲座活动', count: 0 },
      { name: '劳动学分', count: 0 },
      { name: '综合', count: 0 }
    ];
    
    // 获取所有讨论，选择category和tags字段
    const discussions = await Discussion.findAll({
      attributes: ['category', 'tags']
    });
    
    // 统计分类计数
    discussions.forEach(discussion => {
      if (discussion.category) {
        const category = fixedCategories.find(c => c.name === discussion.category);
        if (category) {
          category.count += 1;
        }
      }
    });
    
    // 统计标签
    const tags = {};
    discussions.forEach(discussion => {
      if (discussion.tags) {
        const tagArray = discussion.tags.split(',');
        tagArray.forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tags[trimmedTag] = (tags[trimmedTag] || 0) + 1;
          }
        });
      }
    });
    
    res.json({
      categories: fixedCategories,
      tags: Object.entries(tags).map(([name, count]) => ({ name, count }))
    });
  } catch (error) {
    console.error('获取分类和标签统计失败:', error);
    res.status(500).json({ message: '获取分类和标签统计失败', error: error.message });
  }
}; 