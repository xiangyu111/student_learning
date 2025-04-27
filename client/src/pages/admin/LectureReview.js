import React, { useState, useEffect } from 'react';
import {
  Card, Button, Space, Modal, Form, Input, 
  message, Tag, Typography, Row, Col, InputNumber
} from 'antd';
import Table from '../../components/layout/Table';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title } = Typography;
const { TextArea } = Input;

const LectureReview = () => {
  const [loading, setLoading] = useState(false);
  const [lectureApplications, setLectureApplications] = useState([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [form] = Form.useForm();
  
  useEffect(() => {
    fetchApplications();
  }, []);
  
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/credits/admin/lecture');
      setLectureApplications(response.data);
    } catch (error) {
      console.error('获取讲座学分申请失败:', error);
      message.error('获取讲座学分申请失败');
    } finally {
      setLoading(false);
    }
  };
  
  const showReviewModal = (record) => {
    setCurrentApplication(record);
    form.setFieldsValue({
      approvedCredits: record.requestedCredits,
      feedback: ''
    });
    setReviewModalVisible(true);
  };
  
  const handleReviewCancel = () => {
    setReviewModalVisible(false);
  };
  
  const handleApprove = async () => {
    try {
      const values = await form.validateFields();
      await axios.post(`http://localhost:5000/api/credits/admin/lecture/${currentApplication.id}/approve`, {
        approvedCredits: values.approvedCredits,
        feedback: values.feedback
      });
      
      message.success('申请已通过');
      setReviewModalVisible(false);
      fetchApplications();
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败: ' + (error.response?.data?.message || '未知错误'));
    }
  };
  
  const handleReject = async () => {
    try {
      const values = await form.validateFields(['feedback']);
      if (!values.feedback) {
        message.warning('拒绝申请时必须提供反馈意见');
        return;
      }
      
      await axios.post(`http://localhost:5000/api/credits/admin/lecture/${currentApplication.id}/reject`, {
        feedback: values.feedback
      });
      
      message.success('申请已拒绝');
      setReviewModalVisible(false);
      fetchApplications();
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败: ' + (error.response?.data?.message || '未知错误'));
    }
  };
  
  const columns = [
    {
      title: '学生姓名',
      dataIndex: ['student', 'name'],
      key: 'studentName',
    },
    {
      title: '学号',
      dataIndex: ['student', 'studentId'],
      key: 'studentId',
    },
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
                title: '申请详情',
                width: 600,
                content: (
                  <div>
                    <p><strong>学生姓名:</strong> {record.student.name}</p>
                    <p><strong>学号:</strong> {record.student.studentId}</p>
                    <p><strong>讲座名称:</strong> {record.title}</p>
                    <p><strong>讲师:</strong> {record.speaker}</p>
                    <p><strong>地点:</strong> {record.venue}</p>
                    <p><strong>日期:</strong> {moment(record.date).format('YYYY-MM-DD HH:mm')}</p>
                    <p><strong>时长:</strong> {record.duration}小时</p>
                    <p><strong>讲座描述:</strong> {record.description}</p>
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
          {record.status === '待审核' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => showReviewModal(record)}
            >
              审核
            </Button>
          )}
        </Space>
      )
    }
  ];
  
  const renderReviewHeader = () => (
    <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
      <Col span={12}>
        <Title level={4}>讲座学分审核</Title>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={fetchApplications}>刷新</Button>
        </Space>
      </Col>
    </Row>
  );
  
  const renderReviewModal = () => (
    <Modal
      title="审核讲座学分申请"
      open={reviewModalVisible}
      onCancel={handleReviewCancel}
      footer={[
        <Button key="cancel" onClick={handleReviewCancel}>
          取消
        </Button>,
        <Button key="reject" danger icon={<CloseOutlined />} onClick={handleReject}>
          拒绝
        </Button>,
        <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
          通过
        </Button>
      ]}
      width={600}
    >
      {currentApplication && (
        <>
          <div style={{ marginBottom: 24 }}>
            <p><strong>学生:</strong> {currentApplication.student.name} ({currentApplication.student.studentId})</p>
            <p><strong>讲座名称:</strong> {currentApplication.title}</p>
            <p><strong>讲师:</strong> {currentApplication.speaker}</p>
            <p><strong>时长:</strong> {currentApplication.duration}小时</p>
            <p><strong>申请学分:</strong> {currentApplication.requestedCredits}</p>
            <p>
              <strong>证明材料:</strong> 
              <Button 
                type="link" 
                onClick={() => window.open(currentApplication.certificateUrl)}
              >
                查看证明
              </Button>
            </p>
          </div>
          
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="approvedCredits"
              label="批准学分"
              rules={[{ required: true, message: '请输入批准学分' }]}
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: '100%' }}
                placeholder="批准学分数"
              />
            </Form.Item>
            
            <Form.Item
              name="feedback"
              label="审核意见"
            >
              <TextArea rows={4} placeholder="审核意见或反馈" />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
  
  return (
    <div className="lecture-review-container">
      {renderReviewHeader()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={lectureApplications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      {renderReviewModal()}
    </div>
  );
};

export default LectureReview; 