const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const { Activity } = require('./Activity');

const CreditApplication = sequelize.define('CreditApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    },
    comment: '申请学生的用户ID'
  },
  creditType: {
    type: DataTypes.ENUM('suketuo', 'lecture', 'labor'),
    allowNull: false,
    field: 'credit_type',
    comment: '学分类型：素拓学分、讲座学分、劳动学分'
  },
  relatedActivityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_activity_id',
    comment: '关联的活动ID'
  },
  relatedActivityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'related_activity_type',
    comment: '关联的活动类型'
  },
  creditValue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    field: 'credit_value',
    comment: '申请的学分值'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '申请描述'
  },
  proofMaterials: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'proof_materials',
    comment: '证明材料文件路径，多个路径用英文逗号分隔'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '申请状态：待审核、已通过、已拒绝'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reviewer_id',
    comment: '审核人的用户ID'
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_comments',
    comment: '审核意见'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at',
    comment: '审核时间'
  },
  serviceHours: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'service_hours',
    comment: '劳动时长（小时），仅劳动学分适用'
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
  tableName: 'credit_applications',
  timestamps: true,
  underscored: true // 使用下划线命名法
});

// 建立与User表的关联
CreditApplication.belongsTo(User, { 
  foreignKey: 'user_id',
  as: 'applicant'
});

CreditApplication.belongsTo(User, { 
  foreignKey: 'reviewer_id',
  as: 'reviewer'
});

// 建立与Activity表的关联
CreditApplication.belongsTo(Activity, {
  foreignKey: 'related_activity_id',
  as: 'activity'
});

module.exports = CreditApplication; 