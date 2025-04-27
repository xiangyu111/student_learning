import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Spin, Typography, Table, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Analysis = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    moment().subtract(6, 'months'), 
    moment()
  ]);
  const [analysisData, setAnalysisData] = useState({
    creditTrend: [],
    activityParticipation: [],
    creditDistribution: {
      suketuo: 0,
      lecture: 0,
      volunteer: 0
    },
    recentActivities: []
  });

  useEffect(() => {
    fetchAnalysisData();
  }, [dateRange]);

  const fetchAnalysisData = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      // 确保使用正确的端口号 5000，不是 3000
      const response = await axios.get('/api/analysis', {
        params: {
          startDate: dateRange[0]?.format('YYYY-MM-DD'),
          endDate: dateRange[1]?.format('YYYY-MM-DD')
        }
      });
      
      if (response.data) {
        setAnalysisData(response.data);
      } else {
        // 使用模拟数据
        setAnalysisData({
          creditTrend: generateMockCreditTrend(),
          activityParticipation: generateMockActivityParticipation(),
          creditDistribution: {
            suketuo: 8.5,
            lecture: 4.0,
            volunteer: 2.5
          },
          recentActivities: generateMockRecentActivities()
        });
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      message.error('获取分析数据失败');
      // 使用模拟数据以展示UI
      setAnalysisData({
        creditTrend: generateMockCreditTrend(),
        activityParticipation: generateMockActivityParticipation(),
        creditDistribution: {
          suketuo: 8.5,
          lecture: 4.0,
          volunteer: 2.5
        },
        recentActivities: generateMockRecentActivities()
      });
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据生成函数
  const generateMockCreditTrend = () => {
    const months = [];
    const suketuo = [];
    const lecture = [];
    const volunteer = [];
    const total = [];

    const currentDate = moment();
    for (let i = 5; i >= 0; i--) {
      const month = moment(currentDate).subtract(i, 'months').format('YYYY-MM');
      months.push(month);
      
      const suketuoValue = parseFloat((Math.random() * 2).toFixed(1));
      const lectureValue = parseFloat((Math.random() * 1.5).toFixed(1));
      const volunteerValue = parseFloat((Math.random() * 1).toFixed(1));
      
      suketuo.push(suketuoValue);
      lecture.push(lectureValue);
      volunteer.push(volunteerValue);
      total.push(parseFloat((suketuoValue + lectureValue + volunteerValue).toFixed(1)));
    }

    return { months, suketuo, lecture, volunteer, total };
  };

  const generateMockActivityParticipation = () => {
    return [
      { name: '素拓活动', value: 15 },
      { name: '讲座', value: 8 },
      { name: '志愿服务', value: 5 },
      { name: '竞赛', value: 3 }
    ];
  };

  const generateMockRecentActivities = () => {
    const activities = [];
    for (let i = 1; i <= 5; i++) {
      activities.push({
        id: i,
        title: `活动${i}`,
        type: i % 3 === 0 ? '讲座' : i % 3 === 1 ? '素拓' : '志愿服务',
        date: moment().subtract(i * 5, 'days').format('YYYY-MM-DD'),
        credits: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
        status: i === 1 ? '进行中' : '已完成'
      });
    }
    return activities;
  };

  // 学分趋势图配置
  const getCreditTrendOption = () => {
    const { months, suketuo, lecture, volunteer, total } = analysisData.creditTrend;
    
    return {
      title: {
        text: '学分获取趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['素拓学分', '讲座学分', '志愿服务', '总学分'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months || []
      },
      yAxis: {
        type: 'value',
        name: '学分'
      },
      series: [
        {
          name: '素拓学分',
          type: 'bar',
          stack: 'credits',
          emphasis: {
            focus: 'series'
          },
          data: suketuo || []
        },
        {
          name: '讲座学分',
          type: 'bar',
          stack: 'credits',
          emphasis: {
            focus: 'series'
          },
          data: lecture || []
        },
        {
          name: '志愿服务',
          type: 'bar',
          stack: 'credits',
          emphasis: {
            focus: 'series'
          },
          data: volunteer || []
        },
        {
          name: '总学分',
          type: 'line',
          emphasis: {
            focus: 'series'
          },
          data: total || []
        }
      ]
    };
  };

  // 活动参与分布图配置
  const getActivityDistributionOption = () => {
    return {
      title: {
        text: '活动参与分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: analysisData.activityParticipation.map(item => item.name)
      },
      series: [
        {
          name: '活动类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: analysisData.activityParticipation.map(item => ({
            name: item.name,
            value: item.value
          }))
        }
      ]
    };
  };

  // 学分分布图配置
  const getCreditDistributionOption = () => {
    const { suketuo, lecture, volunteer } = analysisData.creditDistribution;
    const total = suketuo + lecture + volunteer;
    
    return {
      title: {
        text: '学分构成分析',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: ['素拓学分', '讲座学分', '志愿服务']
      },
      series: [
        {
          name: '学分构成',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: suketuo, name: '素拓学分', percent: ((suketuo / total) * 100).toFixed(1) + '%' },
            { value: lecture, name: '讲座学分', percent: ((lecture / total) * 100).toFixed(1) + '%' },
            { value: volunteer, name: '志愿服务', percent: ((volunteer / total) * 100).toFixed(1) + '%' }
          ]
        }
      ]
    };
  };

  // 近期活动表格列配置
  const columns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '参与日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: '获得学分',
      dataIndex: 'credits',
      key: 'credits'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status'
    }
  ];

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  return (
    <div className="analysis-container">
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <Card>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Title level={4} style={{ margin: 0 }}>学情分析</Title>
            </Col>
            <Col span={16} style={{ textAlign: 'right' }}>
              <RangePicker 
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </Col>
          </Row>
        </Card>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts 
                option={getCreditTrendOption()} 
                style={{ height: 350 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts 
                option={getActivityDistributionOption()} 
                style={{ height: 350 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts 
                option={getCreditDistributionOption()} 
                style={{ height: 350 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="近期活动参与">
              <Table 
                columns={columns} 
                dataSource={analysisData.recentActivities} 
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Analysis; 