const express = require('express');
const router = express.Router();
const { auth } = require('../uploads/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CreditApplication = require('../models/creditApplication');
const User = require('../models/User');
const { sequelize } = require('../config/db');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/certificates');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// 此处应引入credits控制器，但目前未创建
// const creditsController = require('../controllers/credits');

// 获取学分记录
router.get('/', auth, (req, res) => {
  res.status(200).json({ message: '获取学分记录功能待实现' });
});

// 获取素拓学分记录
router.get('/suketuo', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 从数据库获取该用户的素拓学分申请记录
    const applications = await CreditApplication.findAll({
      where: {
        userId,
        creditType: 'suketuo'
      },
      order: [['created_at', 'DESC']]
    });
    
    // 格式化数据以适应前端
    const formattedData = applications.map(app => {
      const status = app.status === 'pending' ? '待审核' :
                     app.status === 'approved' ? '已通过' : '已拒绝';
      
      // 尝试从描述中提取信息
      let name = '自定义活动';
      let level = '未指定';
      let description = app.description || '';
      
      // 如果描述中包含分隔符，尝试解析
      if (app.description && app.description.includes(' - ')) {
        const parts = app.description.split(' - ');
        if (parts.length >= 1) name = parts[0];
        if (parts.length >= 2) level = parts[1];
        if (parts.length >= 3) description = parts.slice(2).join(' - ');
      }
      
      return {
        id: app.id,
        name: name,
        type: app.relatedActivityType || '其他',
        level: level,
        date: app.created_at,
        description: description,
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials
      };
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('获取素拓学分记录失败:', error);
    res.status(500).json({ message: '获取素拓学分记录失败', error: error.message });
  }
});

// 获取讲座学分记录
router.get('/lecture', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 从数据库获取该用户的讲座学分申请记录
    const applications = await CreditApplication.findAll({
      where: {
        userId,
        creditType: 'lecture'
      },
      order: [['created_at', 'DESC']]
    });
    
    // 格式化数据以适应前端
    const formattedData = applications.map(app => {
      const status = app.status === 'pending' ? '待审核' :
                     app.status === 'approved' ? '已通过' : '已拒绝';
      
      return {
        id: app.id,
        title: app.description?.split(' - ')[0] || '讲座',
        speaker: app.description?.split(' - ')[1] || '未知',
        venue: app.description?.split(' - ')[2] || '未知',
        date: app.created_at,
        duration: app.description?.split(' - ')[3] || '1',
        description: app.description?.split(' - ')[4] || '',
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials
      };
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('获取讲座学分记录失败:', error);
    res.status(500).json({ message: '获取讲座学分记录失败', error: error.message });
  }
});

// 获取劳动学分记录
router.get('/labor', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 从数据库获取用户申请的劳动学分记录
    const applications = await CreditApplication.findAll({
      where: {
        userId,
        creditType: 'labor'  // 使用'labor'类型
      },
      order: [['created_at', 'DESC']]
    });
    
    // 转换数据格式以适应前端
    const laborCredits = applications.map(app => {
      const descParts = app.description ? app.description.split(' - ') : [];
      
      // 安全地处理日期
      let dateStr = '';
      try {
        dateStr = app.created_at instanceof Date ? 
                 app.created_at.toISOString().split('T')[0] : 
                 new Date().toISOString().split('T')[0];
      } catch (e) {
        console.error('日期转换错误:', e);
        dateStr = new Date().toISOString().split('T')[0]; // 使用当天日期作为后备
      }
      
      return {
        id: app.id,
        name: descParts[0] || '劳动活动',
        location: descParts[1] || '校内',
        date: dateStr,
        duration: descParts[2] || '1',
        description: descParts[3] || '',
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: app.status === 'pending' ? '待审核' : 
                app.status === 'approved' ? '已通过' : '已拒绝',
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials
      };
    });
    
    res.status(200).json(laborCredits);
  } catch (error) {
    console.error('获取劳动学分数据失败:', error);
    res.status(500).json({ message: '获取劳动学分数据失败', error: error.message });
  }
});

// 获取单个学分记录
router.get('/:id', auth, (req, res) => {
  res.status(200).json({ message: '获取单个学分记录功能待实现' });
});

