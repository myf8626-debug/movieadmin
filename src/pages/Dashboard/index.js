import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, Avatar } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { getNewsList, getMovieList, getCategoryList, getCurrentUserInfo } from '../../utils/api';
import { getRoleDisplayName, getRoleColor } from '../../utils/roleUtils';
import { useNavigate } from 'react-router-dom';
import './index.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    newsCount: 0,
    movieCount: 0,
    categoryCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await getCurrentUserInfo();
      if (response.code === 200) {
        setUserInfo(response.data);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [newsRes, movieRes, categoryRes] = await Promise.all([
        getNewsList({ page: 0, size: 1 }),
        getMovieList({ page: 0, size: 1 }),
        getCategoryList(),
      ]);

      setStats({
        newsCount: newsRes.data?.totalElements || 0,
        movieCount: movieRes.data?.totalElements || 0,
        categoryCount: categoryRes.data?.length || 0,
      });
    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '新闻总数',
      value: stats.newsCount,
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      color: '#1890ff',
      onClick: () => navigate('/news'),
    },
    {
      title: '影片总数',
      value: stats.movieCount,
      icon: <VideoCameraOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#52c41a',
      onClick: () => navigate('/movies'),
    },
    {
      title: '分类总数',
      value: stats.categoryCount,
      icon: <AppstoreOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#faad14',
      onClick: () => navigate('/categories'),
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h2 className="page-title">系统概览</h2>
      </div>
      <div className="page-content" style={{ padding: 0 }}>
        {/* 欢迎卡片 */}
        <Card className="welcome-card" style={{ marginBottom: 20, borderRadius: '20px' }}>
          <div className="welcome-content">
            <Avatar size={64} icon={<UserOutlined />} />
            <div className="welcome-text">
              <h2>欢迎回来，{userInfo?.realName || userInfo?.username || '用户'}！</h2>
              <p>今天是 {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}</p>
            </div>
          </div>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {statCards.map((card, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                hoverable
                onClick={card.onClick}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.icon}
                  valueStyle={{ color: card.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 快速操作 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="快速操作" className="quick-actions-card" style={{ marginBottom: 0 }}>
              <div className="quick-actions">
                <Card.Grid
                  className="action-item"
                  hoverable
                  onClick={() => navigate('/news/create')}
                >
                  <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div>发布新闻</div>
                </Card.Grid>
                <Card.Grid
                  className="action-item"
                  hoverable
                  onClick={() => navigate('/movies/create')}
                >
                  <VideoCameraOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div>上传影片</div>
                </Card.Grid>
                <Card.Grid
                  className="action-item"
                  hoverable
                  onClick={() => navigate('/categories')}
                >
                  <AppstoreOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  <div>管理分类</div>
                </Card.Grid>
                <Card.Grid
                  className="action-item"
                  hoverable
                  onClick={() => navigate('/profile')}
                >
                  <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>个人中心</div>
                </Card.Grid>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="系统信息" className="system-info-card" style={{ marginBottom: 0 }}>
              <div className="system-info">
                <div className="info-item">
                  <span className="info-label">当前用户：</span>
                  <Tag color={getRoleColor(userInfo?.role)}>
                    {userInfo?.username}
                  </Tag>
                </div>
                <div className="info-item">
                  <span className="info-label">用户角色：</span>
                  <Tag color={getRoleColor(userInfo?.role)}>
                    {getRoleDisplayName(userInfo?.role)}
                  </Tag>
                </div>
                <div className="info-item">
                  <span className="info-label">系统时间：</span>
                  <span>{new Date().toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;

