import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../../utils/api';
import './index.css';

const { TabPane } = Tabs;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 切换标签页时清空表单
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'login') {
      loginForm.resetFields();
    } else {
      registerForm.resetFields();
    }
  };

  const onLoginFinish = async (values) => {
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

  const onRegisterFinish = async (values) => {
    // 验证密码确认
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        realName: values.realName,
        email: values.email,
      });
      
      if (response && response.code === 200) {
        message.success('注册成功，请登录');
        // 切换到登录标签页
        setActiveTab('login');
        // 填充用户名
        loginForm.setFieldsValue({ username: values.username });
        // 清空注册表单
        registerForm.resetFields();
      } else {
        message.error(response?.message || '注册失败');
      }
    } catch (error) {
      console.error('注册错误详情:', error);
      const errorMessage = error.response?.data?.message || error.message || '注册失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          centered
          size="large"
        >
          <TabPane tab="登录" key="login">
            <Form
              form={loginForm}
              name="userLoginForm"
              onFinish={onLoginFinish}
              autoComplete="off"
              size="large"
            >
              {/* 隐藏的假输入框，用于欺骗浏览器自动填充 */}
              <input
                type="text"
                name="fakeUsername"
                autoComplete="username"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
                readOnly
              />
              <input
                type="password"
                name="fakePassword"
                autoComplete="current-password"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                tabIndex={-1}
                readOnly
              />
              
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-form-type="other"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  autoComplete="off"
                  data-form-type="other"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="注册" key="register">
            <Form
              form={registerForm}
              name="userRegisterForm"
              onFinish={onRegisterFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名!' },
                  { min: 3, message: '用户名至少3个字符!' },
                  { max: 50, message: '用户名最多50个字符!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="用户名（3-50个字符）"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-form-type="other"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码!' },
                  { min: 6, message: '密码至少6个字符!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码（至少6个字符）"
                  autoComplete="off"
                  data-form-type="other"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                  autoComplete="off"
                  data-form-type="other"
                />
              </Form.Item>

              <Form.Item
                name="realName"
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="真实姓名（可选）"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="邮箱（可选）"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;





