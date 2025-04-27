const User = require('../models/User');
const Activity = require('../models/Activity');
const CreditApplication = require('../models/creditApplication');
const LearningActivity = require('../models/LearningActivity');
const SuketuoActivity = require('../models/SuketuoActivity');
const Lecture = require('../models/Lecture');
const { Sequelize, Op } = require('sequelize');
const moment = require('moment');

// @desc    获取学生学情分析数据
// @route   GET /api/analysis
// @access  Private
exports.getAnalysisData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // 设置默认时间范围为过去6个月
    const validStartDate = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(6, 'months').startOf('day').toDate();
    const validEndDate = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
    
    // 初始化结果对象
    const result = {
      creditTrend: { months: [], suketuo: [], lecture: [], volunteer: [], labor: [], total: [] },
      activityParticipation: [],
      creditDistribution: { suketuo: 0, lecture: 0, volunteer: 0, labor: 0 },
      recentActivities: []
    };
    
    // 获取学分趋势数据
    try {
      result.creditTrend = await getCreditTrend(userId, validStartDate, validEndDate);
    } catch (error) {
      console.error('获取学分趋势数据失败:', error);
    }
    
    // 获取活动参与分布
    try {
      result.activityParticipation = await getActivityParticipation(userId, validStartDate, validEndDate);
    } catch (error) {
      console.error('获取活动参与分布失败:', error);
    }
    
    // 获取学分分布
    try {
      result.creditDistribution = await getCreditDistribution(userId);
    } catch (error) {
      console.error('获取学分分布失败:', error);
    }
    
    // 获取近期活动
    try {
      result.recentActivities = await getRecentActivities(userId, validStartDate, validEndDate);
    } catch (error) {
      console.error('获取近期活动失败:', error);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('获取学情分析数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取学生参与统计数据
// @route   GET /api/analysis/student-participation
// @access  Private (Admin, Teacher)
exports.getStudentParticipation = async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { className, department, startDate, endDate } = req.query;
    
    const validStartDate = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(3, 'months').startOf('day').toDate();
    const validEndDate = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
    
    // 构建查询条件
    const whereConditions = {
      role: 'student'
    };
    
    if (className) whereConditions.class = className;
    if (department) whereConditions.department = department;
    
    // 获取符合条件的学生
    const students = await User.findAll({
      where: whereConditions,
      attributes: ['id', 'name', 'studentId', 'class', 'department', 'grade']
    });
    
    // 获取每个学生的活动参与情况
    const results = [];
    for (const student of students) {
      // 获取素拓活动参与次数
      const suketuoCount = await LearningActivity.count({
        where: {
          userId: student.id,
          type: 'suketuo',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      });
      
      // 获取讲座参与次数
      const lectureCount = await LearningActivity.count({
        where: {
          userId: student.id,
          type: 'lecture',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      });
      
      // 获取志愿服务参与次数
      const volunteerCount = await LearningActivity.count({
        where: {
          userId: student.id,
          type: 'volunteer',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      });
      
      // 获取已获得的学分总数
      const totalCredits = await CreditApplication.sum('creditValue', {
        where: {
          userId: student.id,
          status: 'approved',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      }) || 0;
      
      results.push({
        ...student.dataValues,
        suketuoCount,
        lectureCount,
        volunteerCount,
        totalActivities: suketuoCount + lectureCount + volunteerCount,
        totalCredits
      });
    }
    
    res.status(200).json(results);
  } catch (error) {
    console.error('获取学生参与统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取活动类型统计
// @route   GET /api/analysis/activity-types
// @access  Private
exports.getActivityTypeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const validStartDate = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(3, 'months').startOf('day').toDate();
    const validEndDate = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
    
    // 获取不同类型活动的数量统计
    const activityCounts = await Activity.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.between]: [validStartDate, validEndDate]
        }
      },
      group: ['type']
    });
    
    // 获取不同类型活动的参与人数统计
    const participationCounts = await LearningActivity.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('userId'))), 'uniqueUsers']
      ],
      where: {
        created_at: {
          [Op.between]: [validStartDate, validEndDate]
        }
      },
      group: ['type']
    });
    
    // 合并数据
    const result = {};
    activityCounts.forEach(item => {
      const type = item.type;
      if (!result[type]) result[type] = {};
      result[type].activityCount = parseInt(item.dataValues.count);
    });
    
    participationCounts.forEach(item => {
      const type = item.type;
      if (!result[type]) result[type] = {};
      result[type].participationCount = parseInt(item.dataValues.count);
      result[type].uniqueParticipants = parseInt(item.dataValues.uniqueUsers);
    });
    
    res.status(200).json(Object.entries(result).map(([type, stats]) => ({
      type,
      ...stats
    })));
  } catch (error) {
    console.error('获取活动类型统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取学分累积统计
// @route   GET /api/analysis/credit-accumulation
// @access  Private
exports.getCreditAccumulation = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'teacher';
    const { startDate, endDate, studentId, className } = req.query;
    
    const validStartDate = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(1, 'year').startOf('day').toDate();
    const validEndDate = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
    
    // 构建查询条件
    const whereConditions = {
      status: 'approved',
      created_at: {
        [Op.between]: [validStartDate, validEndDate]
      }
    };
    
    // 如果是学生，只查询自己的数据
    if (!isAdmin) {
      whereConditions.userId = userId;
    } 
    // 如果是管理员/教师，可以查询特定学生或班级
    else if (studentId) {
      const targetUser = await User.findOne({
        where: { studentId }
      });
      if (targetUser) {
        whereConditions.userId = targetUser.id;
      }
    } else if (className) {
      // 获取该班级所有学生ID
      const classStudents = await User.findAll({
        where: { class: className, role: 'student' },
        attributes: ['id']
      });
      const studentIds = classStudents.map(student => student.id);
      if (studentIds.length > 0) {
        whereConditions.userId = { [Op.in]: studentIds };
      }
    }
    
    // 按月份分组获取学分累积数据
    const creditData = await CreditApplication.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('creditValue')), 'totalCredits'],
        'creditType'
      ],
      where: whereConditions,
      group: [
        Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'),
        'creditType'
      ],
      order: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'ASC']
      ]
    });
    
    // 格式化结果
    const months = [...new Set(creditData.map(item => item.dataValues.month))].sort();
    
    const result = {
      months,
      suketuo: Array(months.length).fill(0),
      lecture: Array(months.length).fill(0),
      volunteer: Array(months.length).fill(0),
      labor: Array(months.length).fill(0),
      total: Array(months.length).fill(0)
    };
    
    // 定义类型映射，将数据库中的creditType映射到结果中的键
    const typeMapping = {
      'suketuo': 'suketuo',
      'lecture': 'lecture',
      'labor': 'labor',
      'volunteer': 'volunteer'
    };
    
    creditData.forEach(item => {
      const monthIndex = months.indexOf(item.dataValues.month);
      const creditType = item.creditType;
      const credits = parseFloat(item.dataValues.totalCredits);
      
      if (monthIndex !== -1 && !isNaN(credits)) {
        // 使用类型映射确保我们访问有效的属性
        const resultKey = typeMapping[creditType] || 'other';
        
        // 如果resultKey不在result中，可能需要初始化它
        if (!result[resultKey]) {
          result[resultKey] = Array(months.length).fill(0);
        }
        
        result[resultKey][monthIndex] = credits;
        result.total[monthIndex] += credits;
      }
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('获取学分累积统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 辅助函数: 获取学分趋势数据
async function getCreditTrend(userId, startDate, endDate) {
  // 生成月份数组
  const months = [];
  let currentDate = moment(startDate);
  const endMoment = moment(endDate);
  
  while (currentDate.isSameOrBefore(endMoment, 'month')) {
    months.push(currentDate.format('YYYY-MM'));
    currentDate = currentDate.add(1, 'month');
  }
  
  // 初始化结果
  const result = {
    months,
    suketuo: Array(months.length).fill(0),
    lecture: Array(months.length).fill(0),
    volunteer: Array(months.length).fill(0),
    labor: Array(months.length).fill(0),
    total: Array(months.length).fill(0)
  };
  
  // 定义类型映射，将数据库中的creditType映射到结果中的键
  const typeMapping = {
    'suketuo': 'suketuo',
    'lecture': 'lecture',
    'labor': 'labor',
    'volunteer': 'volunteer'
  };
  
  // 查询学分数据
  const creditData = await CreditApplication.findAll({
    attributes: [
      [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
      [Sequelize.fn('SUM', Sequelize.col('creditValue')), 'totalCredits'],
      'creditType'
    ],
    where: {
      userId,
      status: 'approved',
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    },
    group: [
      Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'),
      'creditType'
    ]
  });
  
  // 填充数据
  creditData.forEach(item => {
    const monthIndex = months.indexOf(item.dataValues.month);
    const creditType = item.creditType;
    const credits = parseFloat(item.dataValues.totalCredits);
    
    if (monthIndex !== -1 && !isNaN(credits)) {
      // 使用类型映射确保我们访问有效的属性
      const resultKey = typeMapping[creditType] || 'other';
      
      // 如果resultKey不在result中，可能需要初始化它
      if (!result[resultKey]) {
        result[resultKey] = Array(months.length).fill(0);
      }
      
      result[resultKey][monthIndex] = credits;
      result.total[monthIndex] += credits;
    }
  });
  
  return result;
}

// 辅助函数: 获取活动参与分布
async function getActivityParticipation(userId, startDate, endDate) {
  try {
    // 查询用户参与的各类活动数量 - 修改type为activityType
    const activities = await LearningActivity.findAll({
      attributes: [
        'activityType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['activityType']
    });
    
    // 定义活动类型映射
    const typeMapping = {
      suketuo: '素拓活动',
      lecture: '讲座',
      volunteer: '志愿服务',
      labor: '劳动',
      competition: '竞赛',
      other: '其他'
    };
    
    // 如果没有找到数据，返回一个标准的占位数据
    if (!activities || activities.length === 0) {
      return [
        { name: '素拓活动', value: 0 },
        { name: '讲座', value: 0 },
        { name: '志愿服务', value: 0 },
        { name: '劳动', value: 0 }
      ];
    }
    
    // 格式化结果 - 修改type为activityType
    return activities.map(activity => {
      const activityTypeName = activity.activityType ? activity.activityType.toLowerCase() : 'other';
      return {
        name: typeMapping[activityTypeName] || activity.activityType || '其他',
        value: parseInt(activity.dataValues.count || 0)
      };
    });
  } catch (error) {
    console.error('活动参与分布数据获取失败:', error);
    // 返回一个标准的占位数据
    return [
      { name: '素拓活动', value: 0 },
      { name: '讲座', value: 0 },
      { name: '志愿服务', value: 0 },
      { name: '劳动', value: 0 }
    ];
  }
}

// 辅助函数: 获取学分分布
async function getCreditDistribution(userId) {
  // 查询已获批的不同类型学分总和
  const suketuo = await CreditApplication.sum('creditValue', {
    where: {
      userId,
      creditType: 'suketuo',
      status: 'approved'
    }
  }) || 0;
  
  const lecture = await CreditApplication.sum('creditValue', {
    where: {
      userId,
      creditType: 'lecture',
      status: 'approved'
    }
  }) || 0;
  
  const volunteer = await CreditApplication.sum('creditValue', {
    where: {
      userId,
      creditType: 'volunteer',
      status: 'approved'
    }
  }) || 0;
  
  const labor = await CreditApplication.sum('creditValue', {
    where: {
      userId,
      creditType: 'labor',
      status: 'approved'
    }
  }) || 0;
  
  return {
    suketuo,
    lecture,
    volunteer,
    labor
  };
}

// 辅助函数: 获取近期活动
async function getRecentActivities(userId, startDate, endDate) {
  // 查询用户参与的活动
  try {
    const activities = await LearningActivity.findAll({
      where: {
        userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    // 定义活动类型映射
    const typeMapping = {
      suketuo: '素拓',
      lecture: '讲座',
      volunteer: '志愿服务',
      labor: '劳动',
      competition: '竞赛',
      other: '其他'
    };
    
    // 格式化结果
    return activities.map(activity => {
      return {
        id: activity.id,
        title: activity.activityName || '未知活动',
        type: typeMapping[activity.activityType] || activity.activityType || '未知类型',
        date: moment(activity.created_at).format('YYYY-MM-DD'),
        credits: 0, // 没有关联的Activity，无法获取确切学分
        status: '已完成' // 默认状态
      };
    });
  } catch (error) {
    console.error('获取近期活动失败:', error);
    // 返回空数组，避免整个请求失败
    return [];
  }
}

module.exports = exports; 