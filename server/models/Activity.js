const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  credits: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('未开始', '进行中', '已结束', '已取消'),
    defaultValue: '未开始'
  },
  organizerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'activities',
  timestamps: true
});

// 建立与User的关系
Activity.belongsTo(User, { as: 'organizer', foreignKey: 'organizerId' });
User.hasMany(Activity, { as: 'organizedActivities', foreignKey: 'organizerId' });

// 建立多对多关系 - 用户参与活动
Activity.belongsToMany(User, { through: 'ActivityParticipants', as: 'participants' });
User.belongsToMany(Activity, { through: 'ActivityParticipants', as: 'participatedActivities' });

module.exports = { Activity }; 