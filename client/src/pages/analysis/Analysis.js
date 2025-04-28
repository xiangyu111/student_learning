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
    creditTrend: {
      months: [],
      suketuo: [],
      lecture: [],
      labor: [],
      total: []
    },
    activityParticipation: [],
    creditDistribution: {
      suketuo: 0,
      lecture: 0,
      labor: 0
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
      // 确保日期是有效的
      const start = dateRange[0] || moment().subtract(6, 'months');
      const end = dateRange[1] || moment();
      
      // 使用随机时间戳确保每次请求都是唯一的
      const timestamp = new Date().getTime();
      
      const response = await axios.get('/api/analysis', {
        params: {
          startDate: start.format('YYYY-MM-DD'),
          endDate: end.format('YYYY-MM-DD'),
          _t: timestamp // 添加时间戳防止缓存
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': '',
          'If-Modified-Since': '0'
        }
      });
      
      if (response.data) {
        console.log('获取到学情分析数据:', response.data);
        
        // 确保数据中只包含素拓、讲座和劳动
        const sanitizedData = {
          ...response.data,
          activityParticipation: response.data.activityParticipation.filter(item => 
            item.name === '素拓活动' || item.name === '讲座' || item.name === '劳动'
          )
        };
        
        setAnalysisData(sanitizedData);
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      message.error('获取分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 学分趋势图配置
  const getCreditTrendOption = () => {
    const { months, suketuo, lecture, labor, total } = analysisData.creditTrend;
    
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
        data: ['素拓学分', '讲座学分', '劳动学分', '总学分'],
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
          name: '劳动学分',
          type: 'bar',
          stack: 'credits',
          emphasis: {
            focus: 'series'
          },
          data: labor || []
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
    // 确保只显示素拓活动、讲座和劳动
    const filteredData = analysisData.activityParticipation.filter(item => 
      item.name === '素拓活动' || item.name === '讲座' || item.name === '劳动'
    );
    
    // 定义颜色映射，保持一致的颜色显示
    const colorMap = {
      '素拓活动': '#5470c6',
      '讲座': '#91cc75',
      '劳动': '#fac858'
    };
    
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
        data: filteredData.map(item => item.name)
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
          data: filteredData.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colorMap[item.name]
            }
          }))
        }
      ]
    };
  };

  // 学分分布图配置
  const getCreditDistributionOption = () => {
    const { suketuo, lecture, labor } = analysisData.creditDistribution;
    const total = suketuo + lecture + labor;
    
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
        data: ['素拓学分', '讲座学分', '劳动学分']
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
            { value: suketuo, name: '素拓学分', percent: total > 0 ? ((suketuo / total) * 100).toFixed(1) + '%' : '0%' },
            { value: lecture, name: '讲座学分', percent: total > 0 ? ((lecture / total) * 100).toFixed(1) + '%' : '0%' },
            { value: labor, name: '劳动学分', percent: total > 0 ? ((labor / total) * 100).toFixed(1) + '%' : '0%' }
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