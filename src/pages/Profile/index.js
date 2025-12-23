import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Avatar, Descriptions, Tag } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { getCurrentUserInfo, updateUserInfo, changePassword } from '../../utils/api';
import { getRoleDisplayName, getRoleColor } from '../../utils/roleUtils';
import dayjs from 'dayjs';
import './index.css';

const Profile = () => {
  const [userInfoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await getCurrentUserInfo();
      if (response.code === 200) {
        const user = response.data;
        setUserInfo(user);
        userInfoForm.setFieldsValue({
          username: user.username,
          realName: user.realName,
          email: user.email,
        });
      }
    } catch (error) {
      message.error('获取用户信息失败');
    }
  };

  const handleUpdateUserInfo = async (values) => {
    setLoading(true);
    try {
      const response = await updateUserInfo(values);
      if (response.code === 200) {
        message.success('个人信息更新成功');
        // 更新localStorage中的用户信息
        const updatedUser = response.data;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // 刷新页面数据
        await fetchUserInfo();
        // 刷新页面以更新导航栏
        window.location.reload();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('新密码和确认密码不一致');
      return;
    }

    if (values.newPassword.length < 6) {
      message.error('新密码长度不能少于6位');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      if (response.code === 200) {
        message.success('密码修改成功，请重新登录');
        passwordForm.resetFields();
        // 延迟跳转到登录页
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      message.error(error.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="page-header">
        <h2 className="page-title">个人中心</h2>
      </div>
      <div className="page-content">
        <Card style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
          <Tabs
            defaultActiveKey="info"
            size="large"
            items={[
              {
                key: 'info',
                label: (
                  <span>
                    <UserOutlined />
                    个人信息
                  </span>
                ),
                children: (
              <div className="profile-section">
                <div className="profile-header">
                  <Avatar size={80} icon={<UserOutlined />} />
                  <div className="profile-basic-info">
                    <h3>{userInfo?.realName || userInfo?.username || '用户'}</h3>
                    <Tag color={getRoleColor(userInfo?.role)}>
                      {getRoleDisplayName(userInfo?.role)}
                    </Tag>
                  </div>
                </div>

                <Descriptions title="账户信息" bordered column={1} style={{ marginTop: 24 }}>
                  <Descriptions.Item label="用户名">{userInfo?.username}</Descriptions.Item>
                  <Descriptions.Item label="真实姓名">{userInfo?.realName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{userInfo?.email || '-'}</Descriptions.Item>
                  <Descriptions.Item label="角色">
                    <Tag color={getRoleColor(userInfo?.role)}>
                      {getRoleDisplayName(userInfo?.role)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {userInfo?.createTime ? dayjs(userInfo.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后更新">
                    {userInfo?.updateTime ? dayjs(userInfo.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                </Descriptions>

                <Form
                  form={userInfoForm}
                  layout="vertical"
                  onFinish={handleUpdateUserInfo}
                  style={{ marginTop: 24 }}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入用户名!' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                  </Form.Item>

                  <Form.Item
                    name="realName"
                    label="真实姓名"
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { type: 'email', message: '请输入正确的邮箱地址!' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </div>
                ),
              },
              {
                key: 'password',
                label: (
                  <span>
                    <LockOutlined />
                    修改密码
                  </span>
                ),
                children: (
              <div className="profile-section">
                <Card 
                  title="修改密码" 
                  style={{ 
                    maxWidth: 600, 
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    borderRadius: '16px'
                  }}
                >
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                  >
                    <Form.Item
                      name="oldPassword"
                      label="原密码"
                      rules={[{ required: true, message: '请输入原密码!' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请输入原密码"
                      />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="新密码"
                      rules={[
                        { required: true, message: '请输入新密码!' },
                        { min: 6, message: '密码长度不能少于6位!' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请输入新密码（至少6位）"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="确认新密码"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: '请再次输入新密码!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="请再次输入新密码"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={passwordLoading}>
                        修改密码
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default Profile;

