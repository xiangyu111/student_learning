const User = require('../models/User');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');

// @desc    获取用户资料
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 查找用户
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // 排除密码字段
    });
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 检查权限：只有管理员、教师或用户本人可以查看
    if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.id !== user.id) {
      return res.status(403).json({ message: '权限不足' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('获取用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    更新用户资料
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.params.id;
    
    // 检查权限：只有管理员或用户本人可以更新
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: '权限不足' });
    }
    
    // 查找用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const { 
      name, 
      email, 
      department,
      major,
      class: className,
      grade,
      phoneNumber,
      avatar
    } = req.body;
    
    // 如果修改了邮箱，检查是否已存在
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: userId } // 排除当前用户
        } 
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: '邮箱已被使用' });
      }
    }
    
    // 更新用户信息
    await user.update({
      name: name || user.name,
      email: email || user.email,
      department: department || user.department,
      major: major || user.major,
      class: className || user.class,
      grade: grade || user.grade,
      phoneNumber: phoneNumber || user.phoneNumber,
      avatar: avatar || user.avatar
    });
    
    // 返回更新后的用户信息（不包含密码）
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取学生列表（仅限教师和管理员）
// @route   GET /api/users/students
// @access  Private (Teacher, Admin)
exports.getStudents = async (req, res) => {
  try {
    // 获取查询参数
    const { department, major, className, grade, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereConditions = { role: 'student' };
    
    if (department) whereConditions.department = department;
    if (major) whereConditions.major = major;
    if (className) whereConditions.class = className;
    if (grade) whereConditions.grade = grade;
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 查询学生列表
    const { count, rows: students } = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] }, // 排除密码字段
      order: [['id', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      students
    });
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取教师列表（仅限管理员）
// @route   GET /api/users/teachers
// @access  Private (Admin)
exports.getTeachers = async (req, res) => {
  try {
    // 获取查询参数
    const { department, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereConditions = { role: 'teacher' };
    
    if (department) whereConditions.department = department;
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { teacherId: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 查询教师列表
    const { count, rows: teachers } = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] }, // 排除密码字段
      order: [['id', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      teachers
    });
  } catch (error) {
    console.error('获取教师列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取所有学院/系部列表（用于筛选）
// @route   GET /api/users/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    // 获取去重后的学院/系部列表
    const departments = await User.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('department')), 'department']],
      where: {
        department: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      }
    });
    
    res.json(departments.map(item => item.department));
  } catch (error) {
    console.error('获取学院列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取所有专业列表（按学院分组）
// @route   GET /api/users/majors
// @access  Private
exports.getMajors = async (req, res) => {
  try {
    const { department } = req.query;
    
    // 构建查询条件
    const whereConditions = {
      major: {
        [Op.not]: null,
        [Op.ne]: ''
      }
    };
    
    if (department) whereConditions.department = department;
    
    // 获取专业列表
    const majors = await User.findAll({
      attributes: ['department', [sequelize.fn('DISTINCT', sequelize.col('major')), 'major']],
      where: whereConditions,
      order: [['department', 'ASC'], ['major', 'ASC']]
    });
    
    // 按部门分组
    const result = {};
    majors.forEach(item => {
      if (!result[item.department]) {
        result[item.department] = [];
      }
      result[item.department].push(item.major);
    });
    
    res.json(result);
  } catch (error) {
    console.error('获取专业列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取班级列表
// @route   GET /api/users/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    const { department, major, grade } = req.query;
    
    // 构建查询条件
    const whereConditions = {
      class: {
        [Op.not]: null,
        [Op.ne]: ''
      },
      role: 'student'
    };
    
    if (department) whereConditions.department = department;
    if (major) whereConditions.major = major;
    if (grade) whereConditions.grade = grade;
    
    // 获取班级列表
    const classes = await User.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('class')), 'class'],
        'department',
        'major',
        'grade'
      ],
      where: whereConditions,
      order: [['grade', 'DESC'], ['class', 'ASC']]
    });
    
    res.json(classes);
  } catch (error) {
    console.error('获取班级列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取年级列表
// @route   GET /api/users/grades
// @access  Private
exports.getGrades = async (req, res) => {
  try {
    // 获取去重后的年级列表
    const grades = await User.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('grade')), 'grade']],
      where: {
        grade: {
          [Op.not]: null,
          [Op.ne]: ''
        },
        role: 'student'
      },
      order: [['grade', 'DESC']]
    });
    
    res.json(grades.map(item => item.grade));
  } catch (error) {
    console.error('获取年级列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// @desc    获取个性化学习活动推荐
// @route   GET /api/users/recommended-activities
// @access  Private (Student)
exports.getRecommendedActivities = async (req, res) => {
  try {
    // 获取当前用户ID
    const userId = req.user.id;
    
    // 查找用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 判断用户学分情况
    const { suketuoCredits, lectureCredits, laborCredits } = user;
    
    // 获取所有未结束的活动
    const { Activity } = require('../models/Activity');
    const currentDate = new Date();
    
    const activities = await Activity.findAll({
      where: {
        endDate: { [Op.gt]: currentDate },
        status: { [Op.ne]: '已取消' }
      },
      limit: 10,
      order: [['startDate', 'ASC']]
    });
    
    // 根据学分情况进行推荐
    let recommendedActivities = [];
    
    // 计算最低学分类型
    const creditTypes = [
      { type: 'suketuo', value: suketuoCredits, name: '素拓学分' },
      { type: 'lecture', value: lectureCredits, name: '讲座学分' },
      { type: 'volunteer', value: laborCredits, name: '劳动学分' }
    ];
    
    // 按学分值从小到大排序
    creditTypes.sort((a, b) => a.value - b.value);
    
    // 为每个活动添加推荐理由
    activities.forEach(activity => {
      let recommendation = {
        activity,
        reason: '',
        priority: 0
      };
      
      // 根据活动类型和用户学分情况计算优先级
      if (activity.type === creditTypes[0].type) {
        recommendation.reason = `您的${creditTypes[0].name}较少，参与此活动可获得${activity.credits}学分`;
        recommendation.priority = 3; // 最高优先级
      } else if (activity.type === creditTypes[1].type) {
        recommendation.reason = `您的${creditTypes[1].name}可以提高，参与此活动可获得${activity.credits}学分`;
        recommendation.priority = 2; // 中等优先级
      } else if (activity.type === creditTypes[2].type) {
        recommendation.reason = `参与此活动可获得${activity.credits}学分`;
        recommendation.priority = 1; // 正常优先级
      } else {
        recommendation.reason = `丰富您的课外活动经历`;
        recommendation.priority = 0; // 最低优先级
      }
      
      recommendedActivities.push(recommendation);
    });
    
    // 按照优先级排序推荐活动
    recommendedActivities.sort((a, b) => b.priority - a.priority);
    
    res.json({
      credits: {
        suketuo: suketuoCredits,
        lecture: lectureCredits,
        labor: laborCredits
      },
      lowestCreditType: creditTypes[0].name,
      recommendedActivities
    });
    
  } catch (error) {
    console.error('获取推荐活动错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 