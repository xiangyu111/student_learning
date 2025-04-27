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

const SuketuoCredits = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suketuoCredits, setSuketuoCredits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/credits/suketuo');
      setSuketuoCredits(response.data);
    } catch (error) {
      console.error('获取素拓学分记录失败:', error);
      message.error('获取素拓学分记录失败');
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
      const formData = new FormData();
      
      // 添加所有表单字段到formData
      formData.append('name', values.name);
      formData.append('type', values.type);
      formData.append('level', values.level);
      formData.append('date', values.date.format('YYYY-MM-DD'));
      formData.append('description', values.description || '');
      formData.append('requestedCredits', values.requestedCredits);
      
      // 添加文件
      if (fileList.length > 0) {
        formData.append('certificate', fileList[0].originFileObj);
      }
      
      // 发送请求到正确的端点
      await axios.post('/api/credits/suketuo/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      message.success('申请提交成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('提交申请失败:', error);
      message.error('提交申请失败: ' + (error.response?.data?.message || '未知错误'));
    }
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      ellipsis: true
    },
    {
      title: '活动级别',
      dataIndex: 'level',
      key: 'level'
    },
    {
      title: '活动日期',
      dataIndex: 'date',
      key: 'date',
      render: (text) => moment(text).format('YYYY-MM-DD')
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
                title: '素拓活动详情',
                width: 600,
                content: (
                  <div>
                    <p><strong>活动名称:</strong> {record.name}</p>
                    <p><strong>活动类型:</strong> {record.type}</p>
                    <p><strong>活动级别:</strong> {record.level}</p>
                    <p><strong>活动日期:</strong> {moment(record.date).format('YYYY-MM-DD')}</p>
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
        <Title level={4}>素拓学分</Title>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <Text>当前素拓学分: <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>{currentUser?.suketuoCredits || 0}</Text></Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            申请学分
          </Button>
        </Space>
      </Col>
    </Row>
  );

  const renderApplicationModal = () => (
    <Modal
      title="申请素拓学分"
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
          label="活动名称"
          rules={[{ required: true, message: '请输入活动名称' }]}
        >
          <Input placeholder="活动名称" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="活动类型"
              rules={[{ required: true, message: '请选择活动类型' }]}
            >
              <Select placeholder="选择活动类型">
                <Option value="学科竞赛">学科竞赛</Option>
                <Option value="创新创业">创新创业</Option>
                <Option value="文体活动">文体活动</Option>
                <Option value="社会实践">社会实践</Option>
                <Option value="学生工作">学生工作</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="level"
              label="活动级别"
              rules={[{ required: true, message: '请选择活动级别' }]}
            >
              <Select placeholder="选择活动级别">
                <Option value="国家级">国家级</Option>
                <Option value="省级">省级</Option>
                <Option value="市级">市级</Option>
                <Option value="校级">校级</Option>
                <Option value="院级">院级</Option>
                <Option value="班级">班级</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
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
          name="description"
          label="活动描述"
          rules={[{ required: true, message: '请输入活动描述' }]}
        >
          <TextArea rows={4} placeholder="简述活动内容、个人角色和贡献等" />
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
    <div className="suketuo-credits-container">
      {renderCreditsHeader()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={suketuoCredits}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {renderApplicationModal()}
    </div>
  );
};

export default SuketuoCredits; 