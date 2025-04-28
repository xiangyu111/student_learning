import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Card, Typography, Space, Button, Tag, Divider, 
  Avatar, List, Form, Input, Upload, 
  message, Tooltip, Popconfirm, Modal, Spin
} from 'antd';
import { 
  UserOutlined, MessageOutlined, EyeOutlined, 
  ClockCircleOutlined, EditOutlined, DeleteOutlined,
  PushpinOutlined, LockOutlined, LikeOutlined, 
  UploadOutlined, CheckCircleOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { 
  getDiscussionById, createReply, deleteDiscussion, 
  deleteReply, toggleStickyDiscussion, toggleLockDiscussion,
  acceptReply, getChildReplies, updateDiscussion 
} from '../../services/discussionApi';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 自定义的评论组件，替代antd的Comment组件
const CommentItem = ({ author, avatar, content, datetime, actions, children }) => {
  return (
    <div style={{ display: 'flex', marginBottom: 16 }}>
      <div style={{ marginRight: 12 }}>
        {avatar}
      </div>
      <div style={{ flex: 1 }}>
        <div>
          <Text strong>{author}</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>{datetime}</Text>
        </div>
        <div style={{ marginTop: 4 }}>{content}</div>
        {actions && actions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {actions.map((action, index) => (
              <span key={index} style={{ marginRight: 12 }}>{action}</span>
            ))}
          </div>
        )}
        {children && <div style={{ marginTop: 16 }}>{children}</div>}
      </div>
    </div>
  );
};

const DiscussionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  
  // 状态
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  // 获取讨论详情
  const fetchDiscussion = async () => {
    setLoading(true);
    try {
      const data = await getDiscussionById(id);
      setDiscussion(data);
      
      // 如果是编辑模式，预填表单
      if (editMode) {
        editForm.setFieldsValue({
          title: data.title,
          content: data.content,
          category: data.category,
          tags: data.tags
        });
        
        // 如果有附件，设置文件列表
        if (data.attachments) {
          const attachments = data.attachments.split(',');
          const files = attachments.map((file, index) => ({
            uid: `-${index}`,
            name: file.split('/').pop(),
            status: 'done',
            url: file,
          }));
          setFileList(files);
        }
      }
    } catch (error) {
      console.error('获取讨论详情失败:', error);
      message.error('获取讨论详情失败');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDiscussion();
  }, [id, editMode]);
  
  // 展开/折叠子回复
  const toggleChildReplies = async (replyId) => {
    if (expandedReplies[replyId]) {
      // 已展开，直接折叠
      setExpandedReplies({ ...expandedReplies, [replyId]: null });
    } else {
      // 未展开，请求子回复
      try {
        const childReplies = await getChildReplies(replyId);
        setExpandedReplies({ ...expandedReplies, [replyId]: childReplies });
      } catch (error) {
        console.error('获取子回复失败:', error);
        message.error('获取子回复失败');
      }
    }
  };
  
  // 提交回复
  const handleReplySubmit = async (values) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    
    setSubmitting(true);
    try {
      const replyData = {
        content: values.content,
        parentReplyId: values.parentReplyId,
        attachments: values.attachments?.fileList
      };
      
      await createReply(id, replyData);
      message.success('回复成功');
      replyForm.resetFields();
      
      // 刷新讨论
      fetchDiscussion();
    } catch (error) {
      console.error('提交回复失败:', error);
      message.error('提交回复失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 删除讨论
  const handleDeleteDiscussion = async () => {
    try {
      await deleteDiscussion(id);
      message.success('删除成功');
      navigate('/discussions');
    } catch (error) {
      console.error('删除讨论失败:', error);
      message.error('删除讨论失败');
    }
  };
  
  // 删除回复
  const handleDeleteReply = async (replyId) => {
    try {
      await deleteReply(replyId);
      message.success('删除回复成功');
      
      // 刷新讨论
      fetchDiscussion();
    } catch (error) {
      console.error('删除回复失败:', error);
      message.error('删除回复失败');
    }
  };
  
  // 置顶/取消置顶
  const handleToggleSticky = async () => {
    try {
      const response = await toggleStickyDiscussion(id);
      message.success(response.message);
      
      // 刷新讨论
      fetchDiscussion();
    } catch (error) {
      console.error('修改置顶状态失败:', error);
      message.error('修改置顶状态失败');
    }
  };
  
  // 锁定/解锁
  const handleToggleLock = async () => {
    try {
      const response = await toggleLockDiscussion(id);
      message.success(response.message);
      
      // 刷新讨论
      fetchDiscussion();
    } catch (error) {
      console.error('修改锁定状态失败:', error);
      message.error('修改锁定状态失败');
    }
  };
  
  // 采纳最佳回复
  const handleAcceptReply = async (replyId) => {
    try {
      await acceptReply(replyId);
      message.success('已设置为最佳回复');
      
      // 刷新讨论
      fetchDiscussion();
    } catch (error) {
      console.error('设置最佳回复失败:', error);
      message.error('设置最佳回复失败');
    }
  };
  
  // 切换编辑模式
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  // 更新讨论
  const handleUpdateDiscussion = async (values) => {
    try {
      await updateDiscussion(id, {
        ...values,
        attachments: values.attachments?.fileList
      });
      
      message.success('更新成功');
      setEditMode(false);
      
      // 刷新讨论
      fetchDiscussion();
    } catch (error) {
      console.error('更新讨论失败:', error);
      message.error('更新讨论失败');
    }
  };
  
  // 处理文件上传变化
  const handleFileChange = ({ fileList }) => setFileList(fileList);
  
  // 上传前检查文件大小
  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过10MB!');
    }
    return isLt10M;
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!discussion) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Title level={4}>讨论不存在或已被删除</Title>
          <Button type="primary" onClick={() => navigate('/discussions')}>
            返回讨论列表
          </Button>
        </div>
      </Card>
    );
  }
  
  // 是否可以管理讨论(作者或管理员)
  const canManageDiscussion = user && (user.id === discussion.userId || user.role === 'admin');
  
  // 是否可以回复
  const canReply = user && !discussion.isLocked;
  
  // 渲染讨论详情
  return (
    <div className="discussion-detail-container">
      <Card>
        <div style={{ marginBottom: 20 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/discussions')}
          >
            返回列表
          </Button>
        </div>
        
        {editMode ? (
          <Card title="编辑讨论" bordered={false}>
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleUpdateDiscussion}
              initialValues={{
                title: discussion.title,
                content: discussion.content,
                category: discussion.category,
                tags: discussion.tags
              }}
            >
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="讨论标题" maxLength={200} />
              </Form.Item>
              
              <Form.Item
                name="category"
                label="分类"
              >
                <Input placeholder="讨论分类" maxLength={50} />
              </Form.Item>
              
              <Form.Item
                name="tags"
                label="标签"
                help="多个标签用英文逗号分隔"
              >
                <Input placeholder="标签1, 标签2, 标签3" maxLength={200} />
              </Form.Item>
              
              <Form.Item
                name="content"
                label="内容"
                rules={[{ required: true, message: '请输入内容' }]}
              >
                <TextArea rows={10} placeholder="支持Markdown格式" />
              </Form.Item>
              
              <Form.Item
                name="attachments"
                label="附件"
                valuePropName="fileList"
                getValueFromEvent={e => e.fileList}
              >
                <Upload
                  listType="picture"
                  fileList={fileList}
                  onChange={handleFileChange}
                  beforeUpload={beforeUpload}
                  maxCount={5}
                >
                  <Button icon={<UploadOutlined />}>上传附件 (最多5个)</Button>
                </Upload>
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    保存
                  </Button>
                  <Button onClick={toggleEditMode}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Title level={3}>
                {discussion.isSticky && (
                  <Tooltip title="置顶">
                    <PushpinOutlined style={{ color: '#f56a00', marginRight: 8 }} />
                  </Tooltip>
                )}
                {discussion.isLocked && (
                  <Tooltip title="已锁定">
                    <LockOutlined style={{ color: '#999', marginRight: 8 }} />
                  </Tooltip>
                )}
                {discussion.title}
              </Title>
              
              {canManageDiscussion && (
                <Space>
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={toggleEditMode}
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    title="确定要删除这个讨论吗?"
                    onConfirm={handleDeleteDiscussion}
                    okText="是"
                    cancelText="否"
                  >
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                  
                  {user.role === 'admin' && (
                    <>
                      <Button 
                        icon={<PushpinOutlined />} 
                        onClick={handleToggleSticky}
                      >
                        {discussion.isSticky ? '取消置顶' : '置顶'}
                      </Button>
                      <Button 
                        icon={<LockOutlined />} 
                        onClick={handleToggleLock}
                      >
                        {discussion.isLocked ? '解锁' : '锁定'}
                      </Button>
                    </>
                  )}
                </Space>
              )}
            </div>
            
            <Space wrap size={4} style={{ marginTop: 4, marginBottom: 16 }}>
              {discussion.category && (
                <Tag color="blue">{discussion.category}</Tag>
              )}
              {discussion.tags && discussion.tags.split(',').map(tag => (
                <Tag key={tag} color="default">{tag.trim()}</Tag>
              ))}
            </Space>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space>
                <Avatar icon={<UserOutlined />} src={discussion.author?.avatar} />
                <Text strong>{discussion.author?.fullName || discussion.author?.username}</Text>
                <Text type="secondary">
                  发布于 {moment(discussion.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </Space>
              
              <Space>
                <Space>
                  <EyeOutlined />
                  <Text>{discussion.viewCount} 浏览</Text>
                </Space>
                <Space>
                  <MessageOutlined />
                  <Text>{discussion.replyCount} 回复</Text>
                </Space>
              </Space>
            </div>
            
            <Card style={{ marginBottom: 24 }}>
              <div className="discussion-content">
                <ReactMarkdown>
                  {discussion.content}
                </ReactMarkdown>
                
                {discussion.attachments && (
                  <div style={{ marginTop: 16 }}>
                    <Divider orientation="left">附件</Divider>
                    <Space direction="vertical">
                      {discussion.attachments.split(',').map((attachment, index) => (
                        <a 
                          key={index} 
                          href={attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {attachment.split('/').pop()}
                        </a>
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            </Card>
            
            <Divider orientation="left">回复列表</Divider>
            
            {discussion.replies && discussion.replies.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={discussion.replies}
                renderItem={reply => (
                  <List.Item>
                    <CommentItem
                      author={<Text strong>{reply.author?.fullName || reply.author?.username}</Text>}
                      avatar={<Avatar icon={<UserOutlined />} src={reply.author?.avatar} />}
                      content={(
                        <div>
                          {reply.isAccepted && (
                            <Tag color="success" style={{ marginBottom: 8 }}>
                              <CheckCircleOutlined /> 最佳回复
                            </Tag>
                          )}
                          <div className="reply-content">
                            <ReactMarkdown>
                              {reply.content}
                            </ReactMarkdown>
                            
                            {reply.attachments && (
                              <div style={{ marginTop: 8 }}>
                                <Text strong>附件:</Text>
                                <Space direction="vertical" style={{ marginLeft: 8 }}>
                                  {reply.attachments.split(',').map((attachment, index) => (
                                    <a 
                                      key={index} 
                                      href={attachment} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      {attachment.split('/').pop()}
                                    </a>
                                  ))}
                                </Space>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      datetime={(
                        <Tooltip title={moment(reply.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                          <span>{moment(reply.createdAt).fromNow()}</span>
                        </Tooltip>
                      )}
                      actions={[
                        <Space>
                          {canReply && (
                            <span 
                              key="reply-to-reply" 
                              onClick={() => {
                                replyForm.setFieldsValue({
                                  parentReplyId: reply.id,
                                  content: `@${reply.author?.fullName || reply.author?.username} `
                                });
                                document.getElementById('replyForm').scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              回复
                            </span>
                          )}
                          
                          {(user?.id === reply.userId || user?.role === 'admin') && (
                            <Popconfirm
                              title="确定要删除这条回复吗?"
                              onConfirm={() => handleDeleteReply(reply.id)}
                              okText="是"
                              cancelText="否"
                            >
                              <span key="delete-reply">删除</span>
                            </Popconfirm>
                          )}
                          
                          {(user?.id === discussion.userId || user?.role === 'admin') && !reply.isAccepted && (
                            <span 
                              key="accept-reply" 
                              onClick={() => handleAcceptReply(reply.id)}
                            >
                              采纳为最佳回复
                            </span>
                          )}
                          
                          {reply.childReplies > 0 && (
                            <span 
                              key="view-child-replies" 
                              onClick={() => toggleChildReplies(reply.id)}
                            >
                              {expandedReplies[reply.id] ? '收起子回复' : `查看子回复(${reply.childReplies})`}
                            </span>
                          )}
                        </Space>
                      ]}
                    >
                      {expandedReplies[reply.id] && expandedReplies[reply.id].length > 0 && (
                        <div style={{ marginLeft: 40 }}>
                          <List
                            itemLayout="vertical"
                            dataSource={expandedReplies[reply.id]}
                            renderItem={childReply => (
                              <List.Item>
                                <CommentItem
                                  author={<Text strong>{childReply.author?.fullName || childReply.author?.username}</Text>}
                                  avatar={<Avatar icon={<UserOutlined />} src={childReply.author?.avatar} />}
                                  content={(
                                    <div className="reply-content">
                                      <ReactMarkdown>
                                        {childReply.content}
                                      </ReactMarkdown>
                                      
                                      {childReply.attachments && (
                                        <div style={{ marginTop: 8 }}>
                                          <Text strong>附件:</Text>
                                          <Space direction="vertical" style={{ marginLeft: 8 }}>
                                            {childReply.attachments.split(',').map((attachment, index) => (
                                              <a 
                                                key={index} 
                                                href={attachment} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                              >
                                                {attachment.split('/').pop()}
                                              </a>
                                            ))}
                                          </Space>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  datetime={(
                                    <Tooltip title={moment(childReply.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                                      <span>{moment(childReply.createdAt).fromNow()}</span>
                                    </Tooltip>
                                  )}
                                  actions={[
                                    <Space>
                                      {canReply && (
                                        <span 
                                          key="reply-to-child" 
                                          onClick={() => {
                                            replyForm.setFieldsValue({
                                              parentReplyId: reply.id,
                                              content: `@${childReply.author?.fullName || childReply.author?.username} `
                                            });
                                            document.getElementById('replyForm').scrollIntoView({ behavior: 'smooth' });
                                          }}
                                        >
                                          回复
                                        </span>
                                      )}
                                      
                                      {(user?.id === childReply.userId || user?.role === 'admin') && (
                                        <Popconfirm
                                          title="确定要删除这条回复吗?"
                                          onConfirm={() => handleDeleteReply(childReply.id)}
                                          okText="是"
                                          cancelText="否"
                                        >
                                          <span key="delete-child-reply">删除</span>
                                        </Popconfirm>
                                      )}
                                    </Space>
                                  ]}
                                />
                              </List.Item>
                            )}
                          />
                        </div>
                      )}
                    </CommentItem>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="secondary">暂无回复</Text>
              </div>
            )}
            
            <Divider />
            
            {discussion.isLocked ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Text type="warning">该讨论已被锁定，无法回复</Text>
              </div>
            ) : (
              canReply ? (
                <div id="replyForm">
                  <Card title="发表回复">
                    <Form
                      form={replyForm}
                      onFinish={handleReplySubmit}
                      layout="vertical"
                    >
                      <Form.Item name="parentReplyId" hidden>
                        <Input />
                      </Form.Item>
                      
                      <Form.Item
                        name="content"
                        rules={[{ required: true, message: '请输入回复内容' }]}
                      >
                        <TextArea rows={6} placeholder="支持Markdown格式" />
                      </Form.Item>
                      
                      <Form.Item
                        name="attachments"
                        label="附件"
                        valuePropName="fileList"
                        getValueFromEvent={e => e.fileList}
                      >
                        <Upload
                          listType="picture"
                          beforeUpload={beforeUpload}
                          maxCount={5}
                        >
                          <Button icon={<UploadOutlined />}>上传附件 (最多5个)</Button>
                        </Upload>
                      </Form.Item>
                      
                      <Form.Item>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={submitting}
                        >
                          发表回复
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text type="secondary">请登录后回复</Text>
                </div>
              )
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default DiscussionDetail; 