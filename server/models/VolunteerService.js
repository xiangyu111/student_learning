const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VolunteerService = sequelize.define('VolunteerService', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  serviceName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '志愿服务名称'
  },
  serviceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '服务类型，如社区服务、校园服务等'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '服务内容描述'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结束时间'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '服务地点'
  },
  organizer: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '组织单位'
  },
  contactPerson: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '联系人'
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话'
  },
  maxVolunteers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最大志愿者数量'
  },
  creditValue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.5,
    comment: '每小时劳动学分值'
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

module.exports = VolunteerService; 