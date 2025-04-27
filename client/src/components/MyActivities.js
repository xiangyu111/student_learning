import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, Button, Chip, 
  Grid, Container, Tabs, Tab, CircularProgress, Pagination, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { format } from 'date-fns';

const MyActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // 获取我的活动列表
  const fetchMyActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      // 构建查询参数
      const params = { 
        page,
        registrationStatus: selectedTab === 'all' ? undefined : selectedTab
      };
      
      const response = await axios.get('/api/activities/my-activities', { params });
      setActivities(response.data.activities);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('获取我的活动失败:', err);
      setError('获取活动列表失败，请稍后重试');
      // 使用模拟数据以便前端开发
      setActivities(getMockActivities());
    } finally {
      setLoading(false);
    }
  };

  // 首次加载和筛选条件变化时获取数据
  useEffect(() => {
    fetchMyActivities();
  }, [page, selectedTab]);

  // 切换标签页
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setPage(1); // 重置到第一页
  };

  // 取消报名
  const handleCancelRegistration = async (activityId) => {
    setCancelLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await axios.post(`/api/activities/${activityId}/cancel`);
      
      // 更新活动列表
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? 
          { 
            ...activity, 
            registrationStatus: '已取消' 
          } : 
          activity
        )
      );
      
      setMessage({ text: '已成功取消报名！', type: 'success' });
      
      // 3秒后关闭弹窗
      setTimeout(() => {
        setOpenDialog(false);
        setMessage({ text: '', type: '' });
      }, 2000);
      
    } catch (err) {
      console.error('取消报名失败:', err);
      setMessage({ 
        text: err.response?.data?.message || '取消报名失败，请稍后重试', 
        type: 'error' 
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // 打开活动详情对话框
  const openActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setOpenDialog(true);
    setMessage({ text: '', type: '' });
  };

  // 获取活动状态样式
  const getStatusColor = (status) => {
    switch (status) {
      case '未开始':
        return 'primary';
      case '进行中':
        return 'success';
      case '已结束':
        return 'default';
      case '已取消':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取报名状态样式
  const getRegistrationStatusColor = (status) => {
    switch (status) {
      case '已报名':
        return 'success';
      case '已参加':
        return 'info';
      case '未参加':
        return 'warning';
      case '已取消':
        return 'error';
      default:
        return 'default';
    }
  };

  // 模拟数据
  const getMockActivities = () => [
    {
      id: 1,
      title: '校园志愿服务活动',
      description: '为校园环境打扫卫生，美化校园',
      type: 'volunteer',
      status: '未开始',
      startDate: '2023-11-15T09:00:00',
      endDate: '2023-11-15T12:00:00',
      location: '校园主广场',
      capacity: 30,
      currentParticipants: 15,
      credits: 1.5,
      registrationStatus: '已报名',
      registerTime: '2023-11-01T14:30:00'
    },
    {
      id: 2,
      title: '学术讲座：人工智能与未来',
      description: '探讨AI技术发展及未来趋势',
      type: 'lecture',
      status: '已结束',
      startDate: '2023-10-20T14:00:00',
      endDate: '2023-10-20T16:00:00',
      location: '图书馆报告厅',
      capacity: 100,
      currentParticipants: 78,
      credits: 1.0,
      registrationStatus: '已参加',
      registerTime: '2023-10-15T10:15:00'
    },
    {
      id: 3,
      title: '社区环保倡导活动',
      description: '宣传环保理念，进行小区垃圾分类宣传',
      type: 'volunteer',
      status: '进行中',
      startDate: '2023-11-05T09:00:00',
      endDate: '2023-11-25T18:00:00',
      location: '社区广场',
      capacity: 20,
      currentParticipants: 12,
      credits: 2.0,
      registrationStatus: '已取消',
      registerTime: '2023-10-25T16:45:00'
    }
  ];

  // 渲染活动卡片
  const renderActivityCard = (activity) => (
    <Card 
      key={activity.id} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="div">
            {activity.title}
          </Typography>
          <Chip 
            label={activity.status} 
            color={getStatusColor(activity.status)}
            size="small"
          />
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {activity.type === 'suketuo' ? '素拓活动' :
             activity.type === 'lecture' ? '讲座活动' :
             activity.type === 'volunteer' ? '志愿服务' :
             activity.type === 'competition' ? '竞赛活动' : '其他活动'}
          </Typography>
          <Chip 
            label={activity.registrationStatus} 
            color={getRegistrationStatusColor(activity.registrationStatus)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>地点：</strong>{activity.location}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>时间：</strong>{format(new Date(activity.startDate), 'yyyy-MM-dd HH:mm')}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>学分：</strong>{activity.credits}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>报名时间：</strong>{format(new Date(activity.registerTime), 'yyyy-MM-dd HH:mm')}
        </Typography>
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0 }}>
        <Button 
          variant="contained" 
          fullWidth
          onClick={() => openActivityDetail(activity)}
        >
          查看详情
        </Button>
      </Box>
    </Card>
  );

  // 渲染活动详情对话框
  const renderActivityDialog = () => (
    <Dialog 
      open={openDialog} 
      onClose={() => !cancelLoading && setOpenDialog(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedActivity && (
        <>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{selectedActivity.title}</Typography>
              <Box>
                <Chip 
                  label={selectedActivity.status} 
                  color={getStatusColor(selectedActivity.status)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={selectedActivity.registrationStatus} 
                  color={getRegistrationStatusColor(selectedActivity.registrationStatus)}
                  size="small"
                />
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="body1" paragraph>
                  {selectedActivity.description}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  活动详情
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>活动类型：</strong>
                    {selectedActivity.type === 'suketuo' ? '素拓活动' :
                     selectedActivity.type === 'lecture' ? '讲座活动' :
                     selectedActivity.type === 'volunteer' ? '志愿服务' :
                     selectedActivity.type === 'competition' ? '竞赛活动' : '其他活动'}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>活动地点：</strong>{selectedActivity.location}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>开始时间：</strong>{format(new Date(selectedActivity.startDate), 'yyyy-MM-dd HH:mm')}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>结束时间：</strong>{format(new Date(selectedActivity.endDate), 'yyyy-MM-dd HH:mm')}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>可获学分：</strong>{selectedActivity.credits}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    mb: 2
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    我的参与信息
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>报名状态：</strong>
                    <Chip 
                      label={selectedActivity.registrationStatus} 
                      color={getRegistrationStatusColor(selectedActivity.registrationStatus)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>报名时间：</strong>{format(new Date(selectedActivity.registerTime), 'yyyy-MM-dd HH:mm')}
                  </Typography>
                  
                  {message.text && (
                    <Alert 
                      severity={message.type} 
                      sx={{ mt: 2, mb: 1 }}
                    >
                      {message.text}
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)} 
              disabled={cancelLoading}
            >
              关闭
            </Button>
            
            {selectedActivity.status !== '已结束' && 
             selectedActivity.registrationStatus === '已报名' && (
              <Button 
                onClick={() => handleCancelRegistration(selectedActivity.id)} 
                color="error" 
                variant="contained"
                disabled={cancelLoading}
              >
                {cancelLoading ? <CircularProgress size={24} /> : '取消报名'}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        我的活动
      </Typography>
      
      {/* 标签选项卡 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          aria-label="活动筛选标签"
        >
          <Tab label="全部活动" value="all" />
          <Tab label="已报名" value="已报名" />
          <Tab label="已参加" value="已参加" />
          <Tab label="已取消" value="已取消" />
        </Tabs>
      </Box>
      
      {/* 活动列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : activities.length === 0 ? (
        <Alert severity="info">
          {selectedTab === 'all' ? 
            '您还没有参与任何活动，请前往活动列表查看可参与的活动' : 
            `没有${selectedTab}的活动`}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {activities.map(activity => (
            <Grid item key={activity.id} xs={12} sm={6} md={4}>
              {renderActivityCard(activity)}
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* 分页器 */}
      {activities.length > 0 && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: 4 
          }}
        >
          <Pagination 
            count={totalPages} 
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
      
      {/* 活动详情对话框 */}
      {renderActivityDialog()}
    </Container>
  );
};

export default MyActivities; 