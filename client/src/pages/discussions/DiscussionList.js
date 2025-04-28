import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Table, Button, Input, Select, Tag, Space, 
  Divider, Card, Typography, Badge, Tooltip, 
  Pagination, Empty
} from 'antd';
import { 
  MessageOutlined, EyeOutlined, UserOutlined, 
  ClockCircleOutlined, PlusOutlined, SearchOutlined,
  PushpinOutlined, LockOutlined, FilterOutlined
} from '@ant-design/icons';
import { getDiscussions, getCategoriesAndTags } from '../../services/discussionApi';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// 在文件顶部定义分类常量
const CATEGORIES = [
  { name: '素拓活动', count: 0 },
  { name: '讲座活动', count: 0 },
  { name: '劳动学分', count: 0 },
  { name: '综合', count: 0 }
];

const DiscussionList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // 状态
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: parseInt(queryParams.get('page')) || 1,
    pageSize: parseInt(queryParams.get('limit')) || 10,
    total: 0
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({
    category: queryParams.get('category') || '',
    tag: queryParams.get('tag') || '',
    search: queryParams.get('search') || '',
    sortBy: queryParams.get('sortBy') || 'createdAt',
    order: queryParams.get('order') || 'DESC'
  });

  // 获取讨论列表
  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      
      const data = await getDiscussions(params);
      
      setDiscussions(data.discussions);
      setPagination({
        ...pagination,
        total: data.total,
        current: data.currentPage
      });
      
      // 更新URL参数
      const searchParams = new URLSearchParams();
      searchParams.set('page', data.currentPage);
      searchParams.set('limit', pagination.pageSize);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.set(key, value);
      });
      
      navigate({
        pathname: location.pathname,
        search: searchParams.toString()
      }, { replace: true });
      
    } catch (error) {
      console.error('获取讨论列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取分类和标签
  const fetchCategoriesAndTags = async () => {
    try {
      const data = await getCategoriesAndTags();
      // 使用固定的分类选项
      setCategories(CATEGORIES);
      setTags(data.tags || []);
    } catch (error) {
      console.error('获取分类和标签失败:', error);
      // 出错时设置默认分类
      setCategories(CATEGORIES);
    }
  };

  useEffect(() => {
    fetchDiscussions();
    fetchCategoriesAndTags();
  }, [pagination.current, pagination.pageSize, filters]);

  // 处理搜索
  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  // 处理分类筛选
  const handleCategoryChange = (value) => {
    setFilters({ ...filters, category: value });
    setPagination({ ...pagination, current: 1 });
  };

  // 处理标签筛选
  const handleTagChange = (value) => {
    setFilters({ ...filters, tag: value });
    setPagination({ ...pagination, current: 1 });
  };

  // 处理排序方式变更
  const handleSortChange = (value) => {
    setFilters({ ...filters, sortBy: value });
  };

  // 处理排序顺序变更
  const handleOrderChange = (value) => {
    setFilters({ ...filters, order: value });
  };

  // 分页改变
  const handlePageChange = (page, pageSize) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  // 创建新讨论
  const handleCreateDiscussion = () => {
    navigate('/discussions/create');
  };

  // 表格列定义
  const columns = [
    {
      title: '主题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            {record.isSticky && (
              <Tooltip title="置顶">
                <PushpinOutlined style={{ color: '#f56a00' }} />
              </Tooltip>
            )}
            {record.isLocked && (
              <Tooltip title="已锁定">
                <LockOutlined style={{ color: '#999' }} />
              </Tooltip>
            )}
            <Link to={`/discussions/${record.id}`}>
              <Text strong>{text}</Text>
            </Link>
          </Space>
          <Space size={4} style={{ marginTop: 4 }}>
            {record.category && (
              <Tag color="blue">{record.category}</Tag>
            )}
            {record.tags && record.tags.split(',').map(tag => (
              <Tag key={tag} color="default">{tag.trim()}</Tag>
            ))}
          </Space>
        </Space>
      ),
    },
    {
      title: '作者',
      key: 'author',
      width: 120,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text>{record.author?.fullName || record.author?.username}</Text>
        </Space>
      ),
    },
    {
      title: '回复/查看',
      key: 'stats',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ lineHeight: '1.2em' }}>
          <Space>
            <MessageOutlined />
            <Text>{record.replyCount}</Text>
          </Space>
          <Space>
            <EyeOutlined />
            <Text>{record.viewCount}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '最后回复',
      key: 'lastReply',
      width: 180,
      render: (_, record) => {
        if (record.lastReplyTime) {
          return (
            <Space direction="vertical" size={0} style={{ lineHeight: '1.2em' }}>
              <Space>
                <UserOutlined />
                <Text>{record.lastReplier?.fullName || record.lastReplier?.username || '匿名'}</Text>
              </Space>
              <Space>
                <ClockCircleOutlined />
                <Text>{moment(record.lastReplyTime).fromNow()}</Text>
              </Space>
            </Space>
          );
        }
        return (
          <Space>
            <ClockCircleOutlined />
            <Text>{moment(record.createdAt).fromNow()}</Text>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="discussion-list-container">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4}>讨论交流</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateDiscussion}
          >
            发起讨论
          </Button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="搜索讨论主题或内容"
              allowClear
              onSearch={handleSearch}
              style={{ width: 250 }}
              defaultValue={filters.search}
            />
            
            <Select
              placeholder="选择分类"
              style={{ width: 140 }}
              allowClear
              onChange={handleCategoryChange}
              value={filters.category || undefined}
            >
              {categories.map(cat => (
                <Option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </Option>
              ))}
            </Select>
            
            <Select
              placeholder="选择标签"
              style={{ width: 140 }}
              allowClear
              onChange={handleTagChange}
              value={filters.tag || undefined}
            >
              {tags.map(tag => (
                <Option key={tag.name} value={tag.name}>
                  {tag.name} ({tag.count})
                </Option>
              ))}
            </Select>
            
            <Divider type="vertical" />
            
            <Space>
              <Text>排序:</Text>
              <Select
                defaultValue={filters.sortBy}
                style={{ width: 120 }}
                onChange={handleSortChange}
              >
                <Option value="createdAt">发布时间</Option>
                <Option value="lastReply">最后回复</Option>
                <Option value="views">浏览量</Option>
                <Option value="replies">回复数</Option>
              </Select>
              
              <Select
                defaultValue={filters.order}
                style={{ width: 80 }}
                onChange={handleOrderChange}
              >
                <Option value="DESC">降序</Option>
                <Option value="ASC">升序</Option>
              </Select>
            </Space>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={discussions}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: <Empty description="暂无讨论" />
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={total => `共 ${total} 条讨论`}
          />
        </div>
      </Card>
    </div>
  );
};

export default DiscussionList; 