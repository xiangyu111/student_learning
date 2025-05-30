import React, { useState, useEffect } from 'react';
import {
  Card, List, Button, Tag, Input, Select, DatePicker, Modal, Form, message, Row, Col, Spin, Typography, Empty
} from 'antd';
import {
  SearchOutlined, CalendarOutlined, TeamOutlined, EnvironmentOutlined, 
  ClockCircleOutlined, TrophyOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const LearningActivities = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityType, setActivityType] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showMyRegistered, setShowMyRegistered] = useState(false);

  // 获取活动列表
  useEffect(() => {
    fetchActivities();
  }, []);

  // 监听筛选条件变化
  useEffect(() => {
    filterActivities();
  }, [searchText, dateRange, statusFilter, activityType, showMyRegistered, activities]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/activities');
      console.log('API响应数据:', response);
      console.log('响应数据类型:', typeof response.data);
      console.log('响应数据内容:', JSON.stringify(response.data, null, 2));
      
      // 处理返回的数据格式
      let activitiesData = [];
      if (response.data && response.data.activities && Array.isArray(response.data.activities)) {
        // 如果数据在activities字段中
        activitiesData = response.data.activities;
      } else if (Array.isArray(response.data)) {
        // 如果直接返回数组
        activitiesData = response.data;
      } else if (response.data) {
        // 尝试处理其他可能的情况
        console.log('API返回了意外的数据格式');
      }
      
      console.log('处理后的活动数据:', activitiesData);
      setActivities(activitiesData);
      setFilteredActivities(activitiesData);
    } catch (error) {
      console.error('获取活动列表失败:', error);
      message.error('获取活动列表失败');
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    // 确保activities是数组
    if (!Array.isArray(activities)) {
      console.error('活动数据不是数组:', activities);
      setFilteredActivities([]);
      return;
    }
    
    let results = [...activities];

    // 按名称搜索
    if (searchText) {
      results = results.filter(activity => 
        activity.title.toLowerCase().includes(searchText.toLowerCase()) || 
        activity.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      results = results.filter(activity => {
        const startDate = moment(activity.startDate);
        return startDate.isAfter(dateRange[0]) && startDate.isBefore(dateRange[1]);
      });
    }

    // 按状态筛选
    if (statusFilter !== 'all') {
      results = results.filter(activity => activity.status === statusFilter);
    }

    // 按活动类型筛选
    if (activityType !== 'all') {
      results = results.filter(activity => activity.type === activityType);
    }

    // 按已报名筛选
    if (showMyRegistered) {
      results = results.filter(activity => activity.isRegistered);
    }

    setFilteredActivities(results);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleTypeChange = (value) => {
    setActivityType(value);
  };

  const handleMyRegisteredChange = (checked) => {
    setShowMyRegistered(checked);
  };

  const showActivityDetail = async (activity) => {
    // 先显示模态框，设置初始状态
    setDetailModalVisible(true);
    setCurrentActivity({
      ...activity,
      isRegistered: false // 默认设置为未报名，等待API返回实际状态
    });
    setLoadingDetail(true);
    
    try {
      // 尝试获取最新的活动详情
      const response = await axios.get(`/api/activities/${activity.id}`);
      if (response.data) {
        console.log('获取到的活动详情:', response.data);
        setCurrentActivity(response.data);
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
        
        // 更新活动列表
        fetchActivities(); 
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
        
        // 更新活动列表
        fetchActivities();
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
        
        // 更新活动列表
        fetchActivities(); 
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
        
        // 更新活动列表
        fetchActivities();
      } else {
        message.error('取消报名失败: ' + errorMsg);
      }
    } finally {
      setRegistering(false);
    }
  };

  // 渲染筛选工具栏
  const renderFilterBar = () => (
    <Card className="filter-bar" style={{ marginBottom: 20 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={6}>
          <Input 
            placeholder="搜索活动名称或描述" 
            prefix={<SearchOutlined />} 
            onChange={e => handleSearch(e.target.value)}
            value={searchText}
            allowClear
          />
        </Col>
        <Col xs={24} md={6}>
          <RangePicker 
            style={{ width: '100%' }} 
            placeholder={['开始日期', '结束日期']}
            onChange={handleDateRangeChange}
          />
        </Col>
        <Col xs={12} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="活动状态"
            onChange={handleStatusChange}
            value={statusFilter}
          >
            <Option value="all">全部状态</Option>
            <Option value="未开始">未开始</Option>
            <Option value="进行中">进行中</Option>
            <Option value="已结束">已结束</Option>
            <Option value="已取消">已取消</Option>
          </Select>
        </Col>
        <Col xs={12} md={4}>
          <Select
            style={{ width: '100%' }}
            placeholder="活动类型"
            onChange={handleTypeChange}
            value={activityType}
          >
            <Option value="all">全部类型</Option>
            <Option value="suketuo">素拓活动</Option>
            <Option value="lecture">讲座</Option>
            <Option value="labor">劳动</Option>
            <Option value="other">其他</Option>
          </Select>
        </Col>
        <Col xs={12} md={2}>
          <Button type="primary" onClick={fetchActivities}>
            刷新列表
          </Button>
        </Col>
        <Col xs={12} md={2}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              id="showRegistered" 
              checked={showMyRegistered}
              onChange={(e) => handleMyRegisteredChange(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <label htmlFor="showRegistered">已报名</label>
          </div>
        </Col>
      </Row>
    </Card>
  );

  // 渲染活动列表
  const renderActivityList = () => (
    <Spin spinning={loading}>
      {filteredActivities.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={filteredActivities}
          renderItem={activity => (
            <List.Item>
              <Card 
                hoverable
                cover={
                  <div className="activity-cover" style={{ 
                    height: 150,
                    background: `linear-gradient(to right, #1890ff, #52c41a)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold'
                  }}>
                    {activity.title}
                  </div>
                }
                actions={[
                  <Button 
                    type="primary" 
                    onClick={() => showActivityDetail(activity)}
                  >
                    查看详情
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{activity.title}</span>
                      <Tag color={
                        activity.status === '未开始' ? 'blue' : 
                        activity.status === '进行中' ? 'green' : 
                        activity.status === '已结束' ? 'gray' : 'red'
                      }>
                        {activity.status}
                      </Tag>
                    </div>
                  }
                  description={
                    <>
                      <p style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        marginBottom: 10
                      }}>
                        {activity.description}
                      </p>
                      <p>
                        <ClockCircleOutlined /> {moment(activity.startDate).format('YYYY-MM-DD HH:mm')}
                      </p>
                      <p>
                        <EnvironmentOutlined /> {activity.location}
                      </p>
                      <p>
                        <TeamOutlined /> {activity.currentParticipants}/{activity.capacity}
                      </p>
                      <p>
                        <TrophyOutlined /> 学分: {activity.credits}
                      </p>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无符合条件的活动" />
      )}
    </Spin>
  );

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

  return (
    <div className="learning-activities-container">
      {renderFilterBar()}
      {renderActivityList()}
      {renderDetailModal()}
    </div>
  );
};

export default LearningActivities; 