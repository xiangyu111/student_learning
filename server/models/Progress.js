const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    field: 'user_id',
    comment: '学生的用户ID'
  },
  goalTitle: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'goal_title',
    comment: '学习目标标题'
  },
  goalDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'goal_description',
    comment: '学习目标详细描述'
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'target_date',
    comment: '目标完成日期'
  },
  progressPercentage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'progress_percentage',
    comment: '完成进度百分比（0-100）'
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'overdue'),
    allowNull: false,
    defaultValue: 'not_started',
    comment: '进度状态'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '目标类别，例如：课外学习、专业技能、证书考试等'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
    comment: '优先级'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注信息'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_updated',
    comment: '最后更新时间'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'progress_tracking',
  timestamps: true,
  underscored: true
});

// 建立与User表的关联
Progress.belongsTo(User, { 
  foreignKey: 'user_id',
  as: 'student'
});

module.exports = Progress; 