import React from 'react';
import { Tabs, Card } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import StudentReports from './StudentReports';
import ActivityReports from './ActivityReports';
import SystemReports from './SystemReports';
import { BarChartOutlined, TeamOutlined, AppstoreOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const Reports = () => {
  const { currentUser } = useAuth();
  const isStudent = currentUser?.role === 'student';
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="reports-container">
      <Card title="学习报表中心">
        <Tabs defaultActiveKey={isStudent ? "student" : isTeacher ? "activity" : "system"}>
          {(isStudent || isTeacher || isAdmin) && (
            <TabPane 
              tab={<span><BarChartOutlined />学生活动报表</span>} 
              key="student"
            >
              <StudentReports />
            </TabPane>
          )}
          
          {(isTeacher || isAdmin) && (
            <TabPane 
              tab={<span><TeamOutlined />活动统计报表</span>} 
              key="activity"
            >
              <ActivityReports />
            </TabPane>
          )}
          
          {isAdmin && (
            <TabPane 
              tab={<span><AppstoreOutlined />系统整体报表</span>} 
              key="system"
            >
              <SystemReports />
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default Reports; 