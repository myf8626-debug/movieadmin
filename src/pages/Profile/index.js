import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Avatar, Descriptions, Tag, Row, Col, Statistic, Empty } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined, HeartOutlined, EyeOutlined, CalendarOutlined, TagOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserInfo, updateUserInfo, changePassword, getFavoriteList } from '../../utils/api';
import { getRoleDisplayName, getRoleColor } from '../../utils/roleUtils';
import dayjs from 'dayjs';
import './index.css';

const Profile = () => {
  const [userInfoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [recentFavorites, setRecentFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
    fetchRecentFavorites();
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

  const fetchRecentFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const response = await getFavoriteList();
      if (response.code === 200) {
        // 取前4条数据
        const favorites = response.data || [];
        setRecentFavorites(favorites.slice(0, 4));
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      // 不显示错误提示，因为这是预览功能
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/detail/${movieId}`);
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

                {/* 数据统计栏 */}
                <Card 
                  style={{ 
                    marginTop: 24, 
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Card 
                        bordered={false}
                        style={{ 
                          textAlign: 'center',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%)',
                          color: '#fff'
                        }}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <Statistic
                          title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>收藏影片</span>}
                          value={userInfo?.favoriteCount || 0}
                          prefix={<HeartOutlined style={{ color: '#fff' }} />}
                          valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card 
                        bordered={false}
                        style={{ 
                          textAlign: 'center',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                          color: '#fff'
                        }}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <Statistic
                          title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>累计浏览</span>}
                          value={userInfo?.totalViews || 0}
                          prefix={<EyeOutlined style={{ color: '#fff' }} />}
                          valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card 
                        bordered={false}
                        style={{ 
                          textAlign: 'center',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #A8E6CF 0%, #88D8A3 100%)',
                          color: '#fff'
                        }}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <Statistic
                          title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>入驻天数</span>}
                          value={userInfo?.daysSinceRegistration || 0}
                          suffix={<span style={{ fontSize: '16px' }}>天</span>}
                          prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                          valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card 
                        bordered={false}
                        style={{ 
                          textAlign: 'center',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #FFD93D 0%, #FFB347 100%)',
                          color: '#fff'
                        }}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <TagOutlined style={{ color: '#fff', fontSize: '20px' }} />
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                          身份标签
                        </div>
                        <Tag 
                          color={getRoleColor(userInfo?.role)}
                          style={{ 
                            fontSize: '16px',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                          {getRoleDisplayName(userInfo?.role)}
                        </Tag>
                      </Card>
                    </Col>
                  </Row>
                </Card>

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

                {/* 最近收藏预览 */}
                <Card 
                  title="最近收藏"
                  style={{ 
                    marginTop: 24, 
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  {favoritesLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>加载中...</div>
                  ) : recentFavorites.length === 0 ? (
                    <Empty 
                      description="暂无收藏，快去探索吧" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ padding: '40px 0' }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d4d4d4 transparent'
                      }}
                      className="recent-favorites-scroll"
                    >
                      {recentFavorites.map((movie) => (
                        <Card
                          key={movie.id}
                          hoverable
                          onClick={() => handleMovieClick(movie.id)}
                          style={{ 
                            minWidth: '180px',
                            maxWidth: '180px',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.3s ease'
                          }}
                          bodyStyle={{ padding: '12px' }}
                          cover={
                            movie.coverImage ? (
                              <div style={{ height: '240px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                                <img
                                  alt={movie.title}
                                  src={movie.coverImage}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5rOV5Zu+54mHPC90ZXh0Pjwvc3ZnPg==';
                                    e.target.onerror = null;
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  height: '240px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#f0f0f0',
                                }}
                              >
                                <VideoCameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
                              </div>
                            )
                          }
                        >
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            color: '#000',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'center'
                          }}>
                            {movie.title}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
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

