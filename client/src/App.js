import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

// 认证页面
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// 仪表盘和用户页面
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// 学习活动页面
import LearningActivities from './pages/learning/LearningActivities';

// 学分管理页面
import SuketuoCredits from './pages/credits/SuketuoCredits';
import LectureCredits from './pages/credits/LectureCredits';
import VolunteerCredits from './pages/credits/VolunteerCredits';

// 学情分析页面
import Analysis from './pages/analysis/Analysis';

// 管理员或教师页面
import StudentsManage from './pages/admin/StudentsManage';
import ActivitiesManage from './pages/admin/ActivitiesManage';
import SuketuoReview from './pages/admin/SuketuoReview';
import LectureReview from './pages/admin/LectureReview';
import VolunteerReview from './pages/admin/VolunteerReview';
import ClassAnalysis from './pages/admin/ClassAnalysis';

// 权限保护的路由组件
const ProtectedRoute = ({ element, requiredRole }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();

  // 如果正在加载用户信息，显示加载状态
  if (loading) {
    return <div>加载中...</div>;
  }

  // 如果未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // 如果指定了所需角色，但用户不具备该角色权限，显示权限不足
  if (requiredRole && currentUser.role !== requiredRole && 
      !(requiredRole === 'teacher' && currentUser.role === 'admin')) {
    return <div>权限不足</div>;
  }

  // 通过所有检查，显示目标组件
  return element;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 公共路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 受保护的路由 */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* 学生、教师和管理员可访问的路由 */}
            <Route path="/dashboard" element={
              <ProtectedRoute element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              } />
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute element={
                <AppLayout>
                  <Profile />
                </AppLayout>
              } />
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              } />
            } />
            
            {/* 学生可访问的路由 */}
            <Route path="/learning-activities" element={
              <ProtectedRoute element={
                <AppLayout>
                  <LearningActivities />
                </AppLayout>
              } requiredRole="student" />
            } />
            
            <Route path="/credits/suketuo" element={
              <ProtectedRoute element={
                <AppLayout>
                  <SuketuoCredits />
                </AppLayout>
              } requiredRole="student" />
            } />
            
            <Route path="/credits/lecture" element={
              <ProtectedRoute element={
                <AppLayout>
                  <LectureCredits />
                </AppLayout>
              } requiredRole="student" />
            } />
            
            <Route path="/credits/volunteer" element={
              <ProtectedRoute element={
                <AppLayout>
                  <VolunteerCredits />
                </AppLayout>
              } requiredRole="student" />
            } />
            
            <Route path="/analysis" element={
              <ProtectedRoute element={
                <AppLayout>
                  <Analysis />
                </AppLayout>
              } requiredRole="student" />
            } />
            
            {/* 教师和管理员可访问的路由 */}
            <Route path="/students" element={
              <ProtectedRoute element={
                <AppLayout>
                  <StudentsManage />
                </AppLayout>
              } requiredRole="teacher" />
            } />
            
            <Route path="/activities-manage" element={
              <ProtectedRoute element={
                <AppLayout>
                  <ActivitiesManage />
                </AppLayout>
              } requiredRole="teacher" />
            } />
            
            <Route path="/credits-review/suketuo" element={
              <ProtectedRoute element={
                <AppLayout>
                  <SuketuoReview />
                </AppLayout>
              } requiredRole="teacher" />
            } />
            
            <Route path="/credits-review/lecture" element={
              <ProtectedRoute element={
                <AppLayout>
                  <LectureReview />
                </AppLayout>
              } requiredRole="teacher" />
            } />
            
            <Route path="/credits-review/volunteer" element={
              <ProtectedRoute element={
                <AppLayout>
                  <VolunteerReview />
                </AppLayout>
              } requiredRole="teacher" />
            } />
            
            <Route path="/class-analysis" element={
              <ProtectedRoute element={
                <AppLayout>
                  <ClassAnalysis />
                </AppLayout>
              } requiredRole="teacher" />
            } />
            
            {/* 404页面 */}
            <Route path="*" element={<div>页面不存在</div>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App; 