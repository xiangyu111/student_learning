import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Table, Tag, Progress, Modal, Form, 
  Input, DatePicker, Select, Typography, Tabs, List, Tooltip, Empty,
  Divider, message, Spin, Statistic
} from 'antd';
import { 
  PlusOutlined, CheckOutlined, CloseOutlined, EditOutlined, 
  DeleteOutlined, CalendarOutlined, InfoCircleOutlined,
  FileAddOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ProgressTracking = () => {
  // 状态定义
  const [loading, setLoading] = useState(false);
  const [progressList, setProgressList] = useState([]);
  const [stats, setStats] = useState({
    statusCounts: [],
    upcomingDeadlines: [],
    recentlyUpdated: [],
    categoryCounts: []
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');

  // 获取所有进度目标和统计数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const [progressRes, statsRes] = await Promise.all([
        axios.get('/api/progress'),
        axios.get('/api/progress/stats')
      ]);
      
      setProgressList(progressRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取进度数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchData();
  }, []);

  // 处理创建进度目标
  const handleCreateProgress = async (values) => {
    try {
      setLoading(true);
      
      // 处理日期格式
      const formattedValues = {
        ...values,
        targetDate: values.targetDate.format('YYYY-MM-DD'),
        tasks: values.tasks ? values.tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.format('YYYY-MM-DD') : null
        })) : []
      };
      
      await axios.post('/api/progress', formattedValues);
      message.success('创建学习目标成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('创建失败:', error);
      message.error('创建学习目标失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理修改进度目标
  const handleEditProgress = async (values) => {
    if (!currentProgress) return;
    
    try {
      setLoading(true);
      
      // 处理日期格式
      const formattedValues = {
        ...values,
        targetDate: values.targetDate.format('YYYY-MM-DD'),
        tasks: values.tasks ? values.tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.format('YYYY-MM-DD') : null
        })) : []
      };
      
      await axios.put(`/api/progress/${currentProgress.id}`, formattedValues);
      message.success('更新学习目标成功');
      setEditModalVisible(false);
      editForm.resetFields();
      fetchData();
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新学习目标失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const showEditModal = (record) => {
    setCurrentProgress(record);
    
    // 准备表单数据，处理日期格式
    const formData = {
      ...record,
      targetDate: moment(record.targetDate),
      tasks: record.tasks ? record.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? moment(task.dueDate) : null
      })) : []
    };
    
    editForm.setFieldsValue(formData);
    setEditModalVisible(true);
  };

  // 确认删除
  const showDeleteConfirm = (id) => {
    confirm({
      title: '确定要删除这个学习目标吗?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后将无法恢复',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await axios.delete(`/api/progress/${id}`);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败，请重试');
        }
      }
    });
  };

  // 更新任务状态
  const updateTaskStatus = async (taskId, isCompleted) => {
    try {
      await axios.patch(`/api/progress/task/${taskId}`, { isCompleted });
      fetchData();  // 刷新数据
    } catch (error) {
      console.error('更新任务状态失败:', error);
      message.error('更新任务状态失败，请重试');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '学习目标',
      dataIndex: 'goalTitle',
      key: 'goalTitle',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.category && <Tag color="blue" style={{ marginLeft: 8 }}>{record.category}</Tag>}
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: priority => {
        const colors = {
          high: 'red',
          medium: 'orange',
          low: 'green'
        };
        const texts = {
          high: '高',
          medium: '中',
          low: '低'
        };
        return <Tag color={colors[priority]}>{texts[priority]}</Tag>;
      }
    },
    {
      title: '目标日期',
      dataIndex: 'targetDate',
      key: 'targetDate',
      width: 120,
      render: date => moment(date).format('YYYY-MM-DD')
    },
    {
      title: '进度',
      dataIndex: 'progressPercentage',
      key: 'progressPercentage',
      width: 200,
      render: (percent, record) => (
        <Progress 
          percent={percent} 
          status={record.status === 'completed' ? 'success' : record.status === 'overdue' ? 'exception' : 'active'}
          size="small"
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: status => {
        const statusMap = {
          not_started: { color: 'default', text: '未开始' },
          in_progress: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          overdue: { color: 'error', text: '已逾期' }
        };
        return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <div>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          />
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => showDeleteConfirm(record.id)}
          />
        </div>
      )
    }
  ];

  // 按状态筛选进度列表
  const getFilteredProgressList = () => {
    if (activeTab === 'all') return progressList;
    return progressList.filter(item => item.status === activeTab);
  };

  // 统计卡片渲染
  const renderStatsCards = () => {
    const getCount = status => {
      const item = stats.statusCounts.find(s => s.status === status);
      return item ? item.count : 0;
    };

    return (
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="进行中目标" 
              value={getCount('in_progress')} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="已完成目标" 
              value={getCount('completed')} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="未开始目标" 
              value={getCount('not_started')} 
              valueStyle={{ color: '#d9d9d9' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="已逾期目标" 
              value={getCount('overdue')} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // 即将到期目标渲染
  const renderUpcomingDeadlines = () => (
    <List
      size="small"
      header={<div><CalendarOutlined /> 即将到期的目标</div>}
      bordered
      dataSource={stats.upcomingDeadlines || []}
      renderItem={item => (
        <List.Item 
          actions={[
            <Button 
              type="link" 
              onClick={() => showEditModal(item)}
            >
              查看
            </Button>
          ]}
        >
          <List.Item.Meta
            title={item.goalTitle}
            description={`截止日期: ${moment(item.targetDate).format('YYYY-MM-DD')}`}
          />
          <Progress percent={item.progressPercentage} size="small" style={{ width: 80 }} />
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="暂无即将到期的目标" /> }}
    />
  );

  return (
    <div style={{ padding: '20px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2}>学习进度跟踪</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加学习目标
          </Button>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {/* 统计数据 */}
        {renderStatsCards()}
        
        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col xs={24} md={16}>
            {/* 进度列表 */}
            <Card>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
              >
                <TabPane tab="全部" key="all" />
                <TabPane tab="进行中" key="in_progress" />
                <TabPane tab="已完成" key="completed" />
                <TabPane tab="未开始" key="not_started" />
                <TabPane tab="已逾期" key="overdue" />
              </Tabs>
              
              <Table
                columns={columns}
                dataSource={getFilteredProgressList()}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                expandable={{
                  expandedRowRender: record => (
                    <div>
                      {record.goalDescription && (
                        <div style={{ marginBottom: 10 }}>
                          <Text strong>描述：</Text> {record.goalDescription}
                        </div>
                      )}
                      
                      <Text strong>子任务：</Text>
                      {record.tasks && record.tasks.length > 0 ? (
                        <List
                          size="small"
                          dataSource={record.tasks}
                          renderItem={task => (
                            <List.Item
                              actions={[
                                <Tooltip title={task.isCompleted ? '标记为未完成' : '标记为已完成'}>
                                  <Button
                                    type={task.isCompleted ? 'primary' : 'default'}
                                    shape="circle"
                                    icon={task.isCompleted ? <CheckOutlined /> : <CloseOutlined />}
                                    size="small"
                                    onClick={() => updateTaskStatus(task.id, !task.isCompleted)}
                                  />
                                </Tooltip>
                              ]}
                            >
                              <div style={{ textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                                <Text strong>{task.taskName}</Text>
                                {task.dueDate && (
                                  <Text type="secondary" style={{ marginLeft: 8 }}>
                                    截止日期: {moment(task.dueDate).format('YYYY-MM-DD')}
                                  </Text>
                                )}
                              </div>
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty description="暂无子任务" />
                      )}
                    </div>
                  )
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            {/* 即将到期目标 */}
            <Card style={{ marginBottom: 16 }}>
              {renderUpcomingDeadlines()}
            </Card>
            
            {/* 最近更新目标 */}
            <Card>
              <List
                size="small"
                header={<div><ClockCircleOutlined /> 最近更新目标</div>}
                bordered
                dataSource={stats.recentlyUpdated || []}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        onClick={() => showEditModal(item)}
                      >
                        查看
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.goalTitle}
                      description={`最后更新: ${moment(item.lastUpdated).format('YYYY-MM-DD')}`}
                    />
                  </List.Item>
                )}
                locale={{ emptyText: <Empty description="暂无最近更新目标" /> }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 创建进度目标模态框 */}
      <Modal
        title="添加学习目标"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProgress}
          initialValues={{
            priority: 'medium',
            status: 'not_started',
            progressPercentage: 0,
            tasks: []
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="goalTitle"
                label="目标标题"
                rules={[{ required: true, message: '请输入目标标题' }]}
              >
                <Input placeholder="例如：完成Java编程课程" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="category"
                label="类别"
              >
                <Select placeholder="选择类别">
                  <Option value="学科学习">学科学习</Option>
                  <Option value="技能培养">技能培养</Option>
                  <Option value="证书考试">证书考试</Option>
                  <Option value="项目实践">项目实践</Option>
                  <Option value="读书计划">读书计划</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="goalDescription"
            label="目标描述"
          >
            <TextArea rows={3} placeholder="详细描述您的学习目标" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetDate"
                label="目标完成日期"
                rules={[{ required: true, message: '请选择目标完成日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
              >
                <Select>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="progressPercentage"
                label="当前进度"
              >
                <Input type="number" min={0} max={100} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">子任务</Divider>

          <Form.List name="tasks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'baseline' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'taskName']}
                      rules={[{ required: true, message: '请输入任务名称' }]}
                      style={{ flex: 1, marginRight: 8, marginBottom: 8 }}
                    >
                      <Input placeholder="任务名称" />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'dueDate']}
                      style={{ width: 150, marginRight: 8, marginBottom: 8 }}
                    >
                      <DatePicker placeholder="截止日期" style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'isCompleted']}
                      valuePropName="checked"
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      <Select style={{ width: 100 }}>
                        <Option value={false}>未完成</Option>
                        <Option value={true}>已完成</Option>
                      </Select>
                    </Form.Item>
                    
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginBottom: 8 }}
                    />
                  </div>
                ))}
                
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<FileAddOutlined />}
                    block
                  >
                    添加子任务
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑进度目标模态框 */}
      <Modal
        title="编辑学习目标"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditProgress}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="goalTitle"
                label="目标标题"
                rules={[{ required: true, message: '请输入目标标题' }]}
              >
                <Input placeholder="例如：完成Java编程课程" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="category"
                label="类别"
              >
                <Select placeholder="选择类别">
                  <Option value="学科学习">学科学习</Option>
                  <Option value="技能培养">技能培养</Option>
                  <Option value="证书考试">证书考试</Option>
                  <Option value="项目实践">项目实践</Option>
                  <Option value="读书计划">读书计划</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="goalDescription"
            label="目标描述"
          >
            <TextArea rows={3} placeholder="详细描述您的学习目标" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetDate"
                label="目标完成日期"
                rules={[{ required: true, message: '请选择目标完成日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
              >
                <Select>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="not_started">未开始</Option>
                  <Option value="in_progress">进行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="overdue">已逾期</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="progressPercentage"
            label="完成进度"
          >
            <Progress 
              type="line" 
              status="active"
              style={{ marginBottom: 0 }}
            />
          </Form.Item>

          <Divider orientation="left">子任务</Divider>

          <Form.List name="tasks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'baseline' }}>
                    <Form.Item
                      name={[name, 'id']}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'taskName']}
                      rules={[{ required: true, message: '请输入任务名称' }]}
                      style={{ flex: 1, marginRight: 8, marginBottom: 8 }}
                    >
                      <Input placeholder="任务名称" />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'dueDate']}
                      style={{ width: 150, marginRight: 8, marginBottom: 8 }}
                    >
                      <DatePicker placeholder="截止日期" style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'isCompleted']}
                      valuePropName="checked"
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      <Select style={{ width: 100 }}>
                        <Option value={false}>未完成</Option>
                        <Option value={true}>已完成</Option>
                      </Select>
                    </Form.Item>
                    
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginBottom: 8 }}
                    />
                  </div>
                ))}
                
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<FileAddOutlined />}
                    block
                  >
                    添加子任务
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setEditModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProgressTracking; 