const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const LearningActivity = sequelize.define('LearningActivity', {
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
  activityName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'activity_name',
    comment: '活动名称'
  },
  activityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'activity_type',
    comment: '活动类型，如自主学习、小组讨论、实践活动等'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time',
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_time',
    comment: '结束时间'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '活动时长（分钟）'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '活动地点'
  },
  participationType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'participation_type',
    comment: '参与方式，如线上、线下、混合等'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动内容'
  },
  reflection: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '学习心得'
  },
  materials: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '相关资料文件路径，多个用英文逗号分隔'
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联的学科/课程'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_public',
    comment: '是否公开'
  },
  tags: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '标签，多个用英文逗号分隔'
  },
  // 由于数据库使用下划线命名，需要显式定义created_at和updated_at字段
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'learning_activities',
  timestamps: true,
  underscored: true // 使用下划线命名法
});

// 建立与User表的关联
LearningActivity.belongsTo(User, { 
  foreignKey: 'user_id',
  as: 'student'
});

// 假设LearningActivity也需要关联到Activity模型
// 需要在server.js中在初始化所有模型后设置此关联
// 添加注释以提供指导
/* 
 * 注意：如果需要在LearningActivity和Activity之间建立关联
 * 请在server.js或单独的关联文件中添加如下代码:
 * 
 * const { Activity } = require('./models/Activity');
 * const LearningActivity = require('./models/LearningActivity');
 * 
 * LearningActivity.belongsTo(Activity, {
 *   foreignKey: 'activity_id',  // 确保LearningActivity模型中有此字段
 *   as: 'Activity'
 * });
 */

module.exports = LearningActivity; 