import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MessageOutlined,
  BulbOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  BarsOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const getMenuItems = () => {
    // 基础菜单项，所有用户都可见
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/dashboard">首页</Link>,
      }
    ];

    // 学生特有菜单
    const studentItems = [
      {
        key: '/learning-activities',
        icon: <BookOutlined />,
        label: <Link to="/learning-activities">学习活动记录</Link>,
      },
      {
        key: '/recommended-activities',
        icon: <BulbOutlined />,
        label: <Link to="/recommended-activities">个性化学分推荐</Link>,
      },
      {
        key: 'credits',
        icon: <TrophyOutlined />,
        label: '学分管理',
        children: [
          {
            key: '/credits/suketuo',
            label: <Link to="/credits/suketuo">素拓学分</Link>,
          },
          {
            key: '/credits/lecture',
            label: <Link to="/credits/lecture">讲座学分</Link>,
          },
          {
            key: '/credits/labor',
            label: <Link to="/credits/labor">劳动学分</Link>,
          },
        ],
      },
      {
        key: '/analysis',
        icon: <BarChartOutlined />,
        label: <Link to="/analysis">学情分析</Link>,
      },
      {
        key: '/progress',
        icon: <ScheduleOutlined />,
        label: <Link to="/progress">进度跟踪</Link>,
      },
      {
        key: '/reports',
        icon: <FileTextOutlined />,
        label: <Link to="/reports">报表生成</Link>,
      },
      {
        key: '/discussions',
        icon: <MessageOutlined />,
        label: <Link to="/discussions">讨论交流</Link>,
      },
    ];

    // 教师特有菜单
    const teacherItems = [
      {
        key: '/students',
        icon: <TeamOutlined />,
        label: <Link to="/students">学生管理</Link>,
      },
      {
        key: '/activities-manage',
        icon: <BarsOutlined />,
        label: <Link to="/activities-manage">活动管理</Link>,
      },
      {
        key: 'credits-review',
        icon: <TrophyOutlined />,
        label: '学分审核',
        children: [
          {
            key: '/credits-review/suketuo',
            label: <Link to="/credits-review/suketuo">素拓学分审核</Link>,
          },
          {
            key: '/credits-review/lecture',
            label: <Link to="/credits-review/lecture">讲座学分审核</Link>,
          },
          {
            key: '/credits-review/labor',
            label: <Link to="/credits-review/labor">劳动学分审核</Link>,
          },
        ],
      },
      {
        key: '/class-analysis',
        icon: <BarChartOutlined />,
        label: <Link to="/class-analysis">班级学情分析</Link>,
      },
      {
        key: '/class-reports',
        icon: <FileTextOutlined />,
        label: <Link to="/class-reports">班级报表</Link>,
      },
    ];

    // 管理员特有菜单
    const adminItems = [
      {
        key: '/system',
        icon: <SettingOutlined />,
        label: <Link to="/system">系统管理</Link>,
      },
      {
        key: '/recommendation',
        icon: <BulbOutlined />,
        label: <Link to="/recommendation">推荐系统设置</Link>,
      },
    ];

    // 根据用户角色返回相应菜单
    if (currentUser?.role === 'student') {
      return [...baseItems, ...studentItems];
    } else if (currentUser?.role === 'teacher') {
      return [...baseItems, ...teacherItems];
    } else if (currentUser?.role === 'admin') {
      return [...baseItems, ...teacherItems, ...adminItems];
    }

    return baseItems;
  };

  // 用户下拉菜单
  const userMenu = (
    <Menu
      items={[
        {
          key: '1',
          icon: <UserOutlined />,
          label: <Link to="/profile">个人资料</Link>,
        },
        {
          key: '2',
          icon: <SettingOutlined />,
          label: <Link to="/settings">账号设置</Link>,
        },
        {
          type: 'divider',
        },
        {
          key: '3',
          icon: <LogoutOutlined />,
          label: '退出登录',
          onClick: () => {
            logout();
            navigate('/login');
          },
        },
      ]}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 8px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          height: '64px',
          padding: collapsed ? '0' : '0 16px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: token.colorPrimary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`
        }}>
          {collapsed ? '学情' : '课外学情记录系统'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={[pathname]}
          selectedKeys={[pathname]}
          items={getMenuItems()}
          style={{ marginTop: '8px' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} src={currentUser?.avatar} />
                <span style={{ marginLeft: 8, display: collapsed ? 'none' : 'inline' }}>
                  {currentUser?.name || '用户'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          minHeight: 280, 
          background: token.colorBgContainer,
          borderRadius: token.borderRadius,
          overflow: 'initial'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;