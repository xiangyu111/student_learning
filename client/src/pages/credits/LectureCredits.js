import React, { useState, useEffect } from 'react';
import {
  Card, Button, Space, Modal, Form, Input, DatePicker, 
  InputNumber, Upload, message, Tag, Typography, Row, Col, Select
} from 'antd';
import Table from '../../components/layout/Table';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const LectureCredits = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lectureCredits, setLectureCredits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  useEffect(() => {
    fetchCredits();
  }, []);
  
  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/lecture');
      setLectureCredits(response.data);
    } catch (error) {
      console.error('获取讲座学分记录失败:', error);
      message.error('获取讲座学分记录失败');
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
      formData.append('title', values.title);
      formData.append('speaker', values.speaker);
      formData.append('venue', values.venue);
      formData.append('date', values.date.format('YYYY-MM-DD HH:mm:ss'));
      formData.append('duration', values.duration);
      formData.append('description', values.description);
      formData.append('requestedCredits', values.requestedCredits);
      
      // 添加文件
      if (fileList.length > 0) {
        formData.append('certificate', fileList[0].originFileObj);
      }
      
      // 发送请求
      await axios.post('/api/credits/lecture/apply', formData, {
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
      title: '讲座名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '讲师',
      dataIndex: 'speaker',
      key: 'speaker'
    },
    {
      title: '地点',
      dataIndex: 'venue',
      key: 'venue',
      ellipsis: true
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text) => moment(text).format('YYYY-MM-DD')
    },
    {
      title: '时长(小时)',
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
                title: '讲座详情',
                width: 600,
                content: (
                  <div>
                    <p><strong>讲座名称:</strong> {record.title}</p>
                    <p><strong>讲师:</strong> {record.speaker}</p>
                    <p><strong>地点:</strong> {record.venue}</p>
                    <p><strong>日期:</strong> {moment(record.date).format('YYYY-MM-DD')}</p>
                    <p><strong>时长:</strong> {record.duration}小时</p>
                    <p><strong>描述:</strong> {record.description}</p>
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
        <Title level={4}>讲座学分</Title>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <Text>当前讲座学分: <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>{currentUser?.lectureCredits || 0}</Text></Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            申请学分
          </Button>
        </Space>
      </Col>
    </Row>
  );
  
  const renderApplicationModal = () => (
    <Modal
      title="申请讲座学分"
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
          name="title"
          label="讲座名称"
          rules={[{ required: true, message: '请输入讲座名称' }]}
        >
          <Input placeholder="讲座名称" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="speaker"
              label="讲师"
              rules={[{ required: true, message: '请输入讲师姓名' }]}
            >
              <Input placeholder="讲师姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="venue"
              label="地点"
              rules={[{ required: true, message: '请输入讲座地点' }]}
            >
              <Input placeholder="讲座地点" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date"
              label="日期"
              rules={[{ required: true, message: '请选择讲座日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                showTime
                format="YYYY-MM-DD HH:mm"
                placeholder="选择日期和时间"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="duration"
              label="时长(小时)"
              rules={[{ required: true, message: '请输入讲座时长' }]}
            >
              <InputNumber
                min={0.5}
                step={0.5}
                style={{ width: '100%' }}
                placeholder="讲座时长(小时)"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="description"
          label="讲座描述"
          rules={[{ required: true, message: '请输入讲座描述' }]}
        >
          <TextArea rows={4} placeholder="讲座内容简述" />
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
    <div className="lecture-credits-container">
      {renderCreditsHeader()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={lectureCredits}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {renderApplicationModal()}
    </div>
  );
};

export default LectureCredits; 