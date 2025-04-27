const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Feedback = sequelize.define('Feedback', {
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
    comment: '提交反馈的用户ID'
  },
  feedbackType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '反馈类型，如学习资源反馈、系统功能反馈等'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '反馈标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '反馈内容'
  },
  relatedResourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '相关资源ID'
  },
  relatedResourceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '相关资源类型'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: '评分（1-5星）'
  },
  status: {
    type: DataTypes.ENUM('submitted', 'processing', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'submitted',
    comment: '反馈状态：已提交、处理中、已解决、已关闭'
  },
  responseContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '回复内容'
  },
  responseUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    comment: '回复用户的ID'
  },
  responseTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '回复时间'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否公开'
  }
});

// 建立与User表的关联
Feedback.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'submitter'
});

Feedback.belongsTo(User, { 
  foreignKey: 'responseUserId',
  as: 'responder'
});

module.exports = Feedback; 