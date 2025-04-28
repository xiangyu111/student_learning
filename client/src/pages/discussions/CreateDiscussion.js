import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Form, Input, Button, Upload, message, 
  Typography, Space, Divider, Select
} from 'antd';
import { 
  UploadOutlined, ArrowLeftOutlined, 
  SaveOutlined, QuestionOutlined 
} from '@ant-design/icons';
import { createDiscussion, getCategoriesAndTags } from '../../services/discussionApi';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 固定的分类选项
const CATEGORIES = [
  { name: '素拓活动', count: 0 },
  { name: '讲座活动', count: 0 },
  { name: '劳动学分', count: 0 },
  { name: '综合', count: 0 }
];

const CreateDiscussion = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const [fileList, setFileList] = useState([]);
  const [previewContent, setPreviewContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  
  // 获取标签
  const fetchTags = async () => {
    try {
      const data = await getCategoriesAndTags();
      setTags(data.tags || []);
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };
  
  useEffect(() => {
    // 检查是否已登录
    if (!user) {
      message.warning('请先登录');
      navigate('/login?redirect=/discussions/create');
      return;
    }
    
    fetchTags();
    
    // 设置默认分类
    form.setFieldsValue({
      category: '素拓活动'
    });
  }, [user, navigate, form]);
  
  // 切换预览模式
  const togglePreviewMode = () => {
    const content = form.getFieldValue('content') || '';
    setPreviewContent(content);
    setPreviewMode(!previewMode);
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
  
  // 提交表单
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // 确保分类不是undefined
      const discussionData = {
        ...values,
        category: values.category || '素拓活动',
        attachments: fileList
      };
      
      const response = await createDiscussion(discussionData);
      message.success('创建讨论成功');
      
      // 跳转到新创建的讨论详情页
      navigate(`/discussions/${response.id}`);
    } catch (error) {
      console.error('创建讨论失败:', error);
      message.error('创建讨论失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="create-discussion-container">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={4}>发起新讨论</Title>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/discussions')}
          >
            返回列表
          </Button>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          scrollToFirstError
          initialValues={{ category: '素拓活动' }}
        >
          <Form.Item
            name="title"
            label="讨论标题"
            rules={[
              { required: true, message: '请输入讨论标题' },
              { max: 200, message: '标题不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入标题，简明扼要地描述您的主题" />
          </Form.Item>
          
          <Space style={{ display: 'flex', marginBottom: 16 }}>
            <Form.Item
              name="category"
              label="分类"
              style={{ width: 200 }}
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select
                placeholder="选择分类"
                allowClear={false}
              >
                {CATEGORIES.map(cat => (
                  <Option key={cat.name} value={cat.name}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="tags"
              label="标签"
              help="多个标签用英文逗号分隔"
              style={{ flexGrow: 1 }}
            >
              <Select
                mode="tags"
                placeholder="选择或输入标签，多个标签用回车分隔"
                allowClear
                tokenSeparators={[',']}
              >
                {tags.map(tag => (
                  <Option key={tag.name} value={tag.name}>
                    {tag.name} {tag.count > 0 && `(${tag.count})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
          
          {previewMode ? (
            <div className="content-preview">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>预览内容</Text>
                <Button size="small" onClick={togglePreviewMode}>
                  返回编辑
                </Button>
              </div>
              
              <Card style={{ marginBottom: 16 }}>
                <ReactMarkdown>
                  {previewContent}
                </ReactMarkdown>
              </Card>
            </div>
          ) : (
            <Form.Item
              name="content"
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>讨论内容</span>
                  <Button size="small" onClick={togglePreviewMode}>
                    预览
                  </Button>
                </div>
              }
              rules={[{ required: true, message: '请输入讨论内容' }]}
            >
              <TextArea 
                rows={15} 
                placeholder="请输入讨论内容，支持Markdown格式" 
              />
            </Form.Item>
          )}
          
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
              <Button icon={<UploadOutlined />}>上传附件 (最多5个，每个不超过10MB)</Button>
            </Upload>
          </Form.Item>
          
          <Divider />
          
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Space size="large">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  loading={submitting}
                  size="large"
                >
                  发布讨论
                </Button>
                <Button 
                  onClick={() => navigate('/discussions')} 
                  size="large"
                >
                  取消
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
        
        <Divider />
        
        <div style={{ marginTop: 16 }}>
          <Title level={5}>
            <QuestionOutlined /> 讨论提示
          </Title>
          <ul>
            <li>讨论标题应清晰明了，便于他人理解您的问题或话题</li>
            <li>内容支持Markdown格式，可以更好地排版和组织您的讨论内容</li>
            <li>如有需要，可以上传相关图片或文件作为附件</li>
            <li>请选择合适的分类和标签，以便他人更容易找到您的讨论</li>
            <li>发布前请确保内容符合社区规范，避免发布违规或低质量内容</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default CreateDiscussion; 