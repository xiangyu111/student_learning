import axios from 'axios';

// 获取用户推荐活动
export const getRecommendedActivities = async () => {
  try {
    const response = await axios.get('/api/users/recommended-activities');
    return response.data;
  } catch (error) {
    console.error('获取推荐活动失败:', error);
    throw error;
  }
}; 