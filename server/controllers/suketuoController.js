const { validationResult } = require('express-validator');
const SuketuoActivity = require('../models/SuketuoActivity');
const CreditApplication = require('../models/creditApplication');
const User = require('../models/User');
const { Op } = require('sequelize');
const { getUploadedFilePaths } = require('../utils/fileUpload');

// @desc    创建素拓活动
// @route   POST /api/suketuo/activities
// @access  Private (Teacher, Admin)
exports.createSuketuoActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      activityType, 
      activityName, 
      creditValue, 
      description, 
      organizerUnit,
      startDate,
      endDate,
      location,
      maxCredits
    } = req.body;

    // 创建活动
    const activity = await SuketuoActivity.create({
      activityType,
      activityName,
      creditValue: parseFloat(creditValue),
      description,
      organizerUnit,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      location,
      maxCredits: maxCredits ? parseFloat(maxCredits) : null,
      createdBy: req.user.id
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('创建素拓活动错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取素拓活动列表
// @route   GET /api/suketuo/activities
// @access  Private
exports.getSuketuoActivities = async (req, res) => {
  try {
    // 获取查询参数
    const { activityType, search, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const whereConditions = {};
    
    if (activityType) whereConditions.activityType = activityType;
    if (isActive !== undefined) whereConditions.isActive = isActive === 'true';
    
    if (search) {
      whereConditions[Op.or] = [
        { activityName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { organizerUnit: { [Op.like]: `%${search}%` } }
      ];
    }

    // 查询活动列表
    const { count, rows: activities } = await SuketuoActivity.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      activities
    });
  } catch (error) {
    console.error('获取素拓活动列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取素拓活动详情
// @route   GET /api/suketuo/activities/:id
// @access  Private
exports.getSuketuoActivityById = async (req, res) => {
  try {
    const activityId = req.params.id;
    
    // 查找活动
    const activity = await SuketuoActivity.findByPk(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    res.json(activity);
  } catch (error) {
    console.error('获取素拓活动详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    更新素拓活动
// @route   PUT /api/suketuo/activities/:id
// @access  Private (Teacher, Admin)
exports.updateSuketuoActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const activityId = req.params.id;
    
    // 查找活动
    const activity = await SuketuoActivity.findByPk(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    const { 
      activityType, 
      activityName, 
      creditValue, 
      description, 
      organizerUnit,
      startDate,
      endDate,
      location,
      maxCredits,
      isActive
    } = req.body;

    // 更新活动
    await activity.update({
      activityType: activityType || activity.activityType,
      activityName: activityName || activity.activityName,
      creditValue: creditValue ? parseFloat(creditValue) : activity.creditValue,
      description: description !== undefined ? description : activity.description,
      organizerUnit: organizerUnit || activity.organizerUnit,
      startDate: startDate ? new Date(startDate) : activity.startDate,
      endDate: endDate ? new Date(endDate) : activity.endDate,
      location: location || activity.location,
      maxCredits: maxCredits ? parseFloat(maxCredits) : activity.maxCredits,
      isActive: isActive !== undefined ? isActive : activity.isActive
    });

    res.json(activity);
  } catch (error) {
    console.error('更新素拓活动错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    删除素拓活动
// @route   DELETE /api/suketuo/activities/:id
// @access  Private (Admin)
exports.deleteSuketuoActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    
    // 查找活动
    const activity = await SuketuoActivity.findByPk(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 检查是否有关联的学分申请
    const applications = await CreditApplication.count({
      where: {
        relatedActivityId: activityId,
        relatedActivityType: 'SuketuoActivity'
      }
    });

    if (applications > 0) {
      // 如果有关联申请，则只标记为非活动状态
      await activity.update({ isActive: false });
      return res.json({ message: '活动已标记为非活动状态（存在关联的学分申请记录）' });
    }

    // 没有关联申请，可以物理删除
    await activity.destroy();
    res.json({ message: '活动已成功删除' });
  } catch (error) {
    console.error('删除素拓活动错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    申请素拓学分
// @route   POST /api/suketuo/apply
// @access  Private (Student)
exports.applySuketuoCredit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      activityId, 
      creditValue, 
      description 
    } = req.body;

    // 验证活动存在
    const activity = await SuketuoActivity.findByPk(activityId);
    
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    if (!activity.isActive) {
      return res.status(400).json({ message: '该活动已关闭，无法申请学分' });
    }

    // 验证申请学分不超过活动设定的最大值
    const requestedCredit = parseFloat(creditValue);
    
    if (activity.maxCredits && requestedCredit > activity.maxCredits) {
      return res.status(400).json({ 
        message: `申请学分超过了活动允许的最大值 ${activity.maxCredits}` 
      });
    }

    if (requestedCredit <= 0) {
      return res.status(400).json({ message: '申请学分必须大于0' });
    }

    // 获取上传的文件路径
    const proofMaterials = getUploadedFilePaths(req);

    // 创建学分申请
    const application = await CreditApplication.create({
      userId: req.user.id,
      creditType: 'suketuo',
      relatedActivityId: activityId,
      relatedActivityType: 'SuketuoActivity',
      creditValue: requestedCredit,
      description,
      proofMaterials: proofMaterials.length > 0 ? proofMaterials.join(',') : null,
      status: 'pending'
    });

    // 添加活动信息到返回结果
    const result = application.toJSON();
    result.activity = activity;

    res.status(201).json(result);
  } catch (error) {
    console.error('申请素拓学分错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取学生素拓学分申请记录
// @route   GET /api/suketuo/applications
// @access  Private (Student)
exports.getMyApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    // 构建查询条件
    const whereConditions = {
      userId: req.user.id,
      creditType: 'suketuo'
    };

    if (status) {
      whereConditions.status = status;
    }

    // 查询学分申请记录
    const { count, rows: applications } = await CreditApplication.findAndCountAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username', 'role']
        }
      ]
    });

    // 获取关联的活动信息
    const applicationIds = applications.map(app => app.relatedActivityId);
    const activities = await SuketuoActivity.findAll({
      where: {
        id: { [Op.in]: applicationIds }
      }
    });

    // 将活动信息添加到申请记录中
    const result = applications.map(app => {
      const appJson = app.toJSON();
      appJson.activity = activities.find(act => act.id === app.relatedActivityId);
      return appJson;
    });

    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      applications: result
    });
  } catch (error) {
    console.error('获取素拓学分申请记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取待审核的素拓学分申请记录（教师/管理员用）
// @route   GET /api/suketuo/pending-applications
// @access  Private (Teacher, Admin)
exports.getPendingApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status = 'pending', department, className, studentId, search } = req.query;

    // 构建查询条件
    const whereConditions = {
      creditType: 'suketuo'
    };

    if (status) {
      whereConditions.status = status;
    }

    // 构建用户查询条件
    const userWhereConditions = {
      role: 'student'
    };

    if (department) userWhereConditions.department = department;
    if (className) userWhereConditions.class = className;
    if (studentId) userWhereConditions.studentId = studentId;

    if (search) {
      userWhereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } }
      ];
    }

    // 查询学分申请记录
    const { count, rows: applications } = await CreditApplication.findAndCountAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'username', 'studentId', 'department', 'major', 'class', 'grade'],
          where: userWhereConditions
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username', 'role']
        }
      ]
    });

    // 获取关联的活动信息
    const applicationIds = applications.map(app => app.relatedActivityId);
    const activities = await SuketuoActivity.findAll({
      where: {
        id: { [Op.in]: applicationIds }
      }
    });

    // 将活动信息添加到申请记录中
    const result = applications.map(app => {
      const appJson = app.toJSON();
      appJson.activity = activities.find(act => act.id === app.relatedActivityId);
      return appJson;
    });

    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      applications: result
    });
  } catch (error) {
    console.error('获取待审核素拓学分申请记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    审核素拓学分申请
// @route   PUT /api/suketuo/applications/:id
// @access  Private (Teacher, Admin)
exports.reviewApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const applicationId = req.params.id;
    const { status, reviewComments, adjustedCreditValue } = req.body;

    // 验证状态参数
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的审核状态' });
    }

    // 查询学分申请
    const application = await CreditApplication.findByPk(applicationId, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'username', 'studentId', 'suketuoCredits']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ message: '申请记录不存在' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: '该申请已经被审核过了' });
    }

    // 准备更新数据
    const updateData = {
      status,
      reviewComments,
      reviewerId: req.user.id,
      reviewedAt: new Date()
    };

    // 如果是批准申请并调整了学分值，更新学分值
    if (status === 'approved') {
      // 如果提供了调整后的学分值，则使用它，否则使用原申请值
      const creditToAdd = adjustedCreditValue !== undefined ? 
                          parseFloat(adjustedCreditValue) : 
                          application.creditValue;
      
      if (creditToAdd <= 0) {
        return res.status(400).json({ message: '批准的学分值必须大于0' });
      }

      updateData.creditValue = creditToAdd;

      // 更新学生的素拓学分
      await application.applicant.update({
        suketuoCredits: application.applicant.suketuoCredits + creditToAdd
      });
    }

    // 更新申请状态
    await application.update(updateData);

    // 重新获取完整的申请信息
    const updatedApplication = await CreditApplication.findByPk(applicationId, {
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'username', 'studentId', 'suketuoCredits']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'username', 'role']
        }
      ]
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('审核素拓学分申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取素拓活动类型列表
// @route   GET /api/suketuo/activity-types
// @access  Private
exports.getActivityTypes = async (req, res) => {
  try {
    // 从数据库中查询所有不同的活动类型
    const types = await SuketuoActivity.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('activityType')), 'activityType']],
      where: {
        activityType: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      order: [['activityType', 'ASC']]
    });
    
    res.json(types.map(t => t.activityType));
  } catch (error) {
    console.error('获取素拓活动类型列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 