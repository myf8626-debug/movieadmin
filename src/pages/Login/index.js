import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../../utils/api';
import './index.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    console.log('开始登录，用户名:', values.username);
    try {
      const response = await login(values);
      console.log('登录响应:', response);
      if (response && response.code === 200 && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('登录成功');
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        console.error('登录响应格式错误:', response);
        message.error(response?.message || '登录失败，响应格式错误');
      }
    } catch (error) {
      console.error('登录错误详情:', error);
      console.error('错误响应:', error.response);
      const errorMessage = error.response?.data?.message || error.message || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="电影后台管理系统">
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className="login-tip">
          <p>默认账号：movieadmin / admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;