// 【管理员】获取素拓学分申请
router.get('/admin/suketuo', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    // 从数据库获取真实数据
    const applications = await CreditApplication.findAll({
      where: {
        creditType: 'suketuo'
      },
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'studentId', 'department']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // 转换数据格式以适应前端
    const formattedData = applications.map(app => {
      const status = app.status === 'pending' ? '待审核' :
                     app.status === 'approved' ? '已通过' : '已拒绝';
                     
      return {
        id: app.id,
        student: {
          id: app.applicant?.id,
          name: app.applicant?.name || '未知',
          studentId: app.applicant?.studentId || '未知',
          department: app.applicant?.department || '未知'
        },
        activityName: app.relatedActivityType || '自定义活动',
        activityType: app.relatedActivityType || '其他',
        level: '未指定', // 可从描述中提取或添加新字段到数据库
        activityDate: app.created_at,
        description: app.description,
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials ? app.proofMaterials.split(',')[0] : null,
        createdAt: app.created_at,
        reviewedAt: app.reviewedAt,
        reviewedBy: app.reviewer?.id || null
      };
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('获取素拓学分申请失败:', error);
    res.status(500).json({ message: '获取素拓学分申请失败', error: error.message });
  }
});

// 【管理员】审核通过素拓学分申请
router.post('/admin/suketuo/:id/approve', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { id } = req.params;
    const { approvedCredits, feedback } = req.body;
    
    // 数据库事务处理
    const result = await sequelize.transaction(async (t) => {
      // 查找申请记录
      const application = await CreditApplication.findByPk(id, { transaction: t });
      
      if (!application) {
        throw new Error('申请记录不存在');
      }
      
      if (application.status !== 'pending') {
        throw new Error('该申请已被处理');
      }
      
      // 更新申请状态
      application.status = 'approved';
      application.creditValue = approvedCredits; // 更新为批准的学分值
      application.reviewComments = feedback;
      application.reviewerId = req.user.id;
      application.reviewedAt = new Date();
      
      await application.save({ transaction: t });
      
      // 更新学生的学分
      const student = await User.findByPk(application.userId, { transaction: t });
      
      if (student) {
        student.suketuoCredits = parseFloat(student.suketuoCredits) + parseFloat(approvedCredits);
        await student.save({ transaction: t });
      }
      
      return application;
    });
    
    res.status(200).json({ 
      message: '申请已审核通过',
      data: {
        id: result.id,
        approvedCredits,
        feedback,
        status: '已通过',
        reviewedBy: req.user.id,
        reviewedAt: result.reviewedAt
      }
    });
  } catch (error) {
    console.error('审核素拓学分申请失败:', error);
    res.status(500).json({ message: '审核素拓学分申请失败', error: error.message });
  }
});

// 【管理员】拒绝素拓学分申请
router.post('/admin/suketuo/:id/reject', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { id } = req.params;
    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ message: '拒绝申请时必须提供反馈意见' });
    }
    
    // 查找并更新申请记录
    const application = await CreditApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ message: '申请记录不存在' });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({ message: '该申请已被处理' });
    }
    
    // 更新申请
    application.status = 'rejected';
    application.reviewComments = feedback;
    application.reviewerId = req.user.id;
    application.reviewedAt = new Date();
    
    await application.save();
    
    res.status(200).json({ 
      message: '申请已拒绝',
      data: {
        id,
        feedback,
        status: '已拒绝',
        reviewedBy: req.user.id,
        reviewedAt: application.reviewedAt
      }
    });
  } catch (error) {
    console.error('拒绝素拓学分申请失败:', error);
    res.status(500).json({ message: '拒绝素拓学分申请失败', error: error.message });
  }
});

// 申请讲座学分
router.post('/lecture/apply', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { title, speaker, venue, date, duration, description, requestedCredits } = req.body;
    const userId = req.user.id;
    
    // 处理证书文件路径
    const certificateUrl = req.file ? 
      `/uploads/certificates/${req.file.filename}` : null;
    
    // 组合讲座信息到描述字段
    const combinedDescription = `${title} - ${speaker} - ${venue} - ${duration} - ${description}`;
    
    // 保存到数据库
    const application = await CreditApplication.create({
      userId,
      creditType: 'lecture',
      description: combinedDescription,
      creditValue: parseFloat(requestedCredits),
      proofMaterials: certificateUrl,
      status: 'pending'
    });
    
    res.status(201).json({ 
      message: '讲座学分申请已提交成功',
      data: {
        id: application.id,
        title,
        speaker,
        venue,
        date,
        duration,
        description,
        requestedCredits,
        certificateUrl,
        status: '待审核'
      }
    });
  } catch (error) {
    console.error('讲座学分申请提交失败:', error);
    res.status(500).json({ message: '讲座学分申请提交失败', error: error.message });
  }
});

