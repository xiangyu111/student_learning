const Progress = require('../models/Progress');
const ProgressTask = require('../models/ProgressTask');
const { Op, sequelize } = require('sequelize');
const { sequelize: db } = require('../config/db');

// 获取用户所有进度目标
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await Progress.findAll({
      where: { userId },
      include: [
        {
          model: ProgressTask,
          as: 'tasks'
        }
      ],
      order: [
        ['targetDate', 'ASC'],
        [{ model: ProgressTask, as: 'tasks' }, 'order', 'ASC']
      ]
    });
    
    return res.status(200).json(progress);
  } catch (error) {
    console.error('获取进度失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 获取单个进度目标详情
exports.getProgressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const progress = await Progress.findOne({
      where: { 
        id,
        userId 
      },
      include: [
        {
          model: ProgressTask,
          as: 'tasks',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!progress) {
      return res.status(404).json({ message: '未找到该进度目标' });
    }
    
    return res.status(200).json(progress);
  } catch (error) {
    console.error('获取进度详情失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 创建新的进度目标
exports.createProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      goalTitle, 
      goalDescription, 
      targetDate, 
      progressPercentage = 0, 
      status = 'not_started',
      category,
      priority = 'medium',
      notes,
      tasks = []
    } = req.body;
    
    // 验证必填字段
    if (!goalTitle || !targetDate) {
      return res.status(400).json({ message: '目标标题和目标日期为必填项' });
    }
    
    // 创建进度目标
    const newProgress = await Progress.create({
      userId,
      goalTitle,
      goalDescription,
      targetDate,
      progressPercentage,
      status,
      category,
      priority,
      notes,
      lastUpdated: new Date()
    });
    
    // 如果有子任务，创建子任务
    if (tasks && tasks.length > 0) {
      const progressTasks = tasks.map((task, index) => ({
        progressId: newProgress.id,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        isCompleted: task.isCompleted || false,
        dueDate: task.dueDate,
        order: index
      }));
      
      await ProgressTask.bulkCreate(progressTasks);
    }
    
    // 返回创建的进度目标（包含子任务）
    const createdProgress = await Progress.findByPk(newProgress.id, {
      include: [{ model: ProgressTask, as: 'tasks' }]
    });
    
    return res.status(201).json(createdProgress);
  } catch (error) {
    console.error('创建进度目标失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新进度目标
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      goalTitle, 
      goalDescription, 
      targetDate, 
      progressPercentage, 
      status,
      category,
      priority,
      notes,
      tasks
    } = req.body;
    
    // 查找并验证进度目标
    const progress = await Progress.findOne({ 
      where: { id, userId } 
    });
    
    if (!progress) {
      return res.status(404).json({ message: '未找到该进度目标' });
    }
    
    // 更新进度目标
    const updateData = {
      ...(goalTitle && { goalTitle }),
      ...(goalDescription !== undefined && { goalDescription }),
      ...(targetDate && { targetDate }),
      ...(progressPercentage !== undefined && { progressPercentage }),
      ...(status && { status }),
      ...(category !== undefined && { category }),
      ...(priority && { priority }),
      ...(notes !== undefined && { notes }),
      lastUpdated: new Date()
    };
    
    await progress.update(updateData);
    
    // 如果提供了任务数据，更新任务
    if (tasks && Array.isArray(tasks)) {
      // 获取现有任务
      const existingTasks = await ProgressTask.findAll({
        where: { progressId: id }
      });
      
      const existingTaskIds = existingTasks.map(task => task.id);
      const newTaskIds = tasks.filter(task => task.id).map(task => task.id);
      
      // 找出要删除的任务
      const tasksToDelete = existingTaskIds.filter(id => !newTaskIds.includes(id));
      
      // 删除不再需要的任务
      if (tasksToDelete.length > 0) {
        await ProgressTask.destroy({
          where: {
            id: tasksToDelete
          }
        });
      }
      
      // 处理每个任务
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        if (task.id) {
          // 更新现有任务
          await ProgressTask.update(
            {
              taskName: task.taskName,
              taskDescription: task.taskDescription,
              isCompleted: task.isCompleted,
              dueDate: task.dueDate,
              completedDate: task.isCompleted ? (task.completedDate || new Date()) : null,
              order: i
            },
            { where: { id: task.id, progressId: id } }
          );
        } else {
          // 创建新任务
          await ProgressTask.create({
            progressId: id,
            taskName: task.taskName,
            taskDescription: task.taskDescription,
            isCompleted: task.isCompleted || false,
            dueDate: task.dueDate,
            completedDate: task.isCompleted ? (task.completedDate || new Date()) : null,
            order: i
          });
        }
      }
    }
    
    // 返回更新后的进度目标（包含子任务）
    const updatedProgress = await Progress.findByPk(id, {
      include: [
        {
          model: ProgressTask,
          as: 'tasks',
          order: [['order', 'ASC']]
        }
      ]
    });
    
    return res.status(200).json(updatedProgress);
  } catch (error) {
    console.error('更新进度目标失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 删除进度目标
exports.deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 查找并验证进度目标
    const progress = await Progress.findOne({ 
      where: { id, userId } 
    });
    
    if (!progress) {
      return res.status(404).json({ message: '未找到该进度目标' });
    }
    
    // 删除关联的任务
    await ProgressTask.destroy({
      where: { progressId: id }
    });
    
    // 删除进度目标
    await progress.destroy();
    
    return res.status(200).json({ message: '进度目标已删除' });
  } catch (error) {
    console.error('删除进度目标失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新任务状态
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { isCompleted } = req.body;
    const userId = req.user.id;
    
    // 查找任务并确保它属于当前用户
    const task = await ProgressTask.findOne({
      where: { id: taskId },
      include: [{
        model: Progress,
        as: 'progress',
        where: { userId }
      }]
    });
    
    if (!task) {
      return res.status(404).json({ message: '未找到该任务或您无权操作此任务' });
    }
    
    // 更新任务状态
    await task.update({
      isCompleted,
      completedDate: isCompleted ? new Date() : null
    });
    
    // 获取该进度目标的所有任务
    const allTasks = await ProgressTask.findAll({
      where: { progressId: task.progressId }
    });
    
    // 计算完成百分比
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.isCompleted).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 确定状态
    let status = 'in_progress';
    if (progressPercentage === 0) {
      status = 'not_started';
    } else if (progressPercentage === 100) {
      status = 'completed';
    }
    
    // 更新进度目标
    await Progress.update(
      {
        progressPercentage,
        status,
        lastUpdated: new Date()
      },
      { where: { id: task.progressId } }
    );
    
    // 返回更新后的任务
    return res.status(200).json({
      task,
      progressPercentage,
      status
    });
  } catch (error) {
    console.error('更新任务状态失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 获取统计数据
exports.getProgressStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取各状态的进度目标数量
    const statusCounts = await Progress.findAll({
      attributes: [
        'status',
        [db.fn('COUNT', db.col('id')), 'count']
      ],
      where: { userId },
      group: ['status']
    });
    
    // 获取即将到期的目标（7天内）
    const upcomingDeadlines = await Progress.findAll({
      where: {
        userId,
        targetDate: {
          [Op.between]: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        },
        status: {
          [Op.ne]: 'completed'
        }
      },
      order: [['targetDate', 'ASC']],
      limit: 5
    });
    
    // 获取最近更新的目标
    const recentlyUpdated = await Progress.findAll({
      where: { userId },
      order: [['lastUpdated', 'DESC']],
      limit: 5
    });
    
    // 按类别统计
    const categoryCounts = await Progress.findAll({
      attributes: [
        'category',
        [db.fn('COUNT', db.col('id')), 'count']
      ],
      where: { 
        userId,
        category: {
          [Op.ne]: null
        }
      },
      group: ['category']
    });
    
    return res.status(200).json({
      statusCounts,
      upcomingDeadlines,
      recentlyUpdated,
      categoryCounts
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
}; 