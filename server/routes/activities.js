const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');

// 暂时使用内联函数，而不是控制器
// 获取所有活动
router.get('/', auth, (req, res) => {
  res.status(200).json({ message: '获取活动列表功能待实现' });
});

// 获取单个活动详情
router.get('/:id', auth, (req, res) => {
  res.status(200).json({ message: '获取活动详情功能待实现' });
});

// 创建新活动
router.post('/', auth, (req, res) => {
  res.status(201).json({ message: '创建活动功能待实现' });
});

// 更新活动
router.put('/:id', auth, (req, res) => {
  res.status(200).json({ message: '更新活动功能待实现' });
});

// 删除活动
router.delete('/:id', auth, (req, res) => {
  res.status(200).json({ message: '删除活动功能待实现' });
});

module.exports = router; 