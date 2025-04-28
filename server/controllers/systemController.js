const User = require('../models/User');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

/**
 * 获取系统概览数据
 */
exports.getSystemOverview = async (req, res) => {
  try {
    // 获取用户总数
    const userCount = await User.count();
    
    // 按角色统计用户
    const userRoleStats = await User.findAll({
      attributes: [
        'role', 
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    
    // 获取最近注册的用户
    const recentUsers = await User.findAll({
      attributes: ['id', 'username', 'name', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    // 获取系统数据库信息
    const dbInfo = {
      name: sequelize.config.database,
      host: sequelize.config.host,
      port: sequelize.config.port,
      dialect: sequelize.options.dialect,
      status: 'connected'
    };
    
    // 构建概览数据
    const overview = {
      userCount,
      userRoleStats: userRoleStats.map(stat => ({
        role: stat.role,
        count: stat.getDataValue('count')
      })),
      recentUsers,
      dbInfo,
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    };
    
    return res.status(200).json(overview);
  } catch (error) {
    console.error('获取系统概览失败:', error);
    return res.status(500).json({ message: '获取系统概览数据失败', error: error.message });
  }
};

/**
 * 获取系统配置
 */
exports.getSystemConfig = async (req, res) => {
  try {
    // 从数据库或配置文件获取系统配置
    // 这里使用模拟数据
    const config = {
      appName: '大学生课外学情记录分析系统',
      maxUploadSize: 10, // MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      userRegistration: true,
      emailNotification: true,
      maintenanceMode: false,
      creditsSettings: {
        suketuoMax: 10,
        lectureMax: 8,
        laborMax: 6
      },
      systemEmail: 'system@example.com'
    };
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return res.status(500).json({ message: '获取系统配置失败', error: error.message });
  }
};

/**
 * 更新系统配置
 */
exports.updateSystemConfig = async (req, res) => {
  try {
    const {
      appName,
      maxUploadSize,
      allowedFileTypes,
      userRegistration,
      emailNotification,
      maintenanceMode,
      creditsSettings,
      systemEmail
    } = req.body;
    
    // 验证请求数据
    if (!appName) {
      return res.status(400).json({ message: '系统名称不能为空' });
    }
    
    // 更新系统配置
    // 在实际应用中，这里应该将配置保存到数据库或配置文件
    const updatedConfig = {
      appName,
      maxUploadSize,
      allowedFileTypes,
      userRegistration,
      emailNotification,
      maintenanceMode,
      creditsSettings,
      systemEmail
    };
    
    return res.status(200).json({ 
      message: '系统配置已更新', 
      config: updatedConfig 
    });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return res.status(500).json({ message: '更新系统配置失败', error: error.message });
  }
};

/**
 * 获取系统日志
 */
exports.getSystemLogs = async (req, res) => {
  try {
    const { logType = 'all', limit = 100 } = req.query;
    
    // 模拟系统日志数据
    const logs = [
      { id: 1, type: 'info', message: '系统启动', timestamp: new Date(Date.now() - 86400000) },
      { id: 2, type: 'warning', message: '磁盘空间不足', timestamp: new Date(Date.now() - 43200000) },
      { id: 3, type: 'error', message: '数据库连接失败', timestamp: new Date(Date.now() - 21600000) },
      { id: 4, type: 'info', message: '用户登录', timestamp: new Date(Date.now() - 3600000) },
      { id: 5, type: 'info', message: '配置更新', timestamp: new Date() }
    ];
    
    // 根据类型筛选日志
    const filteredLogs = logType === 'all' 
      ? logs 
      : logs.filter(log => log.type === logType);
    
    // 限制返回数量
    const limitedLogs = filteredLogs.slice(0, parseInt(limit));
    
    return res.status(200).json(limitedLogs);
  } catch (error) {
    console.error('获取系统日志失败:', error);
    return res.status(500).json({ message: '获取系统日志失败', error: error.message });
  }
};

/**
 * 备份系统数据
 */
exports.backupSystem = async (req, res) => {
  try {
    // 模拟备份过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const backupInfo = {
      id: Date.now(),
      filename: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`,
      size: '25.4 MB',
      createdAt: new Date(),
      status: 'completed'
    };
    
    return res.status(200).json({ 
      message: '系统备份已完成', 
      backup: backupInfo 
    });
  } catch (error) {
    console.error('系统备份失败:', error);
    return res.status(500).json({ message: '系统备份失败', error: error.message });
  }
};

/**
 * 清理系统缓存
 */
exports.clearCache = async (req, res) => {
  try {
    // 模拟清理缓存过程
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return res.status(200).json({ 
      message: '系统缓存已清理',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('清理系统缓存失败:', error);
    return res.status(500).json({ message: '清理系统缓存失败', error: error.message });
  }
}; 