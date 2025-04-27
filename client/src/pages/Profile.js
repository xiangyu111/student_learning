import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Descriptions, Tabs, List, Tag, Button, message, Spin } from 'antd';
import { UserOutlined, TrophyOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [credits, setCredits] = useState({
    suketuo: 0,
    lecture: 0,
    volunteer: 0,
    total: 0
  });

  // 获取用户参与的活动
  useEffect(() => {
    if (currentUser?.id) {
      setLoading(true);
      axios.get('/api/users/profile')
        .then(response => {
          // 假设后端返回的数据包含用户参与的活动和学分信息
          if (response.data.activities) {
            setActivities(response.data.activities);
          }
          if (response.data.credits) {
            setCredits(response.data.credits);
          }
        })
        .catch(error => {
          console.error('获取个人资料失败:', error);
          message.error('获取个人资料失败');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [currentUser?.id]);

  // 渲染用户基本信息
  const renderUserInfo = () => (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Avatar 
          size={80} 
          icon={<UserOutlined />} 
          src={currentUser?.avatar}
        />
        <div style={{ marginLeft: 20 }}>
          <Title level={3}>{currentUser?.name}</Title>
          <Text type="secondary">{currentUser?.studentId || currentUser?.teacherId}</Text>
        </div>
      </div>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="用户名">{currentUser?.username}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{currentUser?.email}</Descriptions.Item>
        <Descriptions.Item label="角色">
          {currentUser?.role === 'student' && '学生'}
          {currentUser?.role === 'teacher' && '教师'}
          {currentUser?.role === 'admin' && '管理员'}
        </Descriptions.Item>
        {currentUser?.role === 'student' && (
          <>
            <Descriptions.Item label="院系">{currentUser?.department}</Descriptions.Item>
            <Descriptions.Item label="专业">{currentUser?.major}</Descriptions.Item>
            <Descriptions.Item label="班级">{currentUser?.class}</Descriptions.Item>
            <Descriptions.Item label="年级">{currentUser?.grade}</Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="联系电话">{currentUser?.phoneNumber}</Descriptions.Item>
      </Descriptions>
    </Card>
  );

  // 渲染学分情况
  const renderCredits = () => (
    <Card title="学分统计" className="credit-card">
      <div className="credit-summary">
        <div className="credit-item">
          <div className="credit-icon suketuo">
            <TrophyOutlined />
          </div>
          <div className="credit-details">
            <div className="credit-name">素拓学分</div>
            <div className="credit-value">{credits.suketuo}</div>
          </div>
        </div>
        
        <div className="credit-item">
          <div className="credit-icon lecture">
            <BookOutlined />
          </div>
          <div className="credit-details">
            <div className="credit-name">讲座学分</div>
            <div className="credit-value">{credits.lecture}</div>
          </div>
        </div>
        
        <div className="credit-item">
          <div className="credit-icon volunteer">
            <ClockCircleOutlined />
          </div>
          <div className="credit-details">
            <div className="credit-name">志愿服务</div>
            <div className="credit-value">{credits.volunteer}</div>
          </div>
        </div>
        
        <div className="credit-item total">
          <div className="credit-icon total">
            <TrophyOutlined />
          </div>
          <div className="credit-details">
            <div className="credit-name">总学分</div>
            <div className="credit-value">{credits.total}</div>
          </div>
        </div>
      </div>
    </Card>
  );

  // 渲染活动历史
  const renderActivities = () => (
    <Card title="活动参与历史">
      <List
        itemLayout="horizontal"
        dataSource={activities}
        locale={{ emptyText: '暂无活动记录' }}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link">查看详情</Button>
            ]}
          >
            <List.Item.Meta
              title={item.title}
              description={
                <>
                  <p>{item.description}</p>
                  <p>
                    <Tag color="blue">时间: {new Date(item.startDate).toLocaleString()}</Tag>
                    <Tag color="green">地点: {item.location}</Tag>
                    <Tag color="purple">学分: {item.credits}</Tag>
                    <Tag color={item.status === '已完成' ? 'success' : 'processing'}>{item.status}</Tag>
                  </p>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <div className="profile-container">
      <Spin spinning={loading}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="个人资料" key="1">
            {renderUserInfo()}
          </TabPane>
          <TabPane tab="学分情况" key="2">
            {renderCredits()}
          </TabPane>
          <TabPane tab="活动历史" key="3">
            {renderActivities()}
          </TabPane>
        </Tabs>
      </Spin>
      
      <style jsx="true">{`
        .profile-container {
          padding: 20px;
        }
        .credit-card {
          margin-bottom: 20px;
        }
        .credit-summary {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .credit-item {
          width: 23%;
          display: flex;
          align-items: center;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.09);
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .credit-icon {
          font-size: 24px;
          padding: 15px;
          border-radius: 50%;
          margin-right: 15px;
        }
        .credit-icon.suketuo {
          background-color: #1890ff;
          color: white;
        }
        .credit-icon.lecture {
          background-color: #52c41a;
          color: white;
        }
        .credit-icon.volunteer {
          background-color: #722ed1;
          color: white;
        }
        .credit-icon.total {
          background-color: #fa8c16;
          color: white;
        }
        .credit-name {
          font-size: 14px;
          color: rgba(0,0,0,0.45);
        }
        .credit-value {
          font-size: 24px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default Profile; 