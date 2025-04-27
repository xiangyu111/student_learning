const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Discussion = sequelize.define('Discussion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '讨论主题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '讨论内容'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '发起人ID'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '讨论分类'
  },
  tags: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '标签，多个用英文逗号分隔'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '浏览次数'
  },
  replyCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '回复次数'
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '附件路径，多个用英文逗号分隔'
  },
  isSticky: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否置顶'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否锁定（禁止回复）'
  },
  lastReplyTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后回复时间'
  },
  lastReplyUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    comment: '最后回复用户ID'
  }
});

// 创建回复模型
const DiscussionReply = sequelize.define('DiscussionReply', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  discussionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Discussion,
      key: 'id'
    },
    comment: '关联的讨论ID'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '回复内容'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '回复用户ID'
  },
  parentReplyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'discussion_replies',
      key: 'id'
    },
    comment: '父回复ID，用于回复嵌套'
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否被采纳为最佳回复'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '点赞数'
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '附件路径，多个用英文逗号分隔'
  }
});

// 建立关联
Discussion.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'author'
});

Discussion.belongsTo(User, { 
  foreignKey: 'lastReplyUserId',
  as: 'lastReplier'
});

Discussion.hasMany(DiscussionReply, {
  foreignKey: 'discussionId',
  as: 'replies'
});

DiscussionReply.belongsTo(Discussion, {
  foreignKey: 'discussionId',
  as: 'discussion'
});

DiscussionReply.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

DiscussionReply.belongsTo(DiscussionReply, {
  foreignKey: 'parentReplyId',
  as: 'parentReply'
});

DiscussionReply.hasMany(DiscussionReply, {
  foreignKey: 'parentReplyId',
  as: 'childReplies'
});

module.exports = { Discussion, DiscussionReply }; 