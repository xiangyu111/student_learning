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
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('suketuo', 'lecture', 'volunteer', 'competition', 'other'),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('未开始', '进行中', '已结束', '已取消'),
    defaultValue: '未开始'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  location: {
    type: DataTypes.STRING
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_participants'
  },
  credits: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0
  },
  organizerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'organizer_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at'
  }
}, {
  tableName: 'activities',
  timestamps: true,
  underscored: true, // 使用下划线命名法
  paranoid: true // 支持软删除
});

// 建立与User的关系
Activity.belongsTo(User, { as: 'organizer', foreignKey: 'organizer_id' });
User.hasMany(Activity, { as: 'organizedActivities', foreignKey: 'organizer_id' });

// 活动与用户的多对多关系 (通过报名)
const ActivityRegistration = sequelize.define('ActivityRegistration', {
  status: {
    type: DataTypes.ENUM('已报名', '已参加', '未参加', '已取消'),
    defaultValue: '已报名'
  },
  registerTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'register_time'
  }
}, {
  tableName: 'activity_registrations',
  underscored: true, // 使用下划线命名法
  timestamps: true,
  paranoid: true // 支持软删除
});

// 建立多对多关系 - 用户参与活动（通过ActivityRegistration）
Activity.belongsToMany(User, { 
  through: ActivityRegistration, 
  foreignKey: 'activity_id',
  otherKey: 'user_id',
  as: 'participants' 
});

User.belongsToMany(Activity, { 
  through: ActivityRegistration, 
  foreignKey: 'user_id',
  otherKey: 'activity_id',
  as: 'participatedActivities' 
});

module.exports = { Activity, ActivityRegistration }; 