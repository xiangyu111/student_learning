import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, Select, message, Table, Tag, Statistic, Row, Col, Divider, Pie } from 'antd';
import { SearchOutlined, UserOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { getActivityReport } from '../../services/reportApi';

const { Option } = Select;

const ActivityReports = () => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // 在实际应用中，应该从API获取活动列表
    // 此处为了演示，使用模拟数据
    setActivities([
      { id: 1, title: '计算机编程竞赛' },
      { id: 2, title: '数据分析讲座' },
      { id: 3, title: '校园志愿者活动' }
    ]);
  }, []);

  const fetchActivityReport = async (activityId) => {
    setLoading(true);
    try {
      const data = await getActivityReport(activityId);
      setReportData(data);
    } catch (error) {
      message.error('获取活动报告失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleActivityChange = (value) => {
    setSelectedActivity(value);
  };

  const handleSearch = () => {
    if (selectedActivity) {
      fetchActivityReport(selectedActivity);
    } else {
      message.warning('请先选择一个活动');
    }
  };

  const renderParticipantsTable = () => {
    if (!reportData) return null;

    const columns = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '学号',
        dataIndex: 'studentId',
        key: 'studentId',
      },
      {
        title: '院系',
        dataIndex: 'department',
        key: 'department',
      },
      {
        title: '专业',
        dataIndex: 'major',
        key: 'major',
      },
      {
        title: '班级',
        dataIndex: 'class',
        key: 'class',
      },
      {
        title: '年级',
        dataIndex: 'grade',
        key: 'grade',
      }
    ];

    return (
      <Card title="参与学生名单" className="report-card">
        <Table 
          columns={columns} 
          dataSource={reportData.participants} 
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    );
  };

  const renderActivityInfo = () => {
    if (!reportData) return null;
    
    const { activity } = reportData;
    
    const typeColorMap = {
      suketuo: 'blue',
      lecture: 'green',
      volunteer: 'orange',
      competition: 'purple',
      other: 'default'
    };
    
    return (
      <Card title="活动信息" className="report-card">
        <h2>{activity.title}</h2>
        <p>
          <Tag color={typeColorMap[activity.type] || 'default'}>{activity.type}</Tag>
          <span style={{ marginLeft: 8 }}>学分: {activity.credits}</span>
        </p>
        <p>时间: {new Date(activity.startDate).toLocaleString()} 至 {new Date(activity.endDate).toLocaleString()}</p>
        <p>地点: {activity.location || '未指定'}</p>
      </Card>
    );
  };

  const renderStatistics = () => {
    if (!reportData) return null;
    
    const { summary } = reportData;
    
    return (
      <Card title="参与统计" className="report-card">
        <Statistic 
          title="参与学生总数" 
          value={summary.totalParticipants} 
          suffix="人"
          style={{ marginBottom: 16 }}
        />
        
        <Divider>院系分布</Divider>
        <Row gutter={[16, 16]}>
          {Object.entries(summary.departmentStats).map(([dept, count]) => (
            <Col span={8} key={dept}>
              <Card size="small">
                <Statistic
                  title={dept}
                  value={count}
                  suffix="人"
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
        
        <Divider>专业分布</Divider>
        <Row gutter={[16, 16]}>
          {Object.entries(summary.majorStats).map(([major, count]) => (
            <Col span={8} key={major}>
              <Card size="small">
                <Statistic
                  title={major}
                  value={count}
                  suffix="人"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#0050b3' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
        
        <Divider>年级分布</Divider>
        <Row gutter={[16, 16]}>
          {Object.entries(summary.gradeStats).map(([grade, count]) => (
            <Col span={6} key={grade}>
              <Card size="small">
                <Statistic
                  title={`${grade}级`}
                  value={count}
                  suffix="人"
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  return (
    <div className="report-container">
      <Card title="活动统计报告" extra={
        <div>
          <Select
            placeholder="选择活动"
            style={{ width: 300, marginRight: 8 }}
            onChange={handleActivityChange}
            value={selectedActivity}
          >
            {activities.map(activity => (
              <Option key={activity.id} value={activity.id}>{activity.title}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
        </div>
      }>
        <Spin spinning={loading}>
          {reportData ? (
            <div>
              {renderActivityInfo()}
              {renderStatistics()}
              {renderParticipantsTable()}
            </div>
          ) : (
            <div className="empty-report">
              <p>请选择活动以生成报告</p>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ActivityReports; 