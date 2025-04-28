const { Activity, ActivityRegistration } = require('../models/Activity');
const User = require('../models/User');
const { Op } = require('sequelize');

// 获取所有活动 (带筛选)
exports.getActivities = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereConditions = {};
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 获取符合条件的活动数据
    const { count, rows: activities } = await Activity.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [
        ['start_date', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });
    
    // 获取当前用户的报名信息
    if (req.user) {
      const userId = req.user.id;
      const userRegistrations = await ActivityRegistration.findAll({
        where: {
          user_id: userId,
          activity_id: activities.map(a => a.id)
        }
      });
      
      // 添加用户报名状态到活动数据
      activities.forEach(activity => {
        const registration = userRegistrations.find(r => r.activity_id === activity.id);
        activity.dataValues.isRegistered = !!registration;
        activity.dataValues.registrationStatus = registration ? registration.status : null;
      });
    } else {
      // 用户未登录时，设置默认报名状态
      activities.forEach(activity => {
        activity.dataValues.isRegistered = false;
        activity.dataValues.registrationStatus = null;
      });
    }
    
    // 返回数据
    console.log(`正在返回${activities.length}个活动数据`);
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      activities
    });
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ message: '获取活动列表失败', error: error.message });
  }
};

// 获取单个活动详情
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'studentId', 'department'],
          through: { attributes: ['status', 'registerTime'] }
        }
      ]
    });
    
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 检查当前用户是否已报名
    if (req.user) {
      const registration = await ActivityRegistration.findOne({
        where: {
          activity_id: id,
          user_id: req.user.id
        }
      });
      
      activity.dataValues.isRegistered = !!registration;
      activity.dataValues.registrationStatus = registration ? registration.status : null;
    }
    
    res.status(200).json(activity);
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ message: '获取活动详情失败', error: error.message });
  }
};

// 获取学生已参加的活动
exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereConditions = {};
    if (status) {
      whereConditions.status = status;
    }
    
    // 获取用户的报名记录
    const registrationWhereConditions = {
      user_id: userId
    };
    
    if (req.query.registrationStatus) {
      registrationWhereConditions.status = req.query.registrationStatus;
    }
    
    // 查询用户报名的活动
    const { count, rows: activities } = await Activity.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'role']
        },
        {
          model: User,
          as: 'participants',
          attributes: [],
          where: { id: userId },
          through: {
            where: registrationWhereConditions
          }
        }
      ],
      order: [
        ['startDate', 'DESC']
      ],
      limit: parseInt(limit),
      offset
    });
    
    // 获取报名状态信息
    const registrations = await ActivityRegistration.findAll({
      where: {
        user_id: userId,
        activity_id: activities.map(a => a.id)
      }
    });
    
    // 添加报名状态到活动数据
    activities.forEach(activity => {
      const registration = registrations.find(r => r.activity_id === activity.id);
      activity.dataValues.registrationStatus = registration ? registration.status : null;
      activity.dataValues.registerTime = registration ? registration.registerTime : null;
    });
    
    res.status(200).json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      activities
    });
  } catch (error) {
    console.error('获取我的活动失败:', error);
    res.status(500).json({ message: '获取我的活动列表失败', error: error.message });
  }
};

// 创建新活动
exports.createActivity = async (req, res) => {
  try {
    const { startDate, endDate, title, description, location, type, status, capacity, credits } = req.body;
    
    // 基本数据验证
    if (!title || !description || !startDate || !endDate || !location) {
      return res.status(400).json({ message: '活动信息不完整' });
    }
    
    // 日期验证
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: '无效的日期格式' });
    }
    
    if (end < start) {
      return res.status(400).json({ message: '结束时间必须晚于或等于开始时间' });
    }
    
    // 确保organizerId字段有值
    const activityData = {
      ...req.body,
      organizerId: req.user.id // 从认证中间件获取当前用户
    };
    
    const newActivity = await Activity.create(activityData);
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
    
    // 日期验证
    if (req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: '无效的日期格式' });
      }
      
      if (end < start) {
        return res.status(400).json({ message: '结束时间必须晚于或等于开始时间' });
      }
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

