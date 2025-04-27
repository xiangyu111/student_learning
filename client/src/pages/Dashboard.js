import React, { useState, useEffect } from 'react';
import { 
  Card, Col, Row, Statistic, Space, Progress, Tag, 
  List, Button, Spin, Empty, Typography, Alert
} from 'antd';
import Table from '../components/layout/Table';
import { 
  TrophyOutlined, 
  ReadOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PlusOutlined,
  CalendarOutlined,
  BookOutlined,
  UploadOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);

  // 加载统计数据和最近活动
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 获取统计数据
        const statsRes = await axios.get('/api/dashboard/statistics');
        setStatistics(statsRes.data);
        
        // 根据用户角色获取不同数据
        if (currentUser.role === 'student') {
          // 获取学生最近活动
          const activitiesRes = await axios.get('/api/dashboard/recent-activities');
          setRecentActivities(activitiesRes.data);
        } else {
          // 获取教师待审核申请
          const pendingRes = await axios.get('/api/dashboard/pending-applications');
          setPendingApplications(pendingRes.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('获取仪表盘数据失败:', err);
        setError('获取数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    // 模拟数据，实际应从API获取
    const simulateData = () => {
      setLoading(true);
      
      // 模拟统计数据
      if (currentUser.role === 'student') {
        setStatistics({
          totalCredits: currentUser.suketuoCredits + currentUser.lectureCredits + currentUser.volunteerCredits,
          suketuoCredits: currentUser.suketuoCredits,
          lectureCredits: currentUser.lectureCredits,
          volunteerCredits: currentUser.volunteerCredits,
          activitiesCount: 12,
          completionRate: 75,
          pendingApplications: 2,
          totalActivities: 28
        });
        
        // 模拟学生最近活动
        setRecentActivities([
          {
            id: 1,
            title: '志愿服务：校园清洁日',
            type: 'volunteer',
            status: 'approved',
            date: '2023-06-15',
            credits: 2.0
          },
          {
            id: 2,
            title: '学术讲座：人工智能发展趋势',
            type: 'lecture',
            status: 'pending',
            date: '2023-06-10',
            credits: 0.5
          },
          {
            id: 3,
            title: '文体活动：校园歌手大赛',
            type: 'suketuo',
            status: 'approved',
            date: '2023-06-01',
            credits: 1.5
          },
          {
            id: 4,
            title: '社团活动：读书会',
            type: 'suketuo',
            status: 'rejected',
            date: '2023-05-25',
            credits: 0
          }
        ]);
      } else {
        // 模拟教师/管理员统计数据
        setStatistics({
          studentCount: 120,
          pendingApplicationsCount: 15,
          activitiesCount: 30,
          averageCredits: 8.5,
          suketuoApplications: 25,
          lectureApplications: 18,
          volunteerApplications: 12
        });
        
        // 模拟教师待审核申请
        setPendingApplications([
          {
            id: 1,
            studentName: '张三',
            studentId: '202101001',
            activityName: '校园清洁志愿服务',
            type: 'volunteer',
            applyDate: '2023-06-18',
            requestedCredits: 1.5
          },
          {
            id: 2,
            studentName: '李四',
            studentId: '202101002',
            activityName: '人工智能讲座',
            type: 'lecture',
            applyDate: '2023-06-17',
            requestedCredits: 0.5
          },
          {
            id: 3,
            studentName: '王五',
            studentId: '202101003',
            activityName: '校园歌手大赛',
            type: 'suketuo',
            applyDate: '2023-06-16',
            requestedCredits: 1.0
          }
        ]);
      }
      
      setError(null);
      setLoading(false);
    };

    // 使用模拟数据
    simulateData();
    
    // 实际开发时使用API
    // fetchDashboardData();
  }, [currentUser]);

  // 学生仪表盘
  const renderStudentDashboard = () => {
    return (
      <>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总学分"
                value={statistics.totalCredits || 0}
                precision={1}
                valueStyle={{ color: '#3f8600' }}
                prefix={<TrophyOutlined />}
                suffix="分"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="素拓学分"
                value={statistics.suketuoCredits || 0}
                precision={1}
                valueStyle={{ color: '#1890ff' }}
                suffix="分"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="讲座学分"
                value={statistics.lectureCredits || 0}
                precision={1}
                valueStyle={{ color: '#52c41a' }}
                suffix="分"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="志愿服务学分"
                value={statistics.volunteerCredits || 0}
                precision={1}
                valueStyle={{ color: '#722ed1' }}
                suffix="分"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Card title="学分完成进度" style={{ marginBottom: 16 }}>
              <div style={{ padding: '20px 0' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text>素拓学分：{statistics.suketuoCredits || 0}/10</Text>
                  <Progress percent={Math.min(100, ((statistics.suketuoCredits || 0) / 10) * 100)} strokeColor="#1890ff" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text>讲座学分：{statistics.lectureCredits || 0}/5</Text>
                  <Progress percent={Math.min(100, ((statistics.lectureCredits || 0) / 5) * 100)} strokeColor="#52c41a" />
                </div>
                <div>
                  <Text>志愿服务学分：{statistics.volunteerCredits || 0}/5</Text>
                  <Progress percent={Math.min(100, ((statistics.volunteerCredits || 0) / 5) * 100)} strokeColor="#722ed1" />
                </div>
              </div>
            </Card>

            <Card 
              title="最近活动" 
              extra={<Link to="/my-activities"><Button type="link" size="small">查看全部</Button></Link>}
            >
              <Table 
                dataSource={recentActivities} 
                rowKey="id"
                pagination={false}
                size="small"
              >
                <Table.Column title="活动名称" dataIndex="title" key="title" />
                <Table.Column 
                  title="状态" 
                  dataIndex="status" 
                  key="status" 
                  render={status => {
                    let color = '';
                    let text = '';
                    if (status === 'approved') {
                      color = 'success';
                      text = '已通过';
                    } else if (status === 'pending') {
                      color = 'processing';
                      text = '审核中';
                    } else if (status === 'rejected') {
                      color = 'error';
                      text = '已拒绝';
                    }
                    return <Tag color={color}>{text}</Tag>;
                  }}
                />
                <Table.Column title="日期" dataIndex="date" key="date" />
                <Table.Column title="学分" dataIndex="credits" key="credits" />
              </Table>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="学分统计" style={{ marginBottom: 16 }}>
              <div style={{ padding: '20px 0' }}>
                <Statistic
                  title="活动参与次数"
                  value={statistics.activitiesCount || 0}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<ClockCircleOutlined />}
                  suffix="个"
                />
                
                <Statistic
                  title="总体完成率"
                  value={statistics.completionRate || 0}
                  suffix="%"
                  style={{ marginTop: 16 }}
                  valueStyle={{ color: (statistics.completionRate || 0) >= 60 ? '#3f8600' : '#cf1322' }}
                />
                
                <Statistic
                  title="待审核申请"
                  value={statistics.pendingApplications || 0}
                  style={{ marginTop: 16 }}
                />
              </div>
            </Card>

            <Card title="快速操作">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} block>
                  <Link to="/learning-activities/create">记录学习活动</Link>
                </Button>
                <Button icon={<TrophyOutlined />} block>
                  <Link to="/credits/suketuo">申请素拓学分</Link>
                </Button>
                <Button icon={<BookOutlined />} block>
                  <Link to="/credits/lecture">申请讲座学分</Link>
                </Button>
                <Button icon={<BarChartOutlined />} block>
                  <Link to="/analysis">查看学情分析</Link>
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  // 教师/管理员仪表盘
  const renderTeacherDashboard = () => {
    return (
      <>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="学生总数"
                value={statistics.studentCount || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TeamOutlined />}
                suffix="人"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核申请"
                value={statistics.pendingApplicationsCount || 0}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活动总数"
                value={statistics.activitiesCount || 0}
                valueStyle={{ color: '#722ed1' }}
                prefix={<ClockCircleOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均学分"
                value={statistics.averageCredits || 0}
                precision={1}
                valueStyle={{ color: '#3f8600' }}
                prefix={<TrophyOutlined />}
                suffix="分"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Card 
              title="待审核申请" 
              extra={<Link to="/credits-review/suketuo"><Button type="link" size="small">查看全部</Button></Link>}
              style={{ marginBottom: 16 }}
            >
              <Table 
                dataSource={pendingApplications} 
                rowKey="id"
                pagination={false}
                size="small"
              >
                <Table.Column title="学生姓名" dataIndex="studentName" key="studentName" />
                <Table.Column title="学号" dataIndex="studentId" key="studentId" />
                <Table.Column 
                  title="活动名称" 
                  dataIndex="activityName" 
                  key="activityName" 
                />
                <Table.Column 
                  title="类型" 
                  dataIndex="type" 
                  key="type" 
                  render={type => {
                    let color = '';
                    let text = '';
                    if (type === 'suketuo') {
                      color = 'blue';
                      text = '素拓';
                    } else if (type === 'lecture') {
                      color = 'purple';
                      text = '讲座';
                    } else if (type === 'volunteer') {
                      color = 'orange';
                      text = '志愿';
                    }
                    return <Tag color={color}>{text}</Tag>;
                  }}
                />
                <Table.Column title="申请日期" dataIndex="applyDate" key="applyDate" />
                <Table.Column title="申请学分" dataIndex="requestedCredits" key="requestedCredits" />
                <Table.Column 
                  title="操作" 
                  key="action" 
                  render={(_, record) => (
                    <Link to={`/credits-review/${record.type}/${record.id}`}>审核</Link>
                  )}
                />
              </Table>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="学分申请分布" style={{ marginBottom: 16 }}>
              <div style={{ padding: '10px 0' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text>素拓学分申请：</Text>
                  <Progress 
                    percent={Math.round((statistics.suketuoApplications || 0) / ((statistics.suketuoApplications || 0) + (statistics.lectureApplications || 0) + (statistics.volunteerApplications || 0)) * 100)} 
                    strokeColor="#1890ff" 
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text>讲座学分申请：</Text>
                  <Progress 
                    percent={Math.round((statistics.lectureApplications || 0) / ((statistics.suketuoApplications || 0) + (statistics.lectureApplications || 0) + (statistics.volunteerApplications || 0)) * 100)} 
                    strokeColor="#722ed1" 
                  />
                </div>
                <div>
                  <Text>劳动学分申请：</Text>
                  <Progress 
                    percent={Math.round((statistics.volunteerApplications || 0) / ((statistics.suketuoApplications || 0) + (statistics.lectureApplications || 0) + (statistics.volunteerApplications || 0)) * 100)} 
                    strokeColor="#fa8c16" 
                  />
                </div>
              </div>
            </Card>

            <Card title="快速操作">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} block>
                  <Link to="/activities-manage/create">创建活动</Link>
                </Button>
                <Button icon={<TeamOutlined />} block>
                  <Link to="/students">学生管理</Link>
                </Button>
                <Button icon={<ProfileOutlined />} block>
                  <Link to="/class-analysis">班级分析</Link>
                </Button>
                <Button icon={<BookOutlined />} block>
                  <Link to="/class-reports">生成报表</Link>
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <Title level={2}>
        {currentUser.role === 'student' ? '我的学情概览' : '管理概览'}
      </Title>
      {currentUser.role === 'student' ? renderStudentDashboard() : renderTeacherDashboard()}
    </div>
  );
};

export default Dashboard; 