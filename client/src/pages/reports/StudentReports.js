import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, DatePicker, Space, message, Tabs, Descriptions, List, Tag, Statistic, Row, Col, Divider } from 'antd';
import { DownloadOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentReport, getStudentReportPDF } from '../../services/reportApi';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const StudentReports = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  useEffect(() => {
    if (currentUser) {
      fetchReport();
    }
  }, [currentUser]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      
      const data = await getStudentReport(currentUser.id, params);
      setReportData(data);
    } catch (error) {
      message.error('获取报告失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleDownloadPDF = () => {
    const params = {};
    if (dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }
    
    getStudentReportPDF(currentUser.id, params);
  };

  const renderActivityTypeTags = (type) => {
    const colorMap = {
      suketuo: 'blue',
      lecture: 'green',
      volunteer: 'orange',
      competition: 'purple',
      other: 'default'
    };
    return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
  };

  const renderSummary = () => {
    if (!reportData) return null;
    
    const { summary } = reportData;
    
    return (
      <Card title="活动参与统计" className="report-card">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic 
              title="活动总数" 
              value={summary.totalActivities} 
              suffix="个" 
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="自主学习活动" 
              value={summary.totalLearningActivities} 
              suffix="个" 
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="获得学分总数" 
              value={summary.totalCredits.toFixed(1)} 
              precision={1}
            />
          </Col>
        </Row>
        
        <Divider>按活动类型统计</Divider>
        
        <List
          size="small"
          dataSource={Object.entries(summary.activityTypes)}
          renderItem={([type, data]) => (
            <List.Item>
              <List.Item.Meta
                avatar={renderActivityTypeTags(type)}
                title={`${type} 类活动`}
                description={`${data.count}个活动, ${data.credits.toFixed(1)}学分`}
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderActivitiesList = () => {
    if (!reportData) return null;
    
    return (
      <Card title="参与活动列表" className="report-card">
        <List
          itemLayout="horizontal"
          dataSource={reportData.activities}
          renderItem={activity => (
            <List.Item>
              <List.Item.Meta
                title={activity.title}
                description={
                  <>
                    <p>
                      {renderActivityTypeTags(activity.type)}
                      <span style={{ marginLeft: 8 }}>学分: {activity.credits}</span>
                    </p>
                    <p>时间: {moment(activity.startDate).format('YYYY-MM-DD HH:mm')} 至 {moment(activity.endDate).format('YYYY-MM-DD HH:mm')}</p>
                    <p>地点: {activity.location || '未指定'}</p>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderLearningActivities = () => {
    if (!reportData || !reportData.learningActivities.length) return null;
    
    return (
      <Card title="自主学习活动" className="report-card">
        <List
          itemLayout="horizontal"
          dataSource={reportData.learningActivities}
          renderItem={activity => (
            <List.Item>
              <List.Item.Meta
                title={activity.activityName}
                description={
                  <>
                    <p>
                      <Tag color="cyan">{activity.activityType}</Tag>
                      <span style={{ marginLeft: 8 }}>时长: {activity.duration}分钟</span>
                    </p>
                    <p>时间: {moment(activity.startTime).format('YYYY-MM-DD HH:mm')} 至 {moment(activity.endTime).format('YYYY-MM-DD HH:mm')}</p>
                    <p>地点: {activity.location || '未指定'}</p>
                    {activity.content && (
                      <p>内容: {activity.content.length > 100 ? `${activity.content.substring(0, 100)}...` : activity.content}</p>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderStudentInfo = () => {
    if (!reportData) return null;
    
    const { student } = reportData;
    
    return (
      <Card title="学生信息" className="report-card">
        <Descriptions bordered size="small">
          <Descriptions.Item label="姓名" span={3}>{student.name}</Descriptions.Item>
          <Descriptions.Item label="学号" span={3}>{student.studentId}</Descriptions.Item>
          <Descriptions.Item label="院系" span={3}>{student.department}</Descriptions.Item>
          <Descriptions.Item label="专业" span={3}>{student.major}</Descriptions.Item>
          <Descriptions.Item label="班级" span={3}>{student.class}</Descriptions.Item>
          <Descriptions.Item label="年级" span={3}>{student.grade}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  return (
    <div className="report-container">
      <Card title="学生活动参与报告" extra={
        <Space>
          <RangePicker onChange={handleDateChange} value={dateRange} />
          <Button type="primary" onClick={fetchReport}>查询</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
            下载PDF
          </Button>
        </Space>
      }>
        <Spin spinning={loading}>
          {reportData ? (
            <Tabs defaultActiveKey="summary">
              <TabPane
                tab={<span><BarChartOutlined />统计摘要</span>}
                key="summary"
              >
                {renderStudentInfo()}
                {renderSummary()}
              </TabPane>
              <TabPane
                tab={<span><FileTextOutlined />活动详情</span>}
                key="activities"
              >
                {renderActivitiesList()}
                {renderLearningActivities()}
              </TabPane>
            </Tabs>
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

export default StudentReports; 