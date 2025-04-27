import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 配置 axios 默认请求头
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [token]);

  // 加载时检查用户登录状态
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me');
        setCurrentUser(res.data);
        setError(null);
      } catch (err) {
        console.error('加载用户信息失败:', err);
        localStorage.removeItem('token');
        setToken(null);
        setError('会话已过期，请重新登录');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // 注册方法
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/register', userData);
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setError(null);
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请稍后再试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登录方法
  const login = async (username, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { username, password });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setError(null);
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  // 更新用户信息
  const updateUserInfo = async (updatedData) => {
    try {
      setLoading(true);
      const res = await axios.put(`/api/users/${currentUser.id}`, updatedData);
      setCurrentUser({...currentUser, ...res.data});
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || '更新用户信息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const res = await axios.put('/api/auth/password', { currentPassword, newPassword });
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || '修改密码失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 检查是否已登录
  const isAuthenticated = !!token && !!currentUser;

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateUserInfo,
    changePassword,
    isAuthenticated,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 