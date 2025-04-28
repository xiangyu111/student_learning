import axios from 'axios';

// 获取系统概览数据
export const getSystemOverview = async () => {
  try {
    const response = await axios.get('/api/system/overview');
    return response.data;
  } catch (error) {
    console.error('获取系统概览失败:', error);
    throw error;
  }
};

// 获取系统配置
export const getSystemConfig = async () => {
  try {
    const response = await axios.get('/api/system/config');
    return response.data;
  } catch (error) {
    console.error('获取系统配置失败:', error);
    throw error;
  }
};

// 更新系统配置
export const updateSystemConfig = async (configData) => {
  try {
    const response = await axios.put('/api/system/config', configData);
    return response.data;
  } catch (error) {
    console.error('更新系统配置失败:', error);
    throw error;
  }
};

// 获取系统日志
export const getSystemLogs = async (params = {}) => {
  try {
    const response = await axios.get('/api/system/logs', { params });
    return response.data;
  } catch (error) {
    console.error('获取系统日志失败:', error);
    throw error;
  }
};

// 备份系统
export const backupSystem = async () => {
  try {
    const response = await axios.post('/api/system/backup');
    return response.data;
  } catch (error) {
    console.error('备份系统失败:', error);
    throw error;
  }
};

// 清理系统缓存
export const clearSystemCache = async () => {
  try {
    const response = await axios.post('/api/system/clear-cache');
    return response.data;
  } catch (error) {
    console.error('清理系统缓存失败:', error);
    throw error;
  }
}; 