const { Activity } = require('../models/Activity');
const User = require('../models/User');

// 获取所有活动
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll();
    res.status(200).json(activities);
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ message: '获取活动列表失败', error: error.message });
  }
};

// 获取单个活动详情
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    res.status(200).json(activity);
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ message: '获取活动详情失败', error: error.message });
  }
};

// 创建新活动
exports.createActivity = async (req, res) => {
  try {
    const newActivity = await Activity.create(req.body);
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ message: '创建活动失败', error: error.message });
  }
};

// 更新活动
exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    await activity.update(req.body);
    res.status(200).json(activity);
  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json({ message: '更新活动失败', error: error.message });
  }
};

// 删除活动
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    await activity.destroy();
    res.status(200).json({ message: '活动已成功删除' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ message: '删除活动失败', error: error.message });
  }
}; 