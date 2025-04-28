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
      creditTrend: { months: [], suketuo: [], lecture: [], labor: [], total: [] },
      activityParticipation: [],
      creditDistribution: { suketuo: 0, lecture: 0, labor: 0 },
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
    
    // 添加数据指纹以防止304响应
    res.setHeader('ETag', Date.now().toString());
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
    // 获取URL中的班级ID参数，如果是按班级ID查询的情况
    const classId = req.params.id;
    
    const validStartDate = startDate ? moment(startDate).startOf('day').toDate() : moment().subtract(3, 'months').startOf('day').toDate();
    const validEndDate = endDate ? moment(endDate).endOf('day').toDate() : moment().endOf('day').toDate();
    
    // 构建查询条件
    const whereConditions = {
      role: 'student'
    };
    
    if (className) whereConditions.class = className;
    if (department) whereConditions.department = department;
    // 如果是通过classId请求的，则查询该班级
    if (classId) {
      // 使用classId直接作为班级名称，因为我们不存在Class模型
      // 简化这部分代码
      whereConditions.class = classId;
    }
    
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
          activityType: 'suketuo',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      });
      
      // 获取讲座参与次数
      const lectureCount = await LearningActivity.count({
        where: {
          userId: student.id,
          activityType: 'lecture',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      });
      
      // 获取劳动活动参与次数
      const laborCount = await LearningActivity.count({
        where: {
          userId: student.id,
          activityType: 'labor',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      });
      
      // 获取已获得的学分总数
      const totalCredits = await CreditApplication.sum('credit_value', {
        where: {
          userId: student.id,
          status: 'approved',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      }) || 0;
      
      // 获取不同类型的学分
      const suketuoCredits = await CreditApplication.sum('credit_value', {
        where: {
          userId: student.id,
          creditType: 'suketuo',
          status: 'approved',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      }) || 0;
      
      const lectureCredits = await CreditApplication.sum('credit_value', {
        where: {
          userId: student.id,
          creditType: 'lecture',
          status: 'approved',
          created_at: {
            [Op.between]: [validStartDate, validEndDate]
          }
        }
      }) || 0;
      
      const laborCredits = await CreditApplication.sum('credit_value', {
        where: {
          userId: student.id,
          creditType: 'labor',
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
        laborCount,
        suketuoCredits,
        lectureCredits,
        laborCredits,
        totalActivities: suketuoCount + lectureCount + laborCount,
        totalCredits
      });
    }
    
    // 如果是班级详情请求，需要计算统计数据并格式化返回
    if (classId) {
      // 计算学分平均值
      const averageTotalCredits = results.reduce((sum, student) => sum + student.totalCredits, 0) / (results.length || 1);
      const averageSuketuoCredits = results.reduce((sum, student) => sum + student.suketuoCredits, 0) / (results.length || 1);
      const averageLectureCredits = results.reduce((sum, student) => sum + student.lectureCredits, 0) / (results.length || 1);
      const averageLaborCredits = results.reduce((sum, student) => sum + student.laborCredits, 0) / (results.length || 1);
      
      // 学分类型分布
      const totalSuketuoCredits = results.reduce((sum, student) => sum + student.suketuoCredits, 0);
      const totalLectureCredits = results.reduce((sum, student) => sum + student.lectureCredits, 0);
      const totalLaborCredits = results.reduce((sum, student) => sum + student.laborCredits, 0);
      
      const creditTypeDistribution = [
        { name: '素拓学分', value: totalSuketuoCredits },
        { name: '讲座学分', value: totalLectureCredits },
        { name: '劳动学分', value: totalLaborCredits }
      ];
      
      // 格式化学生数据
      const formattedStudents = results.map(student => ({
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        suketuoCredits: student.suketuoCredits,
        lectureCredits: student.lectureCredits,
        laborCredits: student.laborCredits,
        totalCredits: student.totalCredits
      }));
      
      // 计算学分达成率数据
      // 假设每个学生需要获得的目标学分
      const targetCredits = 8; // 例如总共需要8个学分
      const suketuoTarget = 3;  // 需要3个素拓学分
      const lectureTarget = 3;  // 需要3个讲座学分
      const laborTarget = 2;    // 需要2个劳动学分
      
      // 计算达标人数 (总学分达到目标)
      const qualifiedCount = formattedStudents.filter(student => 
        student.totalCredits >= targetCredits
      ).length;
      
      // 总学生数
      const totalStudents = formattedStudents.length;
      
      // 达标率
      const qualifiedRate = totalStudents > 0 ? qualifiedCount / totalStudents : 0;
      
      // 计算平均达成率 (每个学生达成的比例的平均值)
      const studentCompletionRates = formattedStudents.map(student => {
        const suketuoCompletion = Math.min(student.suketuoCredits / suketuoTarget, 1);
        const lectureCompletion = Math.min(student.lectureCredits / lectureTarget, 1);
        const laborCompletion = Math.min(student.laborCredits / laborTarget, 1);
        const totalCompletion = Math.min(student.totalCredits / targetCredits, 1);
        
        // 综合达成率，可以考虑不同类型学分的权重
        return totalCompletion;
      });
      
      const averageCompletionRate = studentCompletionRates.length > 0 ? 
        studentCompletionRates.reduce((sum, rate) => sum + rate, 0) / studentCompletionRates.length : 0;
      
      return res.status(200).json({
        summary: {
          averageTotalCredits,
          averageSuketuoCredits,
          averageLectureCredits,
          averageLaborCredits,
          qualifiedCount,
          totalStudents,
          qualifiedRate,
          averageCompletionRate
        },
        creditTypeDistribution,
        students: formattedStudents || []
      });
    }
    
    // 修改此处，确保返回一个包含students属性的对象，而不是直接返回results数组
    res.status(200).json({
      students: results || []
    });
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
      },
      // 只查询特定类型的学分
      creditType: {
        [Op.in]: ['suketuo', 'lecture', 'labor', 'volunteer']
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
        [Sequelize.fn('SUM', Sequelize.col('credit_value')), 'totalCredits'],
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
      labor: Array(months.length).fill(0),
      total: Array(months.length).fill(0)
    };
    
    // 定义类型映射，将数据库中的creditType映射到结果中的键
    const typeMapping = {
      'suketuo': 'suketuo',
      'lecture': 'lecture',
      'labor': 'labor',
      'volunteer': 'labor' // 为了兼容，把志愿服务也映射为劳动
    };
    
    creditData.forEach(item => {
      const monthIndex = months.indexOf(item.dataValues.month);
      const creditType = item.creditType;
      const credits = parseFloat(item.dataValues.totalCredits);
      
      if (monthIndex !== -1 && !isNaN(credits) && typeMapping[creditType]) {
        // 使用类型映射确保我们访问有效的属性
        const resultKey = typeMapping[creditType];
        
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
    labor: Array(months.length).fill(0),
    total: Array(months.length).fill(0)
  };
  
  // 定义类型映射，将数据库中的creditType映射到结果中的键
  const typeMapping = {
    'suketuo': 'suketuo',
    'lecture': 'lecture',
    'labor': 'labor',
    'volunteer': 'labor' // 为了兼容，把志愿服务也映射为劳动
  };
  
  // 查询学分数据 - 只包含素拓、讲座和劳动学分
  const creditData = await CreditApplication.findAll({
    attributes: [
      [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
      [Sequelize.fn('SUM', Sequelize.col('credit_value')), 'totalCredits'],
      'creditType'
    ],
    where: {
      userId,
      status: 'approved',
      created_at: {
        [Op.between]: [startDate, endDate]
      },
      creditType: {
        [Op.in]: ['suketuo', 'lecture', 'labor', 'volunteer']
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
    
    if (monthIndex !== -1 && !isNaN(credits) && typeMapping[creditType]) {
      // 使用类型映射确保我们访问有效的属性
      const resultKey = typeMapping[creditType];
      
      result[resultKey][monthIndex] = credits;
      result.total[monthIndex] += credits;
    }
  });
  
  return result;
}

// 辅助函数: 获取活动参与分布
async function getActivityParticipation(userId, startDate, endDate) {
  try {
    // 查询用户参与的各类活动数量 - 确保使用正确的字段名
    const activities = await LearningActivity.findAll({
      attributes: [
        'activity_type', // 使用下划线命名法
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        userId,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['activity_type']
    });
    
    // 如果没有找到数据，返回一个标准的占位数据
    if (!activities || activities.length === 0) {
      return [
        { name: '素拓活动', value: 0 },
        { name: '讲座', value: 0 },
        { name: '劳动', value: 0 }
      ];
    }
    
    // 定义活动类型映射
    const typeMapping = {
      suketuo: '素拓活动',
      lecture: '讲座',
      labor: '劳动',
      volunteer: '劳动', // 为了兼容，把志愿服务也映射为劳动
      competition: '竞赛',
      other: '其他'
    };
    
    // 格式化结果 - 使用activity_type
    const formattedResults = activities.map(activity => {
      const activityTypeName = activity.activity_type ? activity.activity_type.toLowerCase() : 'other';
      return {
        name: typeMapping[activityTypeName] || activity.activity_type || '其他',
        value: parseInt(activity.dataValues.count || 0)
      };
    });
    
    // 过滤掉非素拓活动、讲座和劳动的项目
    return formattedResults.filter(item => 
      item.name === '素拓活动' || 
      item.name === '讲座' || 
      item.name === '劳动'
    );
  } catch (error) {
    console.error('活动参与分布数据获取失败:', error);
    // 返回一个标准的占位数据
    return [
      { name: '素拓活动', value: 0 },
      { name: '讲座', value: 0 },
      { name: '劳动', value: 0 }
    ];
  }
}

// 辅助函数: 获取学分分布
async function getCreditDistribution(userId) {
  // 查询已获批的不同类型学分总和
  const suketuo = await CreditApplication.sum('credit_value', {
    where: {
      userId,
      creditType: 'suketuo',
      status: 'approved'
    }
  }) || 0;
  
  const lecture = await CreditApplication.sum('credit_value', {
    where: {
      userId,
      creditType: 'lecture',
      status: 'approved'
    }
  }) || 0;
  
  const labor = await CreditApplication.sum('credit_value', {
    where: {
      userId,
      creditType: 'labor',
      status: 'approved'
    }
  }) || 0;
  
  return {
    suketuo,
    lecture,
    labor
  };
}

// 辅助函数: 获取近期活动
async function getRecentActivities(userId, startDate, endDate) {
  // 查询用户参与的活动
  try {
    // 查询用户的学习活动
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
      labor: '劳动',
      volunteer: '劳动', // 为了兼容，把志愿服务也映射为劳动
      competition: '竞赛',
      other: '其他'
    };
    
    // 查询学分申请记录，以关联学分数据
    const creditApplications = await CreditApplication.findAll({
      where: {
        userId,
        status: 'approved',
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['id', 'related_activity_id', 'credit_value', 'status', 'created_at']
    });
    
    // 创建学分申请的映射，以便快速查找
    const creditMap = {};
    for (const credit of creditApplications) {
      creditMap[credit.related_activity_id] = {
        creditValue: credit.credit_value,
        status: credit.status
      };
    }
    
    // 格式化结果，添加学分信息
    return activities.map(activity => {
      // 获取活动对应的学分信息
      const creditInfo = creditMap[activity.id] || { creditValue: 0, status: '未申请' };
      
      // 确定活动类型
      let activityType = activity.activityType || activity.activity_type || 'other';
      
      return {
        id: activity.id,
        title: activity.activityName || activity.activity_name || '未知活动',
        type: typeMapping[activityType.toLowerCase()] || activityType || '未知类型',
        date: moment(activity.created_at).format('YYYY-MM-DD'),
        credits: creditInfo.creditValue || 0,
        status: creditInfo.status === 'approved' ? '已获得' : '未获得'
      };
    });
  } catch (error) {
    console.error('获取近期活动失败:', error);
    // 返回空数组，避免整个请求失败
    return [];
  }
}

module.exports = exports; 