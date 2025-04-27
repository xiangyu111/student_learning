const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');

// 此处应引入analysis控制器，但目前未创建
// const analysisController = require('../controllers/analysis');

// 通用分析数据路由 - 匹配前端的 /api/analysis 请求
router.get('/', auth, (req, res) => {
  // 返回模拟的分析数据
  res.status(200).json({
    creditTrend: generateMockCreditTrend(),
    activityParticipation: generateMockActivityParticipation(),
    creditDistribution: {
      suketuo: 8.5,
      lecture: 4.0,
      volunteer: 2.5
    },
    recentActivities: generateMockRecentActivities()
  });
});

// 获取学生参与统计数据
router.get('/student-participation', auth, (req, res) => {
  res.status(200).json({ message: '获取学生参与统计数据功能待实现' });
});

// 获取活动类型统计
router.get('/activity-types', auth, (req, res) => {
  res.status(200).json({ message: '获取活动类型统计功能待实现' });
});

// 获取学分累积统计
router.get('/credit-accumulation', auth, (req, res) => {
  res.status(200).json({ message: '获取学分累积统计功能待实现' });
});

// 模拟数据生成函数
function generateMockCreditTrend() {
  const months = [];
  const suketuo = [];
  const lecture = [];
  const volunteer = [];
  const total = [];

  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthStr);
    
    const suketuoValue = parseFloat((Math.random() * 2).toFixed(1));
    const lectureValue = parseFloat((Math.random() * 1.5).toFixed(1));
    const volunteerValue = parseFloat((Math.random() * 1).toFixed(1));
    
    suketuo.push(suketuoValue);
    lecture.push(lectureValue);
    volunteer.push(volunteerValue);
    total.push(parseFloat((suketuoValue + lectureValue + volunteerValue).toFixed(1)));
  }

  return { months, suketuo, lecture, volunteer, total };
}

function generateMockActivityParticipation() {
  return [
    { name: '素拓活动', value: 15 },
    { name: '讲座', value: 8 },
    { name: '志愿服务', value: 5 },
    { name: '竞赛', value: 3 }
  ];
}

function generateMockRecentActivities() {
  const activities = [];
  for (let i = 1; i <= 5; i++) {
    activities.push({
      id: i,
      title: `活动${i}`,
      type: i % 3 === 0 ? '讲座' : i % 3 === 1 ? '素拓' : '志愿服务',
      date: new Date(new Date().setDate(new Date().getDate() - i * 5)).toISOString().split('T')[0],
      credits: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
      status: i === 1 ? '进行中' : '已完成'
    });
  }
  return activities;
}

module.exports = router; 