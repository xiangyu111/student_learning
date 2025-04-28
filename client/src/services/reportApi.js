import axios from 'axios';

// 获取学生活动参与报告
export const getStudentReport = async (studentId, params = {}) => {
  try {
    const response = await axios.get(`/api/reports/student/${studentId}`, { params });
    return response.data;
  } catch (error) {
    console.error('获取学生报告失败:', error);
    throw error;
  }
};

// 获取学生活动参与报告（PDF格式）
export const getStudentReportPDF = (studentId, params = {}) => {
  const queryParams = new URLSearchParams({
    ...params,
    format: 'pdf'
  }).toString();
  
  // 创建下载链接
  const downloadUrl = `/api/reports/student/${studentId}?${queryParams}`;
  
  // 打开新窗口下载PDF
  window.open(downloadUrl, '_blank');
};

// 获取活动统计报告
export const getActivityReport = async (activityId) => {
  try {
    const response = await axios.get(`/api/reports/activity/${activityId}`);
    return response.data;
  } catch (error) {
    console.error('获取活动报告失败:', error);
    throw error;
  }
};

// 获取系统整体使用报告
export const getSystemReport = async (params = {}) => {
  try {
    const response = await axios.get('/api/reports/system', { params });
    return response.data;
  } catch (error) {
    console.error('获取系统报告失败:', error);
    throw error;
  }
}; 