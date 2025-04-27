import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Switch, Select, Divider, Upload } from 'antd';
import { UploadOutlined, LockOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

const Settings = () => {
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    activityReminders: true,
    creditUpdates: true,
    systemAnnouncements: true
  });

  // 初始化个人资料表单
  React.useEffect(() => {
    if (currentUser) {
      profileForm.setFieldsValue({
        username: currentUser.username,
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
        department: currentUser.department,
        major: currentUser.major,
        class: currentUser.class,
        grade: currentUser.grade
      });
    }
  }, [currentUser, profileForm]);

  // 更新个人资料
  const handleProfileUpdate = (values) => {
    setLoading(true);
    axios.put('/api/users/profile', values)
      .then(response => {
        message.success('个人资料更新成功');
        if (updateUser) {
          updateUser(response.data);
        }
      })
      .catch(error => {
        console.error('更新个人资料失败:', error);
        message.error('更新个人资料失败');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 更新密码
  const handlePasswordUpdate = (values) => {
    setLoading(true);
    axios.put('/api/users/password', values)
      .then(() => {
        message.success('密码更新成功');
        passwordForm.resetFields();
      })
      .catch(error => {
        console.error('更新密码失败:', error);
        message.error('更新密码失败');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 更新通知设置
  const handleNotificationChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // 在实际应用中，这里应该调用API保存设置
    axios.put('/api/users/notifications', {
      ...notificationSettings,
      [key]: value
    })
      .then(() => {
        message.success('通知设置已更新');
      })
      .catch(error => {
        console.error('更新通知设置失败:', error);
        message.error('更新通知设置失败');
      });
  };

  // 渲染个人资料表单
  const renderProfileForm = () => (
    <Card title="个人资料">
      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleProfileUpdate}
        initialValues={{
          username: currentUser?.username || '',
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          phoneNumber: currentUser?.phoneNumber || '',
          department: currentUser?.department || '',
          major: currentUser?.major || '',
          class: currentUser?.class || '',
          grade: currentUser?.grade || ''
        }}
      >
        <Form.Item
          name="avatar"
          label="头像"
        >
          <Upload
            name="avatar"
            listType="picture-card"
            showUploadList={false}
            action="/api/users/avatar"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>上传头像</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="用户名" />
        </Form.Item>

        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="姓名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="邮箱" />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="联系电话"
          rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="联系电话" />
        </Form.Item>

        {currentUser?.role === 'student' && (
          <>
            <Form.Item name="department" label="院系">
              <Input placeholder="院系" />
            </Form.Item>

            <Form.Item name="major" label="专业">
              <Input placeholder="专业" />
            </Form.Item>

            <Form.Item name="class" label="班级">
              <Input placeholder="班级" />
            </Form.Item>

            <Form.Item name="grade" label="年级">
              <Select placeholder="请选择年级">
                <Option value="大一">大一</Option>
                <Option value="大二">大二</Option>
                <Option value="大三">大三</Option>
                <Option value="大四">大四</Option>
                <Option value="研一">研一</Option>
                <Option value="研二">研二</Option>
                <Option value="研三">研三</Option>
                <Option value="博一">博一</Option>
                <Option value="博二">博二</Option>
                <Option value="博三">博三</Option>
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存更改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // 渲染密码修改表单
  const renderPasswordForm = () => (
    <Card title="修改密码">
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handlePasswordUpdate}
      >
        <Form.Item
          name="currentPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少为6位' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不匹配'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            更新密码
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // 渲染通知设置
  const renderNotificationSettings = () => (
    <Card title="通知设置">
      <div className="notification-setting">
        <div className="setting-item">
          <div className="setting-label">邮件通知</div>
          <div className="setting-description">接收系统邮件通知</div>
          <Switch 
            checked={notificationSettings.emailNotifications} 
            onChange={(checked) => handleNotificationChange('emailNotifications', checked)} 
          />
        </div>
        <Divider />

        <div className="setting-item">
          <div className="setting-label">活动提醒</div>
          <div className="setting-description">接收即将到来的活动提醒</div>
          <Switch 
            checked={notificationSettings.activityReminders} 
            onChange={(checked) => handleNotificationChange('activityReminders', checked)} 
          />
        </div>
        <Divider />

        <div className="setting-item">
          <div className="setting-label">学分更新</div>
          <div className="setting-description">接收学分变动通知</div>
          <Switch 
            checked={notificationSettings.creditUpdates} 
            onChange={(checked) => handleNotificationChange('creditUpdates', checked)} 
          />
        </div>
        <Divider />

        <div className="setting-item">
          <div className="setting-label">系统公告</div>
          <div className="setting-description">接收系统公告和更新信息</div>
          <Switch 
            checked={notificationSettings.systemAnnouncements} 
            onChange={(checked) => handleNotificationChange('systemAnnouncements', checked)} 
          />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="settings-container">
      <Tabs defaultActiveKey="1">
        <TabPane tab="个人资料" key="1">
          {renderProfileForm()}
        </TabPane>
        <TabPane tab="安全设置" key="2">
          {renderPasswordForm()}
        </TabPane>
        <TabPane tab="通知设置" key="3">
          {renderNotificationSettings()}
        </TabPane>
      </Tabs>

      <style jsx="true">{`
        .settings-container {
          padding: 20px;
        }
        .notification-setting {
          padding: 0 20px;
        }
        .setting-item {
          display: flex;
          align-items: center;
          padding: 15px 0;
        }
        .setting-label {
          font-weight: bold;
          margin-right: 10px;
          flex-basis: 100px;
        }
        .setting-description {
          flex: 1;
          color: rgba(0,0,0,0.45);
        }
      `}</style>
    </div>
  );
};

export default Settings; 