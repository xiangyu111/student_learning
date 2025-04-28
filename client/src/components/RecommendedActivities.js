import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Spin, Empty, Typography, message, Modal, Row, Col } from 'antd';
import { TrophyOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getRecommendedActivities } from '../services/api';
import moment from 'moment';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const RecommendedActivities = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [credits, setCredits] = useState({});
  const [lowestCreditType, setLowestCreditType] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchRecommendedActivities();
  }, []);

  const fetchRecommendedActivities = async () => {
    setLoading(true);
    try {
      const data = await getRecommendedActivities();
      setRecommendations(data.recommendedActivities || []);
      setCredits(data.credits || {});
      setLowestCreditType(data.lowestCreditType || '');
      setLoading(false);
    } catch (error) {
      console.error('获取推荐活动失败:', error);
      message.error('获取推荐活动失败');
      setLoading(false);
    }
  };

  const showActivityDetail = async (item) => {
    // 先显示模态框，设置初始状态
    setDetailModalVisible(true);
    const activity = item.activity;
    setCurrentActivity({
      ...activity,
      isRegistered: false, // 默认设置为未报名，等待API返回实际状态
      reason: item.reason
    });
    setLoadingDetail(true);
    
    try {
      // 尝试获取最新的活动详情
      const response = await axios.get(`/api/activities/${activity.id}`);
      if (response.data) {
        console.log('获取到的活动详情:', response.data);
        setCurrentActivity({
          ...response.data,
          reason: item.reason // 保持推荐理由
        });
      }
    } catch (error) {
      console.error('获取活动详情失败:', error);
      message.error('获取活动详情失败，显示可能不是最新数据');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRegister = async () => {
    if (!currentActivity) return;

    setRegistering(true);
    try {
      const response = await axios.post(`/api/activities/${currentActivity.id}/register`);
      
      if (response.status === 200) {
        message.success('报名成功');
        
        // 更新当前活动的报名状态
        setCurrentActivity({
          ...currentActivity,
          isRegistered: true,
          currentParticipants: currentActivity.currentParticipants + 1
        });
        
        // 刷新推荐活动列表
        fetchRecommendedActivities();
      }
    } catch (error) {
      console.error('报名失败:', error);
      const errorMsg = error.response?.data?.message || '未知错误';
      
      // 特殊处理：如果错误消息包含"已报名"，也更新UI状态
      if (errorMsg.includes('已报名该活动')) {
        message.info('您已报名该活动');
        
        // 更新当前活动的报名状态
        setCurrentActivity({
          ...currentActivity,
          isRegistered: true
        });
        
        // 刷新推荐活动列表
        fetchRecommendedActivities();
      } else {
        message.error('报名失败: ' + errorMsg);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!currentActivity) return;

    setRegistering(true);
    try {
      const response = await axios.post(`/api/activities/${currentActivity.id}/cancel`);
      
      if (response.status === 200) {
        message.success('已成功取消报名');
        
        // 更新当前活动的报名状态
        setCurrentActivity({
          ...currentActivity,
          isRegistered: false,
          currentParticipants: Math.max(0, currentActivity.currentParticipants - 1)
        });
        
        // 刷新推荐活动列表
        fetchRecommendedActivities();
      }
    } catch (error) {
      console.error('取消报名失败:', error);
      const errorMsg = error.response?.data?.message || '未知错误';
      
      // 特殊处理：如果错误消息包含"已取消报名"，也更新UI状态
      if (errorMsg.includes('已取消报名')) {
        message.info('您已取消报名该活动');
        
        // 更新当前活动的报名状态
        setCurrentActivity({
          ...currentActivity,
          isRegistered: false,
          currentParticipants: Math.max(0, currentActivity.currentParticipants - 1)
        });
        
        // 刷新推荐活动列表
        fetchRecommendedActivities();
      } else {
        message.error('取消报名失败: ' + errorMsg);
      }
    } finally {
      setRegistering(false);
    }
  };

  const getActivityTypeTag = (type) => {
    let color = '';
    let text = '';
    
    switch (type) {
      case 'suketuo':
        color = 'blue';
        text = '素拓活动';
        break;
      case 'lecture':
        color = 'purple';
        text = '讲座活动';
        break;
      case 'volunteer':
        color = 'orange';
        text = '劳动服务';
        break;
      case 'labor':
        color = 'orange';
        text = '劳动服务';
        break;
      default:
        color = 'default';
        text = '其他活动';
    }
    
    return <Tag color={color}>{text}</Tag>;
  };

  // 渲染活动详情模态框
  const renderDetailModal = () => (
    <Modal
      title="活动详情"
      open={detailModalVisible}
      onCancel={() => setDetailModalVisible(false)}
      footer={[
        <Button key="back" onClick={() => setDetailModalVisible(false)}>
          关闭
        </Button>,
        currentActivity && (currentActivity.status === '未开始' || currentActivity.status === '进行中') && !loadingDetail && (
          currentActivity.isRegistered ? (
            <Button 
              key="cancel-register" 
              type="primary" 
              danger
              loading={registering}
              onClick={handleCancelRegistration}
            >
              取消报名
            </Button>
          ) : (
            <Button 
              key="register" 
              type="primary" 
              loading={registering}
              onClick={handleRegister}
              disabled={
                currentActivity && 
                (currentActivity.currentParticipants >= currentActivity.capacity)
              }
            >
              {currentActivity && currentActivity.currentParticipants >= currentActivity.capacity ? 
                '名额已满' : '立即报名'}
            </Button>
          )
        )
      ]}
      width={700}
    >
      <Spin spinning={loadingDetail}>
        {currentActivity && (
          <div className="activity-detail">
            <Title level={4}>{currentActivity.title}</Title>
            
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="推荐理由" style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}>
                  <Paragraph style={{ color: '#fa8c16' }}>
                    {currentActivity.reason}
                  </Paragraph>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card title="活动信息">
                  <Paragraph>
                    <strong>活动状态:</strong> 
                    <Tag color={
                      currentActivity.status === '未开始' ? 'blue' : 
                      currentActivity.status === '进行中' ? 'green' : 
                      currentActivity.status === '已结束' ? 'gray' : 'red'
                    }>
                      {currentActivity.status}
                    </Tag>
                  </Paragraph>
                  <Paragraph>
                    <strong>活动类型:</strong> {getActivityTypeTag(currentActivity.type)}
                  </Paragraph>
                  <Paragraph>
                    <strong>活动时间:</strong> {moment(currentActivity.startDate).format('YYYY-MM-DD HH:mm')} 至 {moment(currentActivity.endDate).format('YYYY-MM-DD HH:mm')}
                  </Paragraph>
                  <Paragraph>
                    <strong>活动地点:</strong> {currentActivity.location}
                  </Paragraph>
                  <Paragraph>
                    <strong>参与人数:</strong> {currentActivity.currentParticipants}/{currentActivity.capacity}
                  </Paragraph>
                  <Paragraph>
                    <strong>活动学分:</strong> {currentActivity.credits}
                  </Paragraph>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card title="活动描述">
                  <Paragraph>{currentActivity.description}</Paragraph>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card title="报名须知">
                  <ul>
                    <li>报名成功后，请按时参加活动</li>
                    <li>活动开始前24小时内可取消报名</li>
                    <li>活动结束后将自动获得相应学分</li>
                    <li>如有疑问，请联系活动负责人</li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Spin>
    </Modal>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spin />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Empty 
        description="暂无推荐活动" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }

  return (
    <Card title={
      <div>
        <Title level={4}>个性化推荐</Title>
        {lowestCreditType && (
          <Text type="secondary">您的{lowestCreditType}较少，建议多参加相关活动</Text>
        )}
      </div>
    }>
      <List
        itemLayout="horizontal"
        dataSource={recommendations}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button 
                type="primary" 
                size="small"
                onClick={() => showActivityDetail(item)}
              >
                查看详情
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <div>
                  {item.activity.title} {getActivityTypeTag(item.activity.type)}
                </div>
              }
              description={
                <div>
                  <div><TrophyOutlined /> 学分: {item.activity.credits}</div>
                  <div><ClockCircleOutlined /> 时间: {moment(item.activity.startDate).format('YYYY-MM-DD HH:mm')}</div>
                  <div><EnvironmentOutlined /> 地点: {item.activity.location}</div>
                  <div><TeamOutlined /> 人数: {item.activity.currentParticipants}/{item.activity.capacity}</div>
                  <div style={{ color: '#f50', marginTop: 5 }}>{item.reason}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
      {renderDetailModal()}
    </Card>
  );
};

export default RecommendedActivities; 