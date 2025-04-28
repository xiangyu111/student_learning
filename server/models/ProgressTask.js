const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Progress = require('./Progress');

const ProgressTask = sequelize.define('ProgressTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  progressId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Progress,
      key: 'id'
    },
    field: 'progress_id',
    comment: '关联的进度目标ID'
  },
  taskName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'task_name',
    comment: '子任务名称'
  },
  taskDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'task_description',
    comment: '子任务描述'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_completed',
    comment: '是否已完成'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'due_date',
    comment: '截止日期'
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_date',
    comment: '完成日期'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序'
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
  tableName: 'progress_tasks',
  timestamps: true,
  underscored: true
});

// 建立与Progress表的关联
ProgressTask.belongsTo(Progress, { 
  foreignKey: 'progress_id',
  as: 'progress'
});

// 在Progress模型中设置关联
Progress.hasMany(ProgressTask, {
  foreignKey: 'progress_id',
  as: 'tasks'
});

module.exports = ProgressTask; 