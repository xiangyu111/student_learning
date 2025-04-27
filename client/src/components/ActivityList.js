import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Card, CardContent, Typography, Button, Chip, 
  Grid, Container, TextField, Select, MenuItem, FormControl, 
  InputLabel, Dialog, DialogTitle, DialogContent, 
  DialogActions, CircularProgress, Pagination, Alert
} from '@mui/material';
import { format } from 'date-fns';

const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState({ text: '', type: '' });

  // 获取活动列表
  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, page };
      
      const response = await axios.get('/api/activities', { params });
      setActivities(response.data.activities);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error('获取活动列表失败:', err);
      setError('获取活动列表失败，请稍后重试');
      // 使用模拟数据以便前端开发
      setActivities(getMockActivities());
    } finally {
      setLoading(false);
    }
  };

  // 首次加载和筛选条件变化时获取数据
  useEffect(() => {
    fetchActivities();
  }, [page, filters]);

  // 处理筛选条件变化
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // 重置到第一页
  };

  // 报名活动
  const handleRegister = async (activityId) => {
    setRegistrationLoading(true);
    setRegistrationMessage({ text: '', type: '' });
    
    try {
      const response = await axios.post(`/api/activities/${activityId}/register`);
      
      // 更新活动列表中的报名状态
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? 
          { 
            ...activity, 
            isRegistered: true,
            registrationStatus: '已报名',
            currentParticipants: activity.currentParticipants + 1 
          } : 
          activity
        )
      );
      
      setRegistrationMessage({ text: '报名成功！', type: 'success' });
      
      // 3秒后关闭弹窗
      setTimeout(() => {
        setOpenDialog(false);
        setRegistrationMessage({ text: '', type: '' });
      }, 3000);
      
    } catch (err) {
      console.error('报名活动失败:', err);
      setRegistrationMessage({ 
        text: err.response?.data?.message || '报名失败，请稍后重试', 
        type: 'error' 
      });
    } finally {
      setRegistrationLoading(false);
    }
  };

  // 取消报名
  const handleCancelRegistration = async (activityId) => {
    setRegistrationLoading(true);
    setRegistrationMessage({ text: '', type: '' });
    
    try {
      const response = await axios.post(`/api/activities/${activityId}/cancel`);
      
      // 更新活动列表中的报名状态
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? 
          { 
            ...activity, 
            isRegistered: false,
            registrationStatus: null,
            currentParticipants: Math.max(0, activity.currentParticipants - 1) 
          } : 
          activity
        )
      );
      
      setRegistrationMessage({ text: '已成功取消报名！', type: 'success' });
      
      // 3秒后关闭弹窗
      setTimeout(() => {
        setOpenDialog(false);
        setRegistrationMessage({ text: '', type: '' });
      }, 3000);
      
    } catch (err) {
      console.error('取消报名失败:', err);
      setRegistrationMessage({ 
        text: err.response?.data?.message || '取消报名失败，请稍后重试', 
        type: 'error' 
      });
    } finally {
      setRegistrationLoading(false);
    }
  };

  // 打开活动详情对话框
  const openActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setOpenDialog(true);
    setRegistrationMessage({ text: '', type: '' });
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
      startDate: '2023-11-10T09:00:00',
      endDate: '2023-11-10T12:00:00',
      location: '校园主广场',
      capacity: 30,
      currentParticipants: 15,
      credits: 1.5,
      isRegistered: false
    },
    {
      id: 2,
      title: '学术讲座：人工智能与未来',
      description: '探讨AI技术发展及未来趋势',
      type: 'lecture',
      status: '进行中',
      startDate: '2023-11-05T14:00:00',
      endDate: '2023-11-05T16:00:00',
      location: '图书馆报告厅',
      capacity: 100,
      currentParticipants: 78,
      credits: 1.0,
      isRegistered: true,
      registrationStatus: '已报名'
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
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="div" gutterBottom>
            {activity.title}
          </Typography>
          <Chip 
            label={activity.status} 
            color={getStatusColor(activity.status)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {activity.type === 'suketuo' ? '素拓活动' :
           activity.type === 'lecture' ? '讲座活动' :
           activity.type === 'volunteer' ? '志愿服务' :
           activity.type === 'competition' ? '竞赛活动' : '其他活动'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>地点：</strong>{activity.location}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>时间：</strong>
          {format(new Date(activity.startDate), 'yyyy-MM-dd HH:mm')} 至 {format(new Date(activity.endDate), 'yyyy-MM-dd HH:mm')}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>可获学分：</strong>{activity.credits}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>名额：</strong>{activity.currentParticipants}/{activity.capacity}
        </Typography>
        
        {activity.isRegistered && activity.registrationStatus && (
          <Chip 
            label={activity.registrationStatus} 
            color={getRegistrationStatusColor(activity.registrationStatus)}
            size="small"
            sx={{ mb: 2 }}
          />
        )}
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
      onClose={() => !registrationLoading && setOpenDialog(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedActivity && (
        <>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{selectedActivity.title}</Typography>
              <Chip 
                label={selectedActivity.status} 
                color={getStatusColor(selectedActivity.status)}
              />
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={2}>
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
                  
                  <Typography variant="body2">
                    <strong>主办方：</strong>{selectedActivity.organizer?.name || '未知'}
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
                    报名信息
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>参与名额：</strong>{selectedActivity.currentParticipants}/{selectedActivity.capacity}
                  </Typography>
                  
                  {selectedActivity.isRegistered && selectedActivity.registrationStatus && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>您的状态：</strong>
                      </Typography>
                      <Chip 
                        label={selectedActivity.registrationStatus} 
                        color={getRegistrationStatusColor(selectedActivity.registrationStatus)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
                  
                  {registrationMessage.text && (
                    <Alert 
                      severity={registrationMessage.type} 
                      sx={{ mt: 2, mb: 1 }}
                    >
                      {registrationMessage.text}
                    </Alert>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={() => setOpenDialog(false)} 
              disabled={registrationLoading}
            >
              关闭
            </Button>
            
            {selectedActivity.status !== '已结束' && selectedActivity.status !== '已取消' && (
              selectedActivity.isRegistered ? (
                <Button 
                  onClick={() => handleCancelRegistration(selectedActivity.id)} 
                  color="error" 
                  variant="contained"
                  disabled={registrationLoading || selectedActivity.registrationStatus === '已取消'}
                >
                  {registrationLoading ? <CircularProgress size={24} /> : '取消报名'}
                </Button>
              ) : (
                <Button 
                  onClick={() => handleRegister(selectedActivity.id)} 
                  color="primary" 
                  variant="contained"
                  disabled={
                    registrationLoading || 
                    selectedActivity.currentParticipants >= selectedActivity.capacity
                  }
                >
                  {registrationLoading ? <CircularProgress size={24} /> : '立即报名'}
                </Button>
              )
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        活动列表
      </Typography>
      
      {/* 筛选条件 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              name="search"
              label="搜索活动"
              variant="outlined"
              fullWidth
              size="small"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </Grid>
          
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>活动类型</InputLabel>
              <Select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                label="活动类型"
              >
                <MenuItem value="">全部类型</MenuItem>
                <MenuItem value="suketuo">素拓活动</MenuItem>
                <MenuItem value="lecture">讲座活动</MenuItem>
                <MenuItem value="volunteer">志愿服务</MenuItem>
                <MenuItem value="competition">竞赛活动</MenuItem>
                <MenuItem value="other">其他活动</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>活动状态</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="活动状态"
              >
                <MenuItem value="">全部状态</MenuItem>
                <MenuItem value="未开始">未开始</MenuItem>
                <MenuItem value="进行中">进行中</MenuItem>
                <MenuItem value="已结束">已结束</MenuItem>
                <MenuItem value="已取消">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
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
          未找到符合条件的活动，请尝试调整筛选条件
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

export default ActivityList; 