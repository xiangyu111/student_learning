const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    allowNull: false,
    defaultValue: 'student'
  },
  studentId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true
  },
  teacherId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  major: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  class: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  suketuoCredits: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  lectureCredits: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  volunteerCredits: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 验证密码方法
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User; 