// 报名活动
exports.registerActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 检查活动状态
    if (activity.status !== '未开始' && activity.status !== '进行中') {
      return res.status(400).json({ message: '活动已结束或已取消，无法报名' });
    }
    
    // 检查活动容量
    if (activity.currentParticipants >= activity.capacity) {
      return res.status(400).json({ message: '活动名额已满' });
    }
    
    // 检查用户是否已报名
    const existingRegistration = await ActivityRegistration.findOne({
      where: {
        activity_id: activity.id,
        user_id: req.user.id
      }
    });
    
    if (existingRegistration) {
      // 如果之前取消了报名，可以重新报名
      if (existingRegistration.status === '已取消') {
        await existingRegistration.update({
          status: '已报名',
          registerTime: new Date()
        });
        
        // 更新活动参与人数
        await activity.update({
          currentParticipants: activity.currentParticipants + 1
        });
        
        return res.status(200).json({ message: '报名成功', registration: existingRegistration });
      }
      
      return res.status(400).json({ message: '您已报名该活动' });
    }
    
    // 创建报名记录
    const registration = await ActivityRegistration.create({
      activity_id: activity.id,
      user_id: req.user.id,
      status: '已报名',
      registerTime: new Date()
    });
    
    // 更新活动参与人数
    await activity.update({
      currentParticipants: activity.currentParticipants + 1
    });
    
    res.status(200).json({ 
      message: '报名成功',
      registration
    });
  } catch (error) {
    console.error('活动报名失败:', error);
    res.status(500).json({ message: '活动报名失败', error: error.message });
  }
};

// 取消活动报名
exports.cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`尝试取消活动ID ${id} 的报名，用户ID ${req.user.id}`);
    
    // 查找活动
    const activity = await Activity.findByPk(id);
    if (!activity) {
      console.log('找不到活动');
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 检查活动状态
    if (activity.status === '已结束') {
      console.log('活动已结束，无法取消报名');
      return res.status(400).json({ message: '活动已结束，无法取消报名' });
    }
    
    // 查找报名记录
    console.log(`查找报名记录: activity_id=${id}, user_id=${req.user.id}`);
    const registration = await ActivityRegistration.findOne({
      where: {
        activity_id: id,
        user_id: req.user.id
      }
    });
    
    console.log('查找到的报名记录:', registration);
    
    if (!registration) {
      console.log('用户未报名该活动');
      return res.status(404).json({ message: '您未报名该活动' });
    }
    
    if (registration.status === '已取消') {
      console.log('用户已取消报名该活动');
      return res.status(400).json({ message: '您已取消报名该活动' });
    }
    
    // 更新报名状态
    console.log('正在更新报名状态为已取消');
    await registration.update({
      status: '已取消'
    });
    
    // 更新活动参与人数
    console.log('正在更新活动参与人数');
    await activity.update({
      currentParticipants: Math.max(0, activity.currentParticipants - 1)
    });
    
    console.log('取消报名成功');
    res.status(200).json({ message: '已成功取消报名' });
  } catch (error) {
    console.error('取消活动报名失败:', error);
    console.error('错误详情:', error.stack);
    res.status(500).json({ message: '取消活动报名失败', error: error.message });
  }
};

// 完成活动
exports.completeActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // 校验参数
    if (!userId) {
      return res.status(400).json({ message: '用户ID为必填项' });
    }
    
    // 查找活动
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 只有活动组织者或管理员可以标记完成
    if (activity.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '您没有权限执行此操作' });
    }
    
    // 查找报名记录
    const registration = await ActivityRegistration.findOne({
      where: {
        activity_id: id,
        user_id: userId
      }
    });
    
    if (!registration) {
      return res.status(404).json({ message: '该用户未报名此活动' });
    }
    
    if (registration.status === '已完成') {
      return res.status(400).json({ message: '该用户已标记为完成此活动' });
    }
    
    if (registration.status === '已取消') {
      return res.status(400).json({ message: '该用户已取消报名，无法标记为完成' });
    }
    
    // 更新报名状态
    await registration.update({
      status: '已完成',
      completionTime: new Date()
    });
    
    res.status(200).json({ message: '成功标记活动完成' });
  } catch (error) {
    console.error('标记活动完成失败:', error);
    res.status(500).json({ message: '标记活动完成失败', error: error.message });
  }
}; 