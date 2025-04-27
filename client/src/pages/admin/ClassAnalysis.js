import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Row, Col, Select, Space,
  Statistic, message, Spin, Empty
} from 'antd';
import Table from '../../components/layout/Table';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

// 图表颜色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ClassAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [creditTypeDistribution, setCreditTypeDistribution] = useState([]);
  
  useEffect(() => {
    fetchClasses();
  }, []);
  
  useEffect(() => {
    if (selectedClass) {
      fetchClassAnalysis(selectedClass);
    }
  }, [selectedClass]);
  
  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/admin/classes');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0].id);
      }
    } catch (error) {
      console.error('获取班级列表失败:', error);
      message.error('获取班级列表失败');
    }
  };
  
  const fetchClassAnalysis = async (classId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/classes/${classId}/analysis`);
      setSummaryData(response.data.summary);
      setStudentsData(response.data.students);
      setCreditTypeDistribution(response.data.creditTypeDistribution);
    } catch (error) {
      console.error('获取班级分析数据失败:', error);
      message.error('获取班级分析数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClassChange = (value) => {
    setSelectedClass(value);
  };
  
  const renderClassSelector = () => (
    <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
      <Col span={12}>
        <Title level={4}>班级学分分析</Title>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <Text strong>选择班级:</Text>
          <Select 
            style={{ width: 200 }} 
            value={selectedClass}
            onChange={handleClassChange}
          >
            {classes.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
        </Space>
      </Col>
    </Row>
  );
  
  const renderSummaryCards = () => {
    if (!summaryData) return null;
    
    return (
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="班级平均总学分"
              value={summaryData.averageTotalCredits}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="素拓学分平均值"
              value={summaryData.averageSuketuoCredits}
              precision={2}
              valueStyle={{ color: '#0088FE' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="讲座学分平均值"
              value={summaryData.averageLectureCredits}
              precision={2}
              valueStyle={{ color: '#00C49F' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="志愿服务学分平均值"
              value={summaryData.averageVolunteerCredits}
              precision={2}
              valueStyle={{ color: '#FFBB28' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };
  
  const renderCreditDistributionChart = () => {
    if (!creditTypeDistribution || creditTypeDistribution.length === 0) {
      return <Empty description="暂无学分分布数据" />;
    }
    
    return (
      <Card title="学分类型分布" style={{ marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={creditTypeDistribution}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {creditTypeDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} 学分`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  };
  
  const renderStudentCreditsChart = () => {
    if (!studentsData || studentsData.length === 0) {
      return <Empty description="暂无学生学分数据" />;
    }
    
    // 只显示前10名学生
    const topStudents = [...studentsData]
      .sort((a, b) => b.totalCredits - a.totalCredits)
      .slice(0, 10);
    
    return (
      <Card title="学生学分排名 (前10名)" style={{ marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={topStudents}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80}
            />
            <Tooltip formatter={(value) => `${value} 学分`} />
            <Legend />
            <Bar dataKey="suketuoCredits" name="素拓学分" fill="#0088FE" stackId="a" />
            <Bar dataKey="lectureCredits" name="讲座学分" fill="#00C49F" stackId="a" />
            <Bar dataKey="volunteerCredits" name="志愿服务学分" fill="#FFBB28" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };
  
  const columns = [
    {
      title: '学生姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: '素拓学分',
      dataIndex: 'suketuoCredits',
      key: 'suketuoCredits',
      sorter: (a, b) => a.suketuoCredits - b.suketuoCredits,
    },
    {
      title: '讲座学分',
      dataIndex: 'lectureCredits',
      key: 'lectureCredits',
      sorter: (a, b) => a.lectureCredits - b.lectureCredits,
    },
    {
      title: '志愿服务学分',
      dataIndex: 'volunteerCredits',
      key: 'volunteerCredits',
      sorter: (a, b) => a.volunteerCredits - b.volunteerCredits,
    },
    {
      title: '总学分',
      dataIndex: 'totalCredits',
      key: 'totalCredits',
      sorter: (a, b) => a.totalCredits - b.totalCredits,
      defaultSortOrder: 'descend',
      render: (text) => <Text strong>{text}</Text>
    }
  ];
  
  return (
    <div className="class-analysis-container">
      {renderClassSelector()}
      
      <Spin spinning={loading}>
        {renderSummaryCards()}
        
        <Row gutter={16}>
          <Col span={12}>
            {renderCreditDistributionChart()}
          </Col>
          <Col span={12}>
            <Card title="班级学分达成率" style={{ marginBottom: 20 }}>
              {summaryData && (
                <Row>
                  <Col span={8}>
                    <Statistic 
                      title="达标人数" 
                      value={summaryData.qualifiedCount} 
                      suffix={`/ ${summaryData.totalStudents}`}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="达标率" 
                      value={summaryData.qualifiedRate * 100} 
                      precision={1}
                      suffix="%" 
                      valueStyle={{ color: summaryData.qualifiedRate >= 0.6 ? '#3f8600' : '#cf1322' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="平均达成率" 
                      value={summaryData.averageCompletionRate * 100} 
                      precision={1}
                      suffix="%" 
                    />
                  </Col>
                </Row>
              )}
            </Card>
          </Col>
        </Row>
        
        {renderStudentCreditsChart()}
        
        <Card title="学生学分详情">
          <Table
            columns={columns}
            dataSource={studentsData}
            rowKey="studentId"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default ClassAnalysis; 