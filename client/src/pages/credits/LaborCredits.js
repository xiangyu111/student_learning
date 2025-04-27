import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Modal, Form, Input, DatePicker, 
  InputNumber, Upload, message, Tag, Typography, Row, Col
} from 'antd';
import Table from '../../components/layout/Table';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const LaborCredits = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [laborCredits, setLaborCredits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  useEffect(() => {
    fetchCredits();
  }, []);
  
  const fetchCredits = async () => {
    setLoading(true);
    try {
      console.log('开始获取劳动学分数据...');
      const response = await axios.get('http://localhost:5000/api/credits/labor');
      console.log('劳动学分数据接收成功:', response.data);
      setLaborCredits(response.data);
    } catch (error) {
      console.error('获取劳动学分记录失败:', error);
      message.error('获取劳动学分记录失败，将显示模拟数据');
      
      // 生成模拟数据
      const mockData = generateMockLaborCredits();
      console.log('使用模拟数据:', mockData);
      setLaborCredits(mockData);
    } finally {
      setLoading(false);
    }
  };
  
  // 生成模拟劳动学分数据
  const generateMockLaborCredits = () => {
    const statuses = ['待审核', '已通过', '已拒绝'];
    const activities = ['校园清洁', '社区服务', '学院助理', '图书馆志愿者', '校园绿化', '学生活动支持', '实验室维护', '教室整理'];
    const locations = ['主校区', '东校区', '西校区', '南校区', '北校区', '实验楼', '图书馆', '社区中心'];
    
    const records = [];
    for (let i = 0; i < 8; i++) {
      const requestedCredits = parseFloat((Math.random() * 2 + 0.5).toFixed(1));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const duration = Math.floor(Math.random() * 5) + 1;
      const activityName = activities[Math.floor(Math.random() * activities.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      records.push({
        id: 2000 + i,
        name: activityName,
        location: location,
        date: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)),
        duration: duration.toString(),
        description: `参加了${location}的${activityName}劳动活动，累计${duration}小时。`,
        requestedCredits: requestedCredits,
        approvedCredits: status === '已通过' ? parseFloat((requestedCredits * 0.9).toFixed(1)) : null,
        status: status,
        feedback: status === '已拒绝' ? '证明材料不足，请补充更多相关证明' : '',
        certificateUrl: `/uploads/certificates/mock-labor-${i+1}.pdf`
      });
    }
    
    return records;
  };
  
  const showAddModal = () => {
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };
  
  const handleModalCancel = () => {
    setModalVisible(false);
  };
  
  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
  };
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 创建表单数据对象，处理文件上传
      const formData = new FormData();
      
      // 添加文本字段
      formData.append('name', values.name);
      formData.append('location', values.location);
      formData.append('date', values.date.format('YYYY-MM-DD'));
      formData.append('duration', values.duration);
      formData.append('description', values.description);
      formData.append('requestedCredits', values.requestedCredits);
      
      // 添加文件
      if (fileList.length > 0) {
        formData.append('certificate', fileList[0].originFileObj);
      }
      
      // 发送请求
      await axios.post('http://localhost:5000/api/credits/labor/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      message.success('申请提交成功');
      setModalVisible(false);
      fetchCredits();
    } catch (error) {
      console.error('提交申请失败:', error);
      message.error('提交申请失败: ' + (error.response?.data?.message || '未知错误'));
    }
  };
  
  const columns = [
    {
      title: '劳动活动名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '活动地点',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
    },
    {
      title: '活动日期',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('YYYY-MM-DD')
    },
    {
      title: '劳动时长(小时)',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: '申请学分',
      dataIndex: 'requestedCredits',
      key: 'requestedCredits'
    },
    {
      title: '获得学分',
      dataIndex: 'approvedCredits',
      key: 'approvedCredits',
      render: (text) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        let color = 'default';
        if (text === '已通过') color = 'success';
        else if (text === '已拒绝') color = 'error';
        else if (text === '待审核') color = 'processing';
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              Modal.info({
                title: '劳动活动详情',
                width: 600,
                content: (
                  <div>
                    <p><strong>活动名称:</strong> {record.name}</p>
                    <p><strong>活动地点:</strong> {record.location}</p>
                    <p><strong>活动日期:</strong> {moment(record.date).format('YYYY-MM-DD')}</p>
                    <p><strong>劳动时长:</strong> {record.duration}小时</p>
                    <p><strong>活动描述:</strong> {record.description}</p>
                    <p><strong>申请学分:</strong> {record.requestedCredits}</p>
                    <p><strong>获得学分:</strong> {record.approvedCredits || '-'}</p>
                    <p><strong>状态:</strong> {record.status}</p>
                    {record.feedback && (
                      <p><strong>反馈:</strong> {record.feedback}</p>
                    )}
                    {record.certificateUrl && (
                      <p>
                        <strong>证明材料:</strong> 
                        <Button 
                          type="link" 
                          onClick={() => window.open(record.certificateUrl)}
                        >
                          查看证明
                        </Button>
                      </p>
                    )}
                  </div>
                ),
              });
            }}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];
  
  const renderCreditsHeader = () => (
    <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
      <Col span={12}>
        <Title level={4}>劳动学分</Title>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <Text>当前劳动学分: <Text strong style={{ fontSize: '16px', color: '#722ed1' }}>{currentUser?.laborCredits || 0}</Text></Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            申请学分
          </Button>
        </Space>
      </Col>
    </Row>
  );
  
  const renderApplicationModal = () => (
    <Modal
      title="申请劳动学分"
      open={modalVisible}
      onCancel={handleModalCancel}
      onOk={handleSubmit}
      okText="提交申请"
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="劳动活动名称"
          rules={[{ required: true, message: '请输入劳动活动名称' }]}
        >
          <Input placeholder="劳动活动名称" />
        </Form.Item>
        
        <Form.Item
          name="location"
          label="活动地点"
          rules={[{ required: true, message: '请输入活动地点' }]}
        >
          <Input placeholder="活动地点" />
        </Form.Item>
        
        <Form.Item
          name="date"
          label="活动日期"
          rules={[{ required: true, message: '请选择活动日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder="选择日期"
          />
        </Form.Item>
        
        <Form.Item
          name="duration"
          label="劳动时长(小时)"
          rules={[{ required: true, message: '请输入劳动时长' }]}
        >
          <InputNumber
            min={0.5}
            step={0.5}
            style={{ width: '100%' }}
            placeholder="劳动时长"
          />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="活动描述"
          rules={[{ required: true, message: '请输入活动描述' }]}
        >
          <TextArea rows={4} placeholder="简述劳动内容、个人职责等" />
        </Form.Item>
        
        <Form.Item
          name="requestedCredits"
          label="申请学分"
          rules={[{ required: true, message: '请输入申请学分' }]}
        >
          <InputNumber
            min={0.1}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="申请学分数"
          />
        </Form.Item>
        
        <Form.Item
          name="certificate"
          label="证明材料"
          rules={[{ required: true, message: '请上传证明材料' }]}
        >
          <Upload
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>上传证明材料</Button>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              支持PDF、JPG、PNG格式
            </Text>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
  
  return (
    <div className="labor-credits-container">
      {renderCreditsHeader()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={laborCredits}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {renderApplicationModal()}
    </div>
  );
};

export default LaborCredits; 