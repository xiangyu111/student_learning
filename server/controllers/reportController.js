const User = require('../models/User');
const { Activity, ActivityRegistration } = require('../models/Activity');
const LearningActivity = require('../models/LearningActivity');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// 生成学生活动参与报告
exports.generateStudentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    // 获取学生信息
    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: '未找到该学生' });
    }

    // 查询条件：时间范围
    const dateFilter = {};
    if (startDate) {
      dateFilter.startDate = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.endDate = { [Op.lte]: new Date(endDate) };
    }

    // 获取学生参与的活动
    const activities = await Activity.findAll({
      include: [
        {
          model: User,
          as: 'participants',
          where: { id: student.id },
          attributes: [],
          through: {
            attributes: ['status', 'registerTime'],
            where: { status: '已参加' }
          }
        }
      ],
      where: dateFilter,
      attributes: ['id', 'title', 'type', 'startDate', 'endDate', 'credits', 'location']
    });

    // 获取学生的学习活动记录
    const learningActivities = await LearningActivity.findAll({
      where: {
        userId: student.id,
        ...dateFilter
      },
      attributes: ['id', 'activityName', 'activityType', 'startTime', 'endTime', 'duration', 'location', 'content', 'reflection']
    });

    // 计算统计信息
    const totalActivities = activities.length;
    const totalLearningActivities = learningActivities.length;
    const totalCredits = activities.reduce((sum, act) => sum + parseFloat(act.credits || 0), 0);
    
    // 按活动类型分类统计
    const activityTypes = {};
    activities.forEach(act => {
      if (!activityTypes[act.type]) {
        activityTypes[act.type] = {
          count: 0,
          credits: 0
        };
      }
      activityTypes[act.type].count++;
      activityTypes[act.type].credits += parseFloat(act.credits || 0);
    });

    // 构建报告数据
    const reportData = {
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        major: student.major,
        class: student.class,
        grade: student.grade
      },
      summary: {
        totalActivities,
        totalLearningActivities,
        totalCredits,
        activityTypes
      },
      activities,
      learningActivities,
      generatedAt: new Date()
    };

    // 根据请求的格式返回数据
    if (format === 'pdf') {
      // 生成PDF
      return generatePDFReport(reportData, res);
    } else {
      // 默认返回JSON
      return res.status(200).json(reportData);
    }
    
  } catch (error) {
    console.error('生成学生报告时出错:', error);
    return res.status(500).json({ message: '生成报告时发生错误', error: error.message });
  }
};

// 生成活动统计报告
exports.generateActivityReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取活动信息
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: '未找到该活动' });
    }

    // 获取参与该活动的学生
    const participants = await User.findAll({
      include: [
        {
          model: Activity,
          as: 'participatedActivities',
          where: { id: activity.id },
          attributes: [],
          through: {
            attributes: ['status', 'registerTime']
          }
        }
      ],
      attributes: ['id', 'name', 'studentId', 'department', 'major', 'class', 'grade']
    });

    // 统计信息
    const totalParticipants = participants.length;
    
    // 按院系、专业、年级统计参与情况
    const departmentStats = {};
    const majorStats = {};
    const gradeStats = {};
    
    participants.forEach(student => {
      // 按院系统计
      if (student.department) {
        departmentStats[student.department] = (departmentStats[student.department] || 0) + 1;
      }
      
      // 按专业统计
      if (student.major) {
        majorStats[student.major] = (majorStats[student.major] || 0) + 1;
      }
      
      // 按年级统计
      if (student.grade) {
        gradeStats[student.grade] = (gradeStats[student.grade] || 0) + 1;
      }
    });

    // 构建报告数据
    const reportData = {
      activity: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        startDate: activity.startDate,
        endDate: activity.endDate,
        location: activity.location,
        credits: activity.credits
      },
      summary: {
        totalParticipants,
        departmentStats,
        majorStats,
        gradeStats
      },
      participants,
      generatedAt: new Date()
    };

    return res.status(200).json(reportData);
    
  } catch (error) {
    console.error('生成活动报告时出错:', error);
    return res.status(500).json({ message: '生成报告时发生错误', error: error.message });
  }
};

