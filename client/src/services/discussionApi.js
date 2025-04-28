import axios from 'axios';

// 获取讨论列表
export const getDiscussions = async (params) => {
  try {
    const response = await axios.get('/api/discussions', { params });
    return response.data;
  } catch (error) {
    console.error('获取讨论列表失败:', error);
    throw error;
  }
};

// 获取讨论详情
export const getDiscussionById = async (id) => {
  try {
    const response = await axios.get(`/api/discussions/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取讨论详情失败:', error);
    throw error;
  }
};

// 创建讨论
export const createDiscussion = async (discussionData) => {
  try {
    const formData = new FormData();
    
    // 添加基本字段
    Object.keys(discussionData).forEach(key => {
      if (key !== 'attachments') {
        formData.append(key, discussionData[key]);
      }
    });
    
    // 添加附件
    if (discussionData.attachments && discussionData.attachments.length > 0) {
      discussionData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await axios.post('/api/discussions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('创建讨论失败:', error);
    throw error;
  }
};

// 更新讨论
export const updateDiscussion = async (id, discussionData) => {
  try {
    const formData = new FormData();
    
    // 添加基本字段
    Object.keys(discussionData).forEach(key => {
      if (key !== 'attachments') {
        formData.append(key, discussionData[key]);
      }
    });
    
    // 添加附件
    if (discussionData.attachments && discussionData.attachments.length > 0) {
      discussionData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await axios.put(`/api/discussions/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('更新讨论失败:', error);
    throw error;
  }
};

// 删除讨论
export const deleteDiscussion = async (id) => {
  try {
    const response = await axios.delete(`/api/discussions/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除讨论失败:', error);
    throw error;
  }
};

// 创建回复
export const createReply = async (discussionId, replyData) => {
  try {
    const formData = new FormData();
    
    // 添加基本字段
    Object.keys(replyData).forEach(key => {
      if (key !== 'attachments') {
        formData.append(key, replyData[key]);
      }
    });
    
    // 添加附件
    if (replyData.attachments && replyData.attachments.length > 0) {
      replyData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await axios.post(`/api/discussions/${discussionId}/replies`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('创建回复失败:', error);
    throw error;
  }
};

// 获取子回复
export const getChildReplies = async (replyId) => {
  try {
    const response = await axios.get(`/api/discussions/replies/${replyId}/children`);
    return response.data;
  } catch (error) {
    console.error('获取子回复失败:', error);
    throw error;
  }
};

// 更新回复
export const updateReply = async (replyId, replyData) => {
  try {
    const formData = new FormData();
    
    // 添加基本字段
    Object.keys(replyData).forEach(key => {
      if (key !== 'attachments') {
        formData.append(key, replyData[key]);
      }
    });
    
    // 添加附件
    if (replyData.attachments && replyData.attachments.length > 0) {
      replyData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await axios.put(`/api/discussions/replies/${replyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('更新回复失败:', error);
    throw error;
  }
};

// 删除回复
export const deleteReply = async (replyId) => {
  try {
    const response = await axios.delete(`/api/discussions/replies/${replyId}`);
    return response.data;
  } catch (error) {
    console.error('删除回复失败:', error);
    throw error;
  }
};

// 置顶/取消置顶讨论
export const toggleStickyDiscussion = async (id) => {
  try {
    const response = await axios.patch(`/api/discussions/${id}/sticky`);
    return response.data;
  } catch (error) {
    console.error('修改置顶状态失败:', error);
    throw error;
  }
};

// 锁定/解锁讨论
export const toggleLockDiscussion = async (id) => {
  try {
    const response = await axios.patch(`/api/discussions/${id}/lock`);
    return response.data;
  } catch (error) {
    console.error('修改锁定状态失败:', error);
    throw error;
  }
};

// 采纳最佳回复
export const acceptReply = async (replyId) => {
  try {
    const response = await axios.patch(`/api/discussions/replies/${replyId}/accept`);
    return response.data;
  } catch (error) {
    console.error('采纳回复失败:', error);
    throw error;
  }
};

// 获取讨论分类和标签统计
export const getCategoriesAndTags = async () => {
  try {
    const response = await axios.get('/api/discussions/categories-tags');
    return response.data;
  } catch (error) {
    console.error('获取分类和标签统计失败:', error);
    throw error;
  }
}; 