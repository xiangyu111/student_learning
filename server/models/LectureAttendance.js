const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Lecture = require('./Lecture');

const LectureAttendance = sequelize.define('LectureAttendance', {
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
    comment: '参与学生的用户ID'
  },
  lectureId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Lecture,
      key: 'id'
    },
    comment: '讲座ID'
  },
  attendTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '参与时间'
  },
  status: {
    type: DataTypes.ENUM('registered', 'attended', 'absent'),
    allowNull: false,
    defaultValue: 'registered',
    comment: '参与状态：已报名、已参加、缺席'
  },
  signInTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '签到时间'
  },
  signOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '签退时间'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  creditApplicationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联的学分申请ID'
  }
});

// 建立与User表和Lecture表的关联
LectureAttendance.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'student'
});

LectureAttendance.belongsTo(Lecture, { 
  foreignKey: 'lectureId',
  as: 'lecture'
});

module.exports = LectureAttendance; 