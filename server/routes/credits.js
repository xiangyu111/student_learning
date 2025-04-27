const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
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

// 获取单个学分记录
router.get('/:id', auth, (req, res) => {
  res.status(200).json({ message: '获取单个学分记录功能待实现' });
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
      order: [['createdAt', 'DESC']]
    });
    
    // 格式化数据以适应前端
    const formattedData = applications.map(app => {
      const status = app.status === 'pending' ? '待审核' :
                     app.status === 'approved' ? '已通过' : '已拒绝';
      
      return {
        id: app.id,
        name: app.relatedActivityType || '自定义活动',
        type: app.relatedActivityType || '其他',
        level: '未指定', // 可从描述中提取
        date: app.createdAt,
        description: app.description,
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials ? app.proofMaterials.split(',')[0] : null
      };
    });
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('获取素拓学分记录失败:', error);
    res.status(500).json({ message: '获取素拓学分记录失败', error: error.message });
  }
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
      order: [['createdAt', 'DESC']]
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
        activityDate: app.createdAt,
        description: app.description,
        requestedCredits: app.creditValue,
        approvedCredits: app.status === 'approved' ? app.creditValue : null,
        status: status,
        feedback: app.reviewComments || '',
        certificateUrl: app.proofMaterials ? app.proofMaterials.split(',')[0] : null,
        createdAt: app.createdAt,
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

// 模拟数据生成函数 
function generateMockSuketuoCredits(userId) {
  const statuses = ['待审核', '已通过', '已拒绝'];
  const types = ['学科竞赛', '创新创业', '文体活动', '社会实践', '学生工作'];
  const levels = ['国家级', '省级', '市级', '校级', '院级'];
  
  const records = [];
  for (let i = 0; i < 10; i++) {
    const requestedCredits = parseFloat((Math.random() * 3 + 0.5).toFixed(1));
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    records.push({
      id: i + 1,
      userId: userId,
      name: `素拓活动${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      date: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 180))).toISOString().split('T')[0],
      description: `这是一个${levels[Math.floor(Math.random() * levels.length)]}的${types[Math.floor(Math.random() * types.length)]}活动`,
      requestedCredits: requestedCredits,
      approvedCredits: status === '已通过' ? parseFloat((requestedCredits * 0.8).toFixed(1)) : null,
      status: status,
      feedback: status === '已拒绝' ? '证明材料不足，请补充更多相关证明' : '',
      certificateUrl: `/uploads/certificates/mock-certificate-${i+1}.pdf`,
      createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 90))).toISOString()
    });
  }
  
  return records;
}

// 模拟数据生成函数
function generateMockSuketuoApplications() {
  const statuses = ['待审核', '已通过', '已拒绝'];
  const types = ['学科竞赛', '创新创业', '文体活动', '社会实践', '学生工作'];
  const levels = ['国家级', '省级', '市级', '校级', '院级'];
  const studentNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  
  const applications = [];
  for (let i = 0; i < 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const requestedCredits = parseFloat((Math.random() * 3 + 0.5).toFixed(1));
    const studentIndex = Math.floor(Math.random() * studentNames.length);
    
    applications.push({
      id: i + 1,
      student: {
        id: 1000 + studentIndex,
        name: studentNames[studentIndex],
        studentId: `2021${String(10001 + studentIndex).padStart(5, '0')}`,
        department: '计算机学院'
      },
      activityName: `素拓活动${i + 1}`,
      activityType: types[Math.floor(Math.random() * types.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      activityDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 180))).toISOString().split('T')[0],
      description: `这是一个${levels[Math.floor(Math.random() * levels.length)]}的${types[Math.floor(Math.random() * types.length)]}活动`,
      requestedCredits: requestedCredits,
      approvedCredits: status === '已通过' ? parseFloat((requestedCredits * 0.8).toFixed(1)) : null,
      status: status,
      feedback: status === '已拒绝' ? '证明材料不足，请补充更多相关证明' : '',
      certificateUrl: `/uploads/certificates/mock-certificate-${i+1}.pdf`,
      createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 90))).toISOString(),
      reviewedAt: status !== '待审核' ? new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))).toISOString() : null,
      reviewedBy: status !== '待审核' ? 999 : null
    });
  }
  
  return applications;
}

module.exports = router; 