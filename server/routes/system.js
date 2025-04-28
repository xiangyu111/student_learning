const express = require('express');
const router = express.Router();
const { auth } = require('../uploads/auth');
const systemController = require('../controllers/systemController');

// 获取系统概览
router.get('/overview', auth, systemController.getSystemOverview);

// 获取系统配置
router.get('/config', auth, systemController.getSystemConfig);

// 更新系统配置
router.put('/config', auth, systemController.updateSystemConfig);

// 获取系统日志
router.get('/logs', auth, systemController.getSystemLogs);

// 备份系统
router.post('/backup', auth, systemController.backupSystem);

// 清理缓存
router.post('/clear-cache', auth, systemController.clearCache);

module.exports = router; 