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
const { RangePicker } = DatePicker;

const VolunteerCredits = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [volunteerCredits, setVolunteerCredits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  useEffect(() => {
    fetchCredits();
  }, []);
  
  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/volunteer');
      setVolunteerCredits(response.data);
    } catch (error) {
      console.error('获取志愿服务记录失败:', error);
      message.error('获取志愿服务记录失败');
    } finally {
      setLoading(false);
    }
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
      formData.append('organization', values.organization);
      formData.append('startDate', values.dateRange[0].format('YYYY-MM-DD'));
      formData.append('endDate', values.dateRange[1].format('YYYY-MM-DD'));
      formData.append('hours', values.hours);
      formData.append('description', values.description);
      formData.append('requestedCredits', values.requestedCredits);
      
      // 添加文件
      if (fileList.length > 0) {
        formData.append('certificate', fileList[0].originFileObj);
      }
      
      // 发送请求
      await axios.post('/api/credits/volunteer/apply', formData, {
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
      title: '志愿服务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '组织机构',
      dataIndex: 'organization',
      key: 'organization',
      ellipsis: true
    },
    {
      title: '服务时间',
      key: 'date',
      render: (_, record) => `${moment(record.startDate).format('YYYY-MM-DD')} 至 ${moment(record.endDate).format('YYYY-MM-DD')}`
    },
    {
      title: '服务时长(小时)',
      dataIndex: 'hours',
      key: 'hours'
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
                title: '志愿服务详情',
                width: 600,
                content: (
                  <div>
                    <p><strong>服务名称:</strong> {record.name}</p>
                    <p><strong>组织机构:</strong> {record.organization}</p>
                    <p><strong>服务时间:</strong> {moment(record.startDate).format('YYYY-MM-DD')} 至 {moment(record.endDate).format('YYYY-MM-DD')}</p>
                    <p><strong>服务时长:</strong> {record.hours}小时</p>
                    <p><strong>服务描述:</strong> {record.description}</p>
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
        <Title level={4}>志愿服务学分</Title>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <Text>当前志愿服务学分: <Text strong style={{ fontSize: '16px', color: '#722ed1' }}>{currentUser?.volunteerCredits || 0}</Text></Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            申请学分
          </Button>
        </Space>
      </Col>
    </Row>
  );
  
  const renderApplicationModal = () => (
    <Modal
      title="申请志愿服务学分"
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
          label="志愿服务名称"
          rules={[{ required: true, message: '请输入志愿服务名称' }]}
        >
          <Input placeholder="志愿服务名称" />
        </Form.Item>
        
        <Form.Item
          name="organization"
          label="组织机构"
          rules={[{ required: true, message: '请输入组织机构' }]}
        >
          <Input placeholder="组织机构名称" />
        </Form.Item>
        
        <Form.Item
          name="dateRange"
          label="服务时间"
          rules={[{ required: true, message: '请选择服务时间' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
          />
        </Form.Item>
        
        <Form.Item
          name="hours"
          label="服务时长(小时)"
          rules={[{ required: true, message: '请输入服务时长' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="服务时长(小时)"
          />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="服务描述"
          rules={[{ required: true, message: '请输入服务描述' }]}
        >
          <TextArea rows={4} placeholder="服务内容简述" />
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
    <div className="volunteer-credits-container">
      {renderCreditsHeader()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={volunteerCredits}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {renderApplicationModal()}
    </div>
  );
};

export default VolunteerCredits; 