// 生成系统整体使用报告
exports.generateSystemReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 查询条件：时间范围
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };
    }

    // 用户统计
    const userCount = await User.count({
      where: {
        ...dateFilter
      },
      group: ['role']
    });

    // 活动统计
    const activityCount = await Activity.count({
      where: {
        ...dateFilter
      },
      group: ['type']
    });

    // 学习活动统计
    const learningActivityCount = await LearningActivity.count({
      where: {
        ...dateFilter
      },
      group: ['activityType']
    });

    // 构建报告数据
    const reportData = {
      period: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      summary: {
        userStats: userCount,
        activityStats: activityCount,
        learningActivityStats: learningActivityCount
      },
      generatedAt: new Date()
    };

    return res.status(200).json(reportData);
    
  } catch (error) {
    console.error('生成系统报告时出错:', error);
    return res.status(500).json({ message: '生成报告时发生错误', error: error.message });
  }
};

// 生成PDF报告的辅助函数
const generatePDFReport = async (reportData, res) => {
  try {
    // 创建PDF文档
    const doc = new PDFDocument({ margin: 50 });
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=学生报告_${reportData.student.studentId}.pdf`);
    
    // 将PDF直接输出到HTTP响应
    doc.pipe(res);
    
    // 添加标题
    doc.fontSize(25).text('学生活动参与报告', { align: 'center' });
    doc.moveDown();
    
    // 添加学生基本信息
    doc.fontSize(16).text('学生信息');
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`姓名: ${reportData.student.name}`);
    doc.text(`学号: ${reportData.student.studentId}`);
    doc.text(`院系: ${reportData.student.department}`);
    doc.text(`专业: ${reportData.student.major}`);
    doc.text(`班级: ${reportData.student.class}`);
    doc.text(`年级: ${reportData.student.grade}`);
    doc.moveDown();
    
    // 添加统计摘要
    doc.fontSize(16).text('活动参与统计');
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`活动总数: ${reportData.summary.totalActivities}`);
    doc.text(`自主学习活动数: ${reportData.summary.totalLearningActivities}`);
    doc.text(`获得学分总数: ${reportData.summary.totalCredits.toFixed(1)}`);
    doc.moveDown();
    
    // 添加活动类型统计
    doc.fontSize(14).text('按活动类型统计:');
    doc.moveDown(0.5);
    for (const [type, data] of Object.entries(reportData.summary.activityTypes)) {
      doc.text(`${type}: ${data.count}个活动, ${data.credits.toFixed(1)}学分`);
    }
    doc.moveDown();
    
    // 添加活动列表
    doc.fontSize(16).text('参与活动列表');
    doc.moveDown(0.5);
    reportData.activities.forEach((activity, index) => {
      doc.fontSize(12).text(`${index + 1}. ${activity.title}`);
      doc.fontSize(10);
      doc.text(`类型: ${activity.type}`);
      doc.text(`时间: ${new Date(activity.startDate).toLocaleString()} - ${new Date(activity.endDate).toLocaleString()}`);
      doc.text(`地点: ${activity.location || '未指定'}`);
      doc.text(`学分: ${activity.credits}`);
      doc.moveDown(0.5);
    });
    
    // 添加学习活动列表
    if (reportData.learningActivities.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('自主学习活动');
      doc.moveDown(0.5);
      reportData.learningActivities.forEach((activity, index) => {
        doc.fontSize(12).text(`${index + 1}. ${activity.activityName}`);
        doc.fontSize(10);
        doc.text(`类型: ${activity.activityType}`);
        doc.text(`时间: ${new Date(activity.startTime).toLocaleString()} - ${new Date(activity.endTime).toLocaleString()}`);
        doc.text(`时长: ${activity.duration}分钟`);
        doc.text(`地点: ${activity.location || '未指定'}`);
        if (activity.content) {
          doc.text(`内容: ${activity.content.substring(0, 100)}${activity.content.length > 100 ? '...' : ''}`);
        }
        doc.moveDown(0.5);
      });
    }
    
    // 添加生成时间
    doc.moveDown();
    doc.fontSize(10).text(`报告生成时间: ${reportData.generatedAt.toLocaleString()}`, { align: 'right' });
    
    // 完成PDF生成
    doc.end();
    
  } catch (error) {
    console.error('生成PDF报告时出错:', error);
    res.status(500).json({ message: '生成PDF报告时发生错误', error: error.message });
  }
}; 