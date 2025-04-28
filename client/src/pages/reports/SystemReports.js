import React, { useState } from 'react';
import { Card, Button, Spin, DatePicker, Space, message, Descriptions, Statistic, Row, Col, Divider } from 'antd';
import { SearchOutlined, TeamOutlined, FileOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getSystemReport } from '../../services/reportApi';

const { RangePicker } = DatePicker;

const SystemReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      const data = await getSystemReport(params);
      setReportData(data);
    } catch (error) {
      message.error('获取系统报告失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const renderUserStats = () => {
    if (!reportData || !reportData.summary.userStats || reportData.summary.userStats.length === 0) return null;
    
    return (
      <Card title="用户统计" className="report-card">
        <Row gutter={[16, 16]}>
          {reportData.summary.userStats.map(stat => (
            <Col span={8} key={stat.role}>
              <Statistic
                title={`${stat.role === 'student' ? '学生' : stat.role === 'teacher' ? '教师' : '管理员'}用户数`}
                value={stat.count}
                suffix="人"
                prefix={<TeamOutlined />}
                valueStyle={{ color: stat.role === 'student' ? '#1890ff' : 
                  stat.role === 'teacher' ? '#52c41a' : '#722ed1' }}
              />
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderActivityStats = () => {
    if (!reportData || !reportData.summary.activityStats || reportData.summary.activityStats.length === 0) return null;
    
    const typeNameMap = {
      suketuo: '素拓',
      lecture: '讲座',
      volunteer: '志愿',
      competition: '竞赛',
      other: '其他'
    };
    
    return (
      <Card title="活动统计" className="report-card">
        <Row gutter={[16, 16]}>
          {reportData.summary.activityStats.map(stat => (
            <Col span={6} key={stat.type}>
              <Statistic
                title={`${typeNameMap[stat.type] || stat.type}类活动数`}
                value={stat.count}
                suffix="个"
                prefix={<FileOutlined />}
                valueStyle={{ color: stat.type === 'suketuo' ? '#1890ff' : 
                  stat.type === 'lecture' ? '#52c41a' : 
                  stat.type === 'volunteer' ? '#fa8c16' : 
                  stat.type === 'competition' ? '#eb2f96' : '#8c8c8c' }}
              />
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderLearningActivityStats = () => {
    if (!reportData || !reportData.summary.learningActivityStats || reportData.summary.learningActivityStats.length === 0) return null;
    
    return (
      <Card title="学习活动统计" className="report-card">
        <Row gutter={[16, 16]}>
          {reportData.summary.learningActivityStats.map((stat, index) => (
            <Col span={6} key={stat.activityType || index}>
              <Statistic
                title={`${stat.activityType || '其他'}类学习活动`}
                value={stat.count}
                suffix="个"
                valueStyle={{ color: index % 5 === 0 ? '#1890ff' : 
                  index % 5 === 1 ? '#52c41a' : 
                  index % 5 === 2 ? '#fa8c16' : 
                  index % 5 === 3 ? '#eb2f96' : '#8c8c8c' }}
              />
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderPeriodInfo = () => {
    if (!reportData) return null;
    
    const { period, generatedAt } = reportData;
    
    return (
      <Card title="报告信息" className="report-card">
        <Descriptions bordered size="small">
          <Descriptions.Item label="开始日期" span={3}>
            {period.startDate ? moment(period.startDate).format('YYYY-MM-DD') : '全部'}
          </Descriptions.Item>
          <Descriptions.Item label="结束日期" span={3}>
            {period.endDate ? moment(period.endDate).format('YYYY-MM-DD') : '全部'}
          </Descriptions.Item>
          <Descriptions.Item label="生成时间" span={3}>
            {moment(generatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  return (
    <div className="report-container">
      <Card title="系统整体使用报告" extra={
        <Space>
          <RangePicker onChange={handleDateChange} value={dateRange} />
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchReport}>
            查询
          </Button>
        </Space>
      }>
        <Spin spinning={loading}>
          {reportData ? (
            <div>
              {renderPeriodInfo()}
              <Divider />
              {renderUserStats()}
              {renderActivityStats()}
              {renderLearningActivityStats()}
            </div>
          ) : (
            <div className="empty-report">
              <p>请选择日期范围获取报告</p>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default SystemReports; 