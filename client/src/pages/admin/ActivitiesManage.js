import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Input, Select, DatePicker, Form,
  Space, Modal, message, Tag, Row, Col, Typography, InputNumber, Popconfirm, Divider
} from 'antd';
import Table from '../../components/layout/Table';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileExcelOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title } = Typography;

const ActivitiesManage = () => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [form] = Form.useForm();

  // 获取活动列表
  useEffect(() => {
    fetchActivities();
  }, []);

  const filterActivities = useCallback(() => {
    // 确保activities是数组
    if (!Array.isArray(activities)) {
      console.error('活动数据不是数组:', activities);
      setFilteredActivities([]);
      return;
    }
    
    let results = [...activities];
    
    // 按标题或描述搜索
    if (searchText) {
      results = results.filter(activity => 
        activity.title.toLowerCase().includes(searchText.toLowerCase()) || 
        activity.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      results = results.filter(activity => {
        const activityDate = moment(activity.startDate);
        return activityDate.isSameOrAfter(dateRange[0], 'day') && 
               activityDate.isSameOrBefore(dateRange[1], 'day');
      });
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      results = results.filter(activity => activity.status === statusFilter);
    }
    
    // 按类型筛选
    if (typeFilter !== 'all') {
      results = results.filter(activity => activity.type === typeFilter);
    }
    
    setFilteredActivities(results);
  }, [activities, searchText, dateRange, statusFilter, typeFilter]);

  // 监听筛选条件变化
  useEffect(() => {
    filterActivities();
  }, [searchText, dateRange, statusFilter, typeFilter, activities, filterActivities]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/activities');
      console.log('获取到的活动数据:', response.data);
      const activitiesData = response.data.activities || [];
      // 确保设置的是数组
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setFilteredActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (error) {
      console.error('获取活动列表失败:', error);
      message.error('获取活动列表失败');
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
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
    setTypeFilter(value);
  };

  const showAddModal = () => {
    form.resetFields();
    form.setFieldsValue({
      status: '未开始',
      startDate: moment(),
      endDate: moment().add(2, 'hours'),
      capacity: 30,
      credits: 1
    });
    setIsEditing(false);
    setModalVisible(true);
  };

  const showEditModal = (activity) => {
    setCurrentActivity(activity);
    form.setFieldsValue({
      title: activity.title,
      description: activity.description,
      type: activity.type || 'other',
      status: activity.status,
      startDate: moment(activity.startDate),
      endDate: moment(activity.endDate),
      location: activity.location,
      capacity: activity.capacity,
      credits: activity.credits
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/activities/${id}`);
      message.success('删除成功');
      fetchActivities();
    } catch (error) {
      console.error('删除活动失败:', error);
      message.error('删除活动失败');
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredActivities.map(activity => ({
      '活动标题': activity.title,
      '活动类型': activity.type || '其他',
      '活动状态': activity.status,
      '开始时间': moment(activity.startDate).format('YYYY-MM-DD HH:mm'),
      '结束时间': moment(activity.endDate).format('YYYY-MM-DD HH:mm'),
      '活动地点': activity.location,
      '参与人数': `${activity.currentParticipants || 0}/${activity.capacity}`,
      '活动学分': activity.credits
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '活动信息');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, '活动信息.xlsx');
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 转换日期格式，使用ISO格式确保时区正确
      const formattedValues = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined
      };
      
      console.log('表单数据:', formattedValues);
      
      let response;
      try {
        if (isEditing && currentActivity) {
          response = await axios.put(`/api/activities/${currentActivity.id}`, formattedValues);
          message.success('更新成功');
        } else {
          response = await axios.post('/api/activities', formattedValues);
          message.success('添加成功');
        }
        
        setModalVisible(false);
        fetchActivities();
      } catch (apiError) {
        console.error('API调用失败:', apiError);
        const errorMsg = apiError.response?.data?.message || apiError.message || '操作失败';
        message.error(`操作失败: ${errorMsg}`);
      }
    } catch (validationError) {
      console.error('表单验证失败:', validationError);
      // 表单验证错误已由antd处理，不需额外处理
    }
  };

  const columns = [
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title)
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => {
        const typeMap = {
          'suketuo': '素拓活动',
          'lecture': '讲座',
          'volunteer': '志愿服务',
          'competition': '竞赛',
          'other': '其他'
        };
        return typeMap[text] || '其他';
      }
    },
    {
      title: '活动状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        const colorMap = {
          '未开始': 'blue',
          '进行中': 'green',
          '已结束': 'gray',
          '已取消': 'red'
        };
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '开始时间',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => moment(a.startDate).valueOf() - moment(b.startDate).valueOf()
    },
    {
      title: '结束时间',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '活动地点',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
    },
    {
      title: '参与人数',
      key: 'participants',
      render: (_, record) => `${record.currentParticipants || 0}/${record.capacity}`,
      sorter: (a, b) => (a.currentParticipants || 0) - (b.currentParticipants || 0)
    },
    {
      title: '活动学分',
      dataIndex: 'credits',
      key: 'credits',
      sorter: (a, b) => a.credits - b.credits
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="确定要删除此活动吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 筛选工具栏
  const renderFilterBar = () => (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Input 
            placeholder="搜索活动标题或描述" 
            prefix={<SearchOutlined />} 
            onChange={e => handleSearch(e.target.value)}
            value={searchText}
            allowClear
          />
        </Col>
        <Col xs={24} md={8}>
          <RangePicker 
            style={{ width: '100%' }} 
            onChange={handleDateRangeChange}
            placeholder={['开始日期', '结束日期']}
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
            value={typeFilter}
          >
            <Option value="all">全部类型</Option>
            <Option value="suketuo">素拓活动</Option>
            <Option value="lecture">讲座</Option>
            <Option value="volunteer">志愿服务</Option>
            <Option value="competition">竞赛</Option>
            <Option value="other">其他</Option>
          </Select>
        </Col>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              添加活动
            </Button>
            <Button 
              icon={<FileExcelOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  // 添加/编辑活动模态框
  const renderActivityModal = () => (
    <Modal
      title={isEditing ? '编辑活动' : '添加活动'}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      onOk={handleModalSubmit}
      okText={isEditing ? '保存' : '添加'}
      cancelText="取消"
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="title"
              label="活动标题"
              rules={[{ required: true, message: '请输入活动标题' }]}
            >
              <Input placeholder="活动标题" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="type"
              label="活动类型"
              rules={[{ required: true, message: '请选择活动类型' }]}
            >
              <Select placeholder="选择活动类型">
                <Option value="suketuo">素拓活动</Option>
                <Option value="lecture">讲座</Option>
                <Option value="volunteer">志愿服务</Option>
                <Option value="competition">竞赛</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="活动描述"
          rules={[{ required: true, message: '请输入活动描述' }]}
        >
          <TextArea rows={4} placeholder="活动描述" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="开始时间"
              rules={[{ required: true, message: '请选择开始时间' }]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                style={{ width: '100%' }}
                placeholder="开始时间"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endDate"
              label="结束时间"
              rules={[
                { required: true, message: '请选择结束时间' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || !getFieldValue('startDate')) {
                      return Promise.resolve();
                    }
                    
                    const startDate = getFieldValue('startDate');
                    const endDate = value;
                    
                    // 获取时间戳进行比较，确保结束时间不早于开始时间
                    const startTimestamp = startDate.valueOf();
                    const endTimestamp = endDate.valueOf();
                    
                    if (endTimestamp >= startTimestamp) {
                      return Promise.resolve();
                    }
                    
                    return Promise.reject(new Error('结束时间必须晚于或等于开始时间'));
                  },
                })
              ]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm" 
                style={{ width: '100%' }}
                placeholder="结束时间"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="location"
              label="活动地点"
              rules={[{ required: true, message: '请输入活动地点' }]}
            >
              <Input placeholder="活动地点" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="capacity"
              label="活动容量"
              rules={[{ required: true, message: '请输入活动容量' }]}
            >
              <InputNumber 
                min={1} 
                style={{ width: '100%' }}
                placeholder="活动容量"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="credits"
              label="活动学分"
              rules={[{ required: true, message: '请输入活动学分' }]}
            >
              <InputNumber 
                min={0} 
                step={0.1} 
                style={{ width: '100%' }}
                placeholder="活动学分"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="status"
          label="活动状态"
          rules={[{ required: true, message: '请选择活动状态' }]}
        >
          <Select placeholder="选择活动状态">
            <Option value="未开始">未开始</Option>
            <Option value="进行中">进行中</Option>
            <Option value="已结束">已结束</Option>
            <Option value="已取消">已取消</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div className="activities-manage-container">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <Title level={4}>活动管理</Title>
        <Divider />
      </div>

      {renderFilterBar()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={filteredActivities}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </Card>
      
      {renderActivityModal()}
    </div>
  );
};

export default ActivitiesManage; 