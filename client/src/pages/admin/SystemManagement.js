import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Statistic, Button, Table, Form, Input, 
  InputNumber, Switch, Select, message, Space, List, Tag, Descriptions } from 'antd';
import { 
  DashboardOutlined, SettingOutlined, FileTextOutlined, 
  CloudDownloadOutlined, ClearOutlined, ReloadOutlined,
  InfoCircleOutlined, UserOutlined, DatabaseOutlined
} from '@ant-design/icons';
import { 
  getSystemOverview, getSystemConfig, updateSystemConfig,
  getSystemLogs, backupSystem, clearSystemCache 
} from '../../services/systemApi';

const { TabPane } = Tabs;
const { Option } = Select;

const SystemManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSystemOverview();
    } else if (activeTab === 'config') {
      fetchSystemConfig();
    } else if (activeTab === 'logs') {
      fetchSystemLogs();
    }
  }, [activeTab]);
  
  const fetchSystemOverview = async () => {
    setLoading(true);
    try {
      const data = await getSystemOverview();
      setOverview(data);
    } catch (error) {
      message.error('获取系统概览失败');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSystemConfig = async () => {
    setLoading(true);
    try {
      const data = await getSystemConfig();
      setConfig(data);
      form.setFieldsValue(data);
    } catch (error) {
      message.error('获取系统配置失败');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSystemLogs = async () => {
    setLoading(true);
    try {
      const data = await getSystemLogs();
      setLogs(data);
    } catch (error) {
      message.error('获取系统日志失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateConfig = async (values) => {
    setLoading(true);
    try {
      await updateSystemConfig(values);
      message.success('系统配置已更新');
      fetchSystemConfig();
    } catch (error) {
      message.error('更新系统配置失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackupSystem = async () => {
    setLoading(true);
    try {
      const result = await backupSystem();
      message.success(`系统备份成功: ${result.backup.filename}`);
    } catch (error) {
      message.error('系统备份失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearCache = async () => {
    setLoading(true);
    try {
      await clearSystemCache();
      message.success('系统缓存已清理');
    } catch (error) {
      message.error('清理系统缓存失败');
    } finally {
      setLoading(false);
    }
  };
  
  const renderOverviewTab = () => {
    if (!overview) return <div>加载中...</div>;
    
    return (
      <div className="system-overview">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card>
              <Statistic 
                title="系统总用户数" 
                value={overview.userCount} 
                prefix={<UserOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="系统版本" 
                value={overview.version} 
                prefix={<InfoCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic 
                title="系统运行时间" 
                value={`${Math.floor(overview.uptime / 3600)}小时${Math.floor((overview.uptime % 3600) / 60)}分钟`} 
                prefix={<ReloadOutlined />} 
              />
            </Card>
          </Col>
        </Row>
        
        <Card title="用户统计" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {overview.userRoleStats.map(stat => (
              <Col span={8} key={stat.role}>
                <Statistic 
                  title={`${stat.role === 'student' ? '学生' : stat.role === 'teacher' ? '教师' : '管理员'}用户`} 
                  value={stat.count} 
                  suffix="人"
                />
              </Col>
            ))}
          </Row>
        </Card>
        
        <Card title="数据库信息" style={{ marginTop: 16 }}>
          <Descriptions bordered size="small">
            <Descriptions.Item label="数据库名称" span={3}>{overview.dbInfo.name}</Descriptions.Item>
            <Descriptions.Item label="主机地址" span={3}>{overview.dbInfo.host}:{overview.dbInfo.port}</Descriptions.Item>
            <Descriptions.Item label="数据库类型" span={3}>{overview.dbInfo.dialect}</Descriptions.Item>
            <Descriptions.Item label="连接状态" span={3}>
              <Tag color="green">{overview.dbInfo.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
        
        <Card title="最近注册用户" style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={overview.recentUsers}
            renderItem={user => (
              <List.Item>
                <List.Item.Meta
                  title={`${user.name} (${user.username})`}
                  description={
                    <>
                      <Tag color={user.role === 'admin' ? 'red' : user.role === 'teacher' ? 'blue' : 'green'}>
                        {user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : '学生'}
                      </Tag>
                      <span style={{ marginLeft: 8 }}>注册时间: {new Date(user.createdAt).toLocaleString()}</span>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
        
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Button 
              type="primary" 
              icon={<CloudDownloadOutlined />} 
              onClick={handleBackupSystem}
              loading={loading}
              block
            >
              备份系统
            </Button>
          </Col>
          <Col span={12}>
            <Button 
              danger 
              icon={<ClearOutlined />} 
              onClick={handleClearCache}
              loading={loading}
              block
            >
              清理缓存
            </Button>
          </Col>
        </Row>
      </div>
    );
  };
  
  const renderConfigTab = () => {
    if (!config) return <div>加载中...</div>;
    
    return (
      <div className="system-config">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateConfig}
          initialValues={config}
        >
          <Card title="基本设置">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="appName"
                  label="系统名称"
                  rules={[{ required: true, message: '请输入系统名称' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="systemEmail"
                  label="系统邮箱"
                  rules={[{ required: true, message: '请输入系统邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <Card title="功能设置" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="userRegistration"
                  label="允许用户注册"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="emailNotification"
                  label="邮件通知"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maintenanceMode"
                  label="维护模式"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <Card title="文件上传设置" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="maxUploadSize"
                  label="最大上传大小 (MB)"
                  rules={[{ required: true, message: '请输入最大上传大小' }]}
                >
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="allowedFileTypes"
                  label="允许的文件类型"
                  rules={[{ required: true, message: '请选择允许的文件类型' }]}
                >
                  <Select mode="multiple" placeholder="选择文件类型">
                    <Option value="jpg">JPG</Option>
                    <Option value="jpeg">JPEG</Option>
                    <Option value="png">PNG</Option>
                    <Option value="pdf">PDF</Option>
                    <Option value="doc">DOC</Option>
                    <Option value="docx">DOCX</Option>
                    <Option value="xls">XLS</Option>
                    <Option value="xlsx">XLSX</Option>
                    <Option value="ppt">PPT</Option>
                    <Option value="pptx">PPTX</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <Card title="学分设置" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['creditsSettings', 'suketuoMax']}
                  label="素拓学分上限"
                  rules={[{ required: true, message: '请输入素拓学分上限' }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['creditsSettings', 'lectureMax']}
                  label="讲座学分上限"
                  rules={[{ required: true, message: '请输入讲座学分上限' }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['creditsSettings', 'laborMax']}
                  label="劳动学分上限"
                  rules={[{ required: true, message: '请输入劳动学分上限' }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存配置
            </Button>
          </div>
        </Form>
      </div>
    );
  };
  
  const renderLogsTab = () => {
    if (!logs.length) return <div>暂无日志数据</div>;
    
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 60
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: type => (
          <Tag color={type === 'info' ? 'blue' : type === 'warning' ? 'orange' : 'red'}>
            {type}
          </Tag>
        )
      },
      {
        title: '消息',
        dataIndex: 'message',
        key: 'message'
      },
      {
        title: '时间',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 180,
        render: time => new Date(time).toLocaleString()
      }
    ];
    
    return (
      <div className="system-logs">
        <Card title="系统日志">
          <Space style={{ marginBottom: 16 }}>
            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">全部日志</Option>
              <Option value="info">信息</Option>
              <Option value="warning">警告</Option>
              <Option value="error">错误</Option>
            </Select>
            <Button type="primary" onClick={fetchSystemLogs}>刷新</Button>
          </Space>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    );
  };
  
  return (
    <div className="system-management">
      <h2>系统管理</h2>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
      >
        <TabPane 
          tab={<span><DashboardOutlined />系统概览</span>} 
          key="overview"
        >
          {renderOverviewTab()}
        </TabPane>
        <TabPane 
          tab={<span><SettingOutlined />系统配置</span>} 
          key="config"
        >
          {renderConfigTab()}
        </TabPane>
        <TabPane 
          tab={<span><FileTextOutlined />系统日志</span>} 
          key="logs"
        >
          {renderLogsTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SystemManagement; 