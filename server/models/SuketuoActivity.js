const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SuketuoActivity = sequelize.define('SuketuoActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  activityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '活动类型，如文体活动、社团活动等'
  },
  activityName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '活动名称'
  },
  creditValue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: '活动对应的素拓学分值'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动描述'
  },
  organizerUnit: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '组织单位'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '活动开始日期'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '活动结束日期'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '活动地点'
  },
  maxCredits: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '可获取的最大学分值'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否有效'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建者的用户ID'
  }
});

module.exports = SuketuoActivity; 