// 【管理员】获取讲座学分申请
router.get('/admin/lecture', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    // 从数据库获取真实数据
    const applications = await CreditApplication.findAll({
      where: {
        creditType: 'lecture'
      },
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'studentId', 'department']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // 转换数据格式以适应前端
    const formattedData = applications.map(app => {
      const status = app.status === 'pending' ? '待审核' :
                     app.status === 'approved' ? '已通过' : '已拒绝';
      
      const descParts = app.description?.split(' - ') || [];
                     
      return {
        id: app.id,
        title: descParts[0] || '讲座',
        speaker: descParts[1] || '未知',
        venue: descParts[2] || '未知',
        duration: descParts[3] || '1',
        description: descParts[4] || '',
        student: {
          id: app.applicant?.id,
          name: app.applicant?.name || '未知',
          studentId: app.applicant?.studentId || '未知',
          department: app.applicant?.department || '未知'
        },
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials,
        createdAt: app.created_at,
        reviewedAt: app.reviewedAt,
        reviewedBy: app.reviewer?.id || null
      };
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('获取讲座学分申请失败:', error);
    res.status(500).json({ message: '获取讲座学分申请失败', error: error.message });
  }
});

// 【管理员】审核通过讲座学分申请
router.post('/admin/lecture/:id/approve', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { id } = req.params;
    const { approvedCredits, feedback } = req.body;
    
    // 数据库事务处理
    const result = await sequelize.transaction(async (t) => {
      // 查找申请记录
      const application = await CreditApplication.findByPk(id, { transaction: t });
      
      if (!application) {
        throw new Error('申请记录不存在');
      }
      
      if (application.status !== 'pending') {
        throw new Error('该申请已被处理');
      }
      
      // 更新申请状态
      application.status = 'approved';
      application.creditValue = approvedCredits; // 更新为批准的学分值
      application.reviewComments = feedback;
      application.reviewerId = req.user.id;
      application.reviewedAt = new Date();
      
      await application.save({ transaction: t });
      
      // 更新学生的学分
      const student = await User.findByPk(application.userId, { transaction: t });
      
      if (student) {
        student.lectureCredits = parseFloat(student.lectureCredits || 0) + parseFloat(approvedCredits);
        await student.save({ transaction: t });
      }
      
      return application;
    });
    
    res.status(200).json({ 
      message: '申请已审核通过',
      data: {
        id: result.id,
        approvedCredits,
        feedback,
        status: '已通过',
        reviewedBy: req.user.id,
        reviewedAt: result.reviewedAt
      }
    });
  } catch (error) {
    console.error('审核讲座学分申请失败:', error);
    res.status(500).json({ message: '审核讲座学分申请失败', error: error.message });
  }
});

// 【管理员】拒绝讲座学分申请
router.post('/admin/lecture/:id/reject', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { id } = req.params;
    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ message: '拒绝申请时必须提供反馈意见' });
    }
    
    // 查找并更新申请记录
    const application = await CreditApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ message: '申请记录不存在' });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({ message: '该申请已被处理' });
    }
    
    // 更新申请
    application.status = 'rejected';
    application.reviewComments = feedback;
    application.reviewerId = req.user.id;
    application.reviewedAt = new Date();
    
    await application.save();
    
    res.status(200).json({ 
      message: '申请已拒绝',
      data: {
        id,
        feedback,
        status: '已拒绝',
        reviewedBy: req.user.id,
        reviewedAt: application.reviewedAt
      }
    });
  } catch (error) {
    console.error('拒绝讲座学分申请失败:', error);
    res.status(500).json({ message: '拒绝讲座学分申请失败', error: error.message });
  }
});

// 申请学分
router.post('/apply', auth, (req, res) => {
  res.status(200).json({ message: '申请学分功能待实现' });
});

// 申请素拓学分
router.post('/suketuo/apply', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { name, type, level, date, description, requestedCredits } = req.body;
    const userId = req.user.id;
    
    // 处理证书文件路径
    const certificateUrl = req.file ? 
      `/uploads/certificates/${req.file.filename}` : null;
    
    // 保存到数据库
    const application = await CreditApplication.create({
      userId,
      creditType: 'suketuo',
      relatedActivityType: type,
      description: `${name} - ${level} - ${description}`, // 合并多个字段到描述
      creditValue: parseFloat(requestedCredits),
      proofMaterials: certificateUrl,
      status: 'pending'
    });
    
    res.status(201).json({ 
      message: '素拓学分申请已提交成功',
      data: {
        id: application.id,
        name,
        type,
        level,
        date,
        description,
        requestedCredits,
        certificateUrl,
        status: '待审核'
      }
    });
  } catch (error) {
    console.error('素拓学分申请提交失败:', error);
    res.status(500).json({ message: '素拓学分申请提交失败', error: error.message });
  }
});

// 审核学分申请
router.put('/review/:id', auth, (req, res) => {
  res.status(200).json({ message: '审核学分申请功能待实现' });
});

