import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Button, Input, Select, Space, Modal, Form, 
  message, Tag, Row, Col, Popconfirm, Typography, Divider 
} from 'antd';
import Table from '../../components/layout/Table';
import {
  SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined, ExportOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Title } = Typography;

const StudentsManage = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [form] = Form.useForm();

  // 获取学生列表
  useEffect(() => {
    fetchStudents();
  }, []);

  const filterStudents = useCallback(() => {
    // 确保students是数组
    if (!Array.isArray(students)) {
      setFilteredStudents([]);
      return;
    }
    
    let results = [...students];
    
    // 按姓名或学号搜索
    if (searchText) {
      results = results.filter(student => 
        student.name.toLowerCase().includes(searchText.toLowerCase()) || 
        student.studentId.includes(searchText)
      );
    }
    
    // 按院系筛选
    if (departmentFilter !== 'all') {
      results = results.filter(student => student.department === departmentFilter);
    }
    
    // 按年级筛选
    if (gradeFilter !== 'all') {
      results = results.filter(student => student.grade === gradeFilter);
    }
    
    setFilteredStudents(results);
  }, [students, searchText, departmentFilter, gradeFilter]);

  // 监听筛选条件变化
  useEffect(() => {
    filterStudents();
  }, [searchText, departmentFilter, gradeFilter, students, filterStudents]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/students');
      // 检查并处理response.data是对象还是数组的情况
      const studentsData = response.data.students || response.data || [];
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      
      // 提取所有院系，确保studentsData是数组
      if (Array.isArray(studentsData)) {
        const depts = Array.from(new Set(studentsData.map(student => student.department))).filter(Boolean);
        setDepartments(depts);
      } else {
        console.error('获取到的学生数据不是数组:', studentsData);
        setDepartments([]);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
      message.error('获取学生列表失败');
      // 初始化为空数组避免进一步的错误
      setStudents([]);
      setFilteredStudents([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleDepartmentChange = (value) => {
    setDepartmentFilter(value);
  };

  const handleGradeChange = (value) => {
    setGradeFilter(value);
  };

  const showAddModal = () => {
    form.resetFields();
    setIsEditing(false);
    setModalVisible(true);
  };

  const showEditModal = (student) => {
    setCurrentStudent(student);
    form.setFieldsValue({
      username: student.username,
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      department: student.department || '',
      major: student.major || '',
      class: student.class || '',
      grade: student.grade || ''
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success('删除成功');
      fetchStudents();
    } catch (error) {
      console.error('删除学生失败:', error);
      message.error('删除学生失败');
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredStudents.map(student => ({
      姓名: student.name,
      学号: student.studentId,
      院系: student.department,
      专业: student.major,
      班级: student.class,
      年级: student.grade,
      素拓学分: student.suketuoCredits,
      讲座学分: student.lectureCredits,
      劳动学分: student.laborCredits,
      总学分: student.suketuoCredits + student.lectureCredits + student.laborCredits
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '学生信息');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, '学生信息.xlsx');
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (isEditing && currentStudent) {
        await axios.put(`/api/users/${currentStudent.id}`, values);
        message.success('更新成功');
      } else {
        await axios.post('/api/users/register', { ...values, role: 'student' });
        message.success('添加成功');
      }
      
      setModalVisible(false);
      fetchStudents();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId'
    },
    {
      title: '院系',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major'
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class'
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade'
    },
    {
      title: '素拓学分',
      dataIndex: 'suketuoCredits',
      key: 'suketuoCredits',
      sorter: (a, b) => a.suketuoCredits - b.suketuoCredits,
      render: (text) => <span style={{ color: '#1890ff' }}>{text}</span>
    },
    {
      title: '讲座学分',
      dataIndex: 'lectureCredits',
      key: 'lectureCredits',
      sorter: (a, b) => a.lectureCredits - b.lectureCredits,
      render: (text) => <span style={{ color: '#52c41a' }}>{text}</span>
    },
    {
      title: '劳动学分',
      dataIndex: 'laborCredits',
      key: 'laborCredits',
      sorter: (a, b) => a.laborCredits - b.laborCredits,
      render: (text) => <span style={{ color: '#722ed1' }}>{text}</span>
    },
    {
      title: '总学分',
      key: 'totalCredits',
      render: (_, record) => (
        <Tag color="orange">
          {record.suketuoCredits + record.lectureCredits + record.laborCredits}
        </Tag>
      ),
      sorter: (a, b) => 
        (a.suketuoCredits + a.lectureCredits + a.laborCredits) - 
        (b.suketuoCredits + b.lectureCredits + b.laborCredits)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="确定要删除此学生吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 筛选工具栏
  const renderFilterBar = () => (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={8}>
          <Input 
            placeholder="搜索姓名或学号" 
            prefix={<SearchOutlined />} 
            onChange={e => handleSearch(e.target.value)}
            value={searchText}
            allowClear
          />
        </Col>
        <Col xs={12} md={5}>
          <Select
            style={{ width: '100%' }}
            placeholder="选择院系"
            onChange={handleDepartmentChange}
            value={departmentFilter}
          >
            <Option value="all">全部院系</Option>
            {departments.map(dept => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={12} md={5}>
          <Select
            style={{ width: '100%' }}
            placeholder="选择年级"
            onChange={handleGradeChange}
            value={gradeFilter}
          >
            <Option value="all">全部年级</Option>
            <Option value="大一">大一</Option>
            <Option value="大二">大二</Option>
            <Option value="大三">大三</Option>
            <Option value="大四">大四</Option>
            <Option value="研一">研一</Option>
            <Option value="研二">研二</Option>
            <Option value="研三">研三</Option>
          </Select>
        </Col>
        <Col xs={24} md={6} style={{ textAlign: 'right' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={showAddModal}
            >
              添加学生
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  // 添加/编辑学生模态框
  const renderStudentModal = () => (
    <Modal
      title={isEditing ? '编辑学生信息' : '添加学生'}
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      onOk={handleModalSubmit}
      okText={isEditing ? '保存' : '添加'}
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="用户名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="姓名" />
            </Form.Item>
          </Col>
        </Row>

        {!isEditing && (
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="studentId"
              label="学号"
              rules={[{ required: true, message: '请输入学号' }]}
            >
              <Input placeholder="学号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效邮箱' }
              ]}
            >
              <Input placeholder="邮箱" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="department"
              label="院系"
            >
              <Input placeholder="院系" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="major"
              label="专业"
            >
              <Input placeholder="专业" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="class"
              label="班级"
            >
              <Input placeholder="班级" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="grade"
              label="年级"
            >
              <Select placeholder="选择年级">
                <Option value="大一">大一</Option>
                <Option value="大二">大二</Option>
                <Option value="大三">大三</Option>
                <Option value="大四">大四</Option>
                <Option value="研一">研一</Option>
                <Option value="研二">研二</Option>
                <Option value="研三">研三</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phoneNumber"
          label="联系电话"
          rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }]}
        >
          <Input placeholder="联系电话" />
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <div className="students-manage-container">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <Title level={4}>学生管理</Title>
        <Divider />
      </div>

      {renderFilterBar()}
      
      <Card>
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </Card>
      
      {renderStudentModal()}
    </div>
  );
};

export default StudentsManage; 