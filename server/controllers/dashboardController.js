const User = require('../models/User');
const { Activity } = require('../models/Activity');
const CreditApplication = require('../models/creditApplication');
const LearningActivity = require('../models/LearningActivity');
const { Sequelize, Op } = require('sequelize');
const moment = require('moment');

// @desc    获取学生Dashboard数据
// @route   GET /api/dashboard/student
// @access  Private (Student)
exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取学分统计
    const suketuoCredits = await CreditApplication.sum('creditValue', {
      where: {
        userId,
        creditType: 'suketuo',
        status: 'approved'
      }
    }) || 0;
    
    const lectureCredits = await CreditApplication.sum('creditValue', {
      where: {
        userId,
        creditType: 'lecture',
        status: 'approved'
      }
    }) || 0;
    
    const laborCredits = await CreditApplication.sum('creditValue', {
      where: {
        userId,
        creditType: 'labor',
        status: 'approved'
      }
    }) || 0;
    
    // 获取活动参与次数
    const activitiesCount = await LearningActivity.count({
      where: { userId }
    });
    
    // 计算完成率
    const totalRequired = 20; // 假设总共需要20分
    const totalEarned = suketuoCredits + lectureCredits + laborCredits;
    const completionRate = Math.min(100, Math.round((totalEarned / totalRequired) * 100));
    
    // 获取待审核申请数
    const pendingApplications = await CreditApplication.count({
      where: {
        userId,
        status: 'pending'
      }
    });
    
    // 获取最近活动
    const recentActivities = await CreditApplication.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title', 'type', 'startDate', 'endDate']
        }
      ],
      attributes: [
        'id', 'creditType', 'status', 'creditValue', 'created_at', 
        'description', 'relatedActivityId'
      ]
    });
    
    // 格式化最近活动数据
    const formattedActivities = recentActivities.map(activity => {
      const activityInfo = activity.activity || {};
      return {
        id: activity.id,
        title: activityInfo.title || activity.description || '未知活动',
        type: activity.creditType,
        status: activity.status,
        date: moment(activity.created_at).format('YYYY-MM-DD'),
        credits: activity.creditValue
      };
    });
    
    // 返回结果
    res.status(200).json({
      statistics: {
        totalCredits: suketuoCredits + lectureCredits + laborCredits,
        suketuoCredits,
        lectureCredits,
        laborCredits,
        activitiesCount,
        completionRate,
        pendingApplications
      },
      recentActivities: formattedActivities,
      quickActions: [
        { type: 'suketuo', label: '申请素拓学分' },
        { type: 'lecture', label: '申请讲座学分' },
        { type: 'labor', label: '申请劳动学分' }
      ]
    });
  } catch (error) {
    console.error('获取学生Dashboard数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取教师/管理员Dashboard数据
// @route   GET /api/dashboard/teacher
// @access  Private (Teacher, Admin)
exports.getTeacherDashboard = async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    // 获取学生总数
    const studentCount = await User.count({
      where: { role: 'student' }
    });
    
    // 获取待审核申请数
    const pendingApplicationsCount = await CreditApplication.count({
      where: { status: 'pending' }
    });
    
    // 获取活动总数
    const activitiesCount = await Activity.count();
    
    // 计算平均学分
    const totalCredits = await CreditApplication.sum('creditValue', {
      where: { status: 'approved' }
    }) || 0;
    
    const averageCredits = studentCount > 0 ? parseFloat((totalCredits / studentCount).toFixed(1)) : 0;
    
    // 获取各类型申请数量
    const suketuoApplications = await CreditApplication.count({
      where: { 
        creditType: 'suketuo',
        status: 'pending'
      }
    });
    
    const lectureApplications = await CreditApplication.count({
      where: { 
        creditType: 'lecture',
        status: 'pending'
      }
    });
    
    const laborApplications = await CreditApplication.count({
      where: { 
        creditType: 'labor',
        status: 'pending'
      }
    });
    
    // 获取待审核申请
    const pendingApplications = await CreditApplication.findAll({
      where: { status: 'pending' },
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'studentId']
        },
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title', 'type']
        }
      ],
      attributes: [
        'id', 'creditType', 'status', 'creditValue', 'created_at', 
        'description', 'relatedActivityId'
      ]
    });
    
    // 格式化待审核申请数据
    const formattedPendingApplications = pendingApplications.map(app => {
      const student = app.applicant || {};
      const activity = app.activity || {};
      
      return {
        id: app.id,
        studentName: student.name || '未知学生',
        studentId: student.studentId || '未知学号',
        activityName: activity.title || app.description || '未知活动',
        type: app.creditType,
        applyDate: moment(app.created_at).format('YYYY-MM-DD'),
        requestedCredits: app.creditValue
      };
    });
    
    // 返回结果
    res.status(200).json({
      statistics: {
        studentCount,
        pendingApplicationsCount,
        activitiesCount,
        averageCredits,
        suketuoApplications,
        lectureApplications,
        laborApplications
      },
      pendingApplications: formattedPendingApplications
    });
  } catch (error) {
    console.error('获取教师Dashboard数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = exports;