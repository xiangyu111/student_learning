import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { login, error, setError, loading } = useAuth();
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      await login(values.username, values.password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        style={{ 
          width: 400, 
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>课外学情记录分析系统</Title>
          <Text type="secondary">请登录您的账号</Text>
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
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large" 
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
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>没有账号？</Divider>
        
        <Row justify="center" gutter={16}>
          <Col>
            <Link to="/register">
              <Button type="link">注册新账号</Button>
            </Link>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Login; 