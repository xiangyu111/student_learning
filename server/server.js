const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件目录 - 用于上传的文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const activityRoutes = require('./routes/activities');
const creditRoutes = require('./routes/credits');
const suketuoRoutes = require('./routes/suketuo');
const lectureRoutes = require('./routes/lectures');
const volunteerRoutes = require('./routes/volunteer');
const analysisRoutes = require('./routes/analysis');
const reportRoutes = require('./routes/reports');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/suketuo', suketuoRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// 设置端口并启动服务器
const PORT = process.env.PORT || 5000;

// 测试数据库连接并同步模型
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  })
  .catch(err => {
    console.error('无法连接到数据库:', err);
  }); 