// 申请劳动学分
router.post('/labor/apply', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { name, location, date, duration, description, requestedCredits } = req.body;
    const userId = req.user.id;
    
    // 处理证书文件路径
    const certificateUrl = req.file ? 
      `/uploads/certificates/${req.file.filename}` : null;
    
    // 组合劳动信息到描述字段
    const combinedDescription = `${name} - ${location} - ${duration} - ${description}`;
    
    // 保存到数据库
    const application = await CreditApplication.create({
      userId,
      creditType: 'labor',  // 使用'labor'类型
      description: combinedDescription,
      creditValue: parseFloat(requestedCredits),
      proofMaterials: certificateUrl,
      status: 'pending'
    });
    
    res.status(201).json({ 
      message: '劳动学分申请已提交成功',
      data: {
        id: application.id,
        name,
        location,
        date,
        duration,
        description,
        requestedCredits,
        certificateUrl,
        status: '待审核'
      }
    });
  } catch (error) {
    console.error('劳动学分申请提交失败:', error);
    res.status(500).json({ message: '劳动学分申请提交失败', error: error.message });
  }
});

// 【管理员】获取劳动学分申请
router.get('/admin/labor', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    // 从数据库获取真实数据
    const applications = await CreditApplication.findAll({
      where: {
        creditType: 'labor'  // 使用'labor'类型
      },
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'studentId', 'department']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // 转换数据格式以适应前端
    const formattedData = applications.map(app => {
      const status = app.status === 'pending' ? '待审核' :
                     app.status === 'approved' ? '已通过' : '已拒绝';
      
      const descParts = app.description?.split(' - ') || [];
                     
      return {
        id: app.id,
        name: descParts[0] || '劳动活动',
        location: descParts[1] || '未知',
        duration: descParts[2] || '1',
        description: descParts[3] || '',
        student: {
          id: app.applicant?.id,
          name: app.applicant?.name || '未知',
          studentId: app.applicant?.studentId || '未知',
          department: app.applicant?.department || '未知'
        },
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials,
        createdAt: app.created_at,
        reviewedAt: app.reviewedAt,
        reviewedBy: app.reviewer?.id || null
      };
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('获取劳动学分申请失败:', error);
    res.status(500).json({ message: '获取劳动学分申请失败', error: error.message });
  }
});

// 【管理员】审核通过劳动学分申请
router.post('/admin/labor/:id/approve', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { id } = req.params;
    const { approvedCredits, feedback } = req.body;
    
    // 数据库事务处理
    const result = await sequelize.transaction(async (t) => {
      // 查找申请记录
      const application = await CreditApplication.findByPk(id, { transaction: t });
      
      if (!application) {
        throw new Error('申请记录不存在');
      }
      
      if (application.status !== 'pending') {
        throw new Error('该申请已被处理');
      }
      
      // 更新申请状态
      application.status = 'approved';
      application.creditValue = approvedCredits; // 更新为批准的学分值
      application.reviewComments = feedback;
      application.reviewerId = req.user.id;
      application.reviewedAt = new Date();
      
      await application.save({ transaction: t });
      
      // 更新学生的学分
      const student = await User.findByPk(application.userId, { transaction: t });
      
      if (student) {
        // 使用laborCredits
        student.laborCredits = parseFloat(student.laborCredits || 0) + parseFloat(approvedCredits);
        await student.save({ transaction: t });
      }
      
      return application;
    });
    
    res.status(200).json({ 
      message: '申请已审核通过',
      data: {
        id: result.id,
        approvedCredits,
        feedback,
        status: '已通过',
        reviewedBy: req.user.id,
        reviewedAt: result.reviewedAt
      }
    });
  } catch (error) {
    console.error('审核劳动学分申请失败:', error);
    res.status(500).json({ message: '审核劳动学分申请失败', error: error.message });
  }
});

// 【管理员】拒绝劳动学分申请
router.post('/admin/labor/:id/reject', auth, async (req, res) => {
  try {
    // 验证是否为教师或管理员
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: '无权访问' });
    }
    
    const { id } = req.params;
    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ message: '拒绝申请时必须提供反馈意见' });
    }
    
    // 查找并更新申请记录
    const application = await CreditApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ message: '申请记录不存在' });
    }
    
    if (application.status !== 'pending') {
      return res.status(400).json({ message: '该申请已被处理' });
    }
    
    // 更新申请
    application.status = 'rejected';
    application.reviewComments = feedback;
    application.reviewerId = req.user.id;
    application.reviewedAt = new Date();
    
    await application.save();
    
    res.status(200).json({ 
      message: '申请已拒绝',
      data: {
        id,
        feedback,
        status: '已拒绝',
        reviewedBy: req.user.id,
        reviewedAt: application.reviewedAt
      }
    });
  } catch (error) {
    console.error('拒绝劳动学分申请失败:', error);
    res.status(500).json({ message: '拒绝劳动学分申请失败', error: error.message });
  }
});

module.exports = router; 