const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 从环境变量中获取数据库配置
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_NAME = process.env.DB_NAME || 'student_learning_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'root';

// 创建Sequelize实例
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // 默认为每个模型添加 createdAt 和 updatedAt 字段
    paranoid: true, // 使用软删除（添加 deletedAt 字段）
    underscored: true, // 使用下划线命名法，而不是驼峰命名法
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

module.exports = { sequelize, Sequelize }; 