import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Select, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [form] = Form.useForm();
  const { register, error, setError, loading } = useAuth();
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const [role, setRole] = useState('student');

  const onFinish = async (values) => {
    try {
      await register(values);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.message || '注册失败，请稍后再试');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '20px 0'
    }}>
      <Card 
        style={{ 
          width: 600, 
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>注册新账号</Title>
          <Text type="secondary">加入课外学情记录分析系统</Text>
        </div>

        {(error || localError) && (
          <Alert
            message={error || localError}
            type="error"
            showIcon
            closable
            onClose={() => {
              setError(null);
              setLocalError('');
            }}
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 4, message: '用户名至少4个字符' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请确认密码" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input 
                  placeholder="请输入姓名" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="用户角色"
                initialValue="student"
                rules={[{ required: true, message: '请选择用户角色' }]}
              >
                <Select onChange={(value) => setRole(value)}>
                  <Option value="student">学生</Option>
                  <Option value="teacher">教师</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {role === 'student' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="studentId"
                    label="学号"
                    rules={[{ required: true, message: '请输入学号' }]}
                  >
                    <Input 
                      prefix={<IdcardOutlined />} 
                      placeholder="请输入学号" 
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="department"
                    label="学院"
                    rules={[{ required: true, message: '请输入学院' }]}
                  >
                    <Input placeholder="请输入学院" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="major"
                    label="专业"
                    rules={[{ required: true, message: '请输入专业' }]}
                  >
                    <Input placeholder="请输入专业" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="class"
                    label="班级"
                    rules={[{ required: true, message: '请输入班级' }]}
                  >
                    <Input placeholder="请输入班级" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="grade"
                    label="年级"
                    rules={[{ required: true, message: '请输入年级' }]}
                  >
                    <Input placeholder="例如：2020级" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {role === 'teacher' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="teacherId"
                  label="工号"
                  rules={[{ required: true, message: '请输入工号' }]}
                >
                  <Input 
                    prefix={<IdcardOutlined />} 
                    placeholder="请输入工号" 
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="department"
                  label="所属院系"
                  rules={[{ required: true, message: '请输入所属院系' }]}
                >
                  <Input placeholder="请输入所属院系" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item
            name="phoneNumber"
            label="联系电话"
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="请输入联系电话（选填）" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>已有账号？</Divider>
        
        <Row justify="center">
          <Col>
            <Link to="/login">
              <Button type="link">返回登录</Button>
            </Link>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Register; 