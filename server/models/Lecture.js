const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lecture = sequelize.define('Lecture', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  topic: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '讲座主题'
  },
  speaker: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '主讲人'
  },
  speakerTitle: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '主讲人职称'
  },
  speakerOrg: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '主讲人所在机构'
  },
  lectureTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '讲座时间'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '讲座时长（分钟）'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '讲座地点'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '讲座描述'
  },
  creditValue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.5,
    comment: '讲座学分值'
  },
  organizer: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '组织单位'
  },
  maxAttendees: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最大参与人数'
  },
  poster: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '讲座海报URL'
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

module.exports = Lecture; 