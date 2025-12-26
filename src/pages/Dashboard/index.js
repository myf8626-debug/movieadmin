import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, Avatar, Space } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { getNewsList, getMovieList, getCategoryList, getCurrentUserInfo, getAdminStatistics } from '../../utils/api';
import { getRoleDisplayName, getRoleColor } from '../../utils/roleUtils';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import './index.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    newsCount: 0,
    movieCount: 0,
    userCount: 0,
    categoryData: [],
    topMovies: [],
  });
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  
  // 判断是否为管理员
  const isAdmin = userInfo?.role === 'ADMIN';

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
      const response = await getAdminStatistics();
      if (response.code === 200) {
        // 确保分类数据按ID升序排序，并打印调试信息
        const categoryData = (response.data.categoryData || []).sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idA - idB;
        });
        // 调试：打印分类数据，检查图标字段
        console.log('分类数据（含图标）:', categoryData.map(cat => ({ 
          id: cat.id, 
          name: cat.name, 
          icon: cat.icon,
          iconType: typeof cat.icon,
          hasIcon: !!cat.icon
        })));
        setStats({
          newsCount: response.data.newsCount || 0,
          movieCount: response.data.movieCount || 0,
          userCount: response.data.userCount || 0,
          categoryData: categoryData,
          topMovies: response.data.topMovies || [],
        });
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
      // 如果统计接口失败，使用旧方法
      try {
        const [newsRes, movieRes, categoryRes] = await Promise.all([
          getNewsList({ page: 0, size: 1 }),
          getMovieList({ page: 0, size: 1 }),
          getCategoryList(),
        ]);
        setStats({
          newsCount: newsRes.data?.totalElements || 0,
          movieCount: movieRes.data?.totalElements || 0,
          userCount: 0,
          categoryData: [],
          topMovies: [],
        });
      } catch (e) {
        console.error('获取统计数据失败', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '电影总数',
      value: stats.movieCount,
      icon: <VideoCameraOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      color: '#1890ff',
      onClick: () => navigate('/movies'),
    },
    {
      title: '用户总数',
      value: stats.userCount,
      icon: <UserOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#52c41a',
      onClick: () => navigate('/profile'),
    },
    {
      title: '新闻总数',
      value: stats.newsCount,
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#faad14',
      onClick: () => navigate(isAdmin ? '/news' : '/news-center'),
    },
  ];

  // 获取图标组件
  const getIconComponent = (iconName) => {
    if (!iconName || typeof iconName !== 'string') {
      console.log('图标名称为空或不是字符串:', iconName);
      return null;
    }
    const trimmedName = iconName.trim();
    if (!trimmedName) {
      console.log('图标名称去除空格后为空:', iconName);
      return null;
    }
    
    // 先尝试直接查找
    let IconComponent = Icons[trimmedName];
    if (IconComponent) {
      return IconComponent;
    }
    
    // 如果没有找到且不包含后缀，尝试添加Outlined后缀
    if (!trimmedName.endsWith('Outlined') && !trimmedName.endsWith('Filled') && !trimmedName.endsWith('TwoTone')) {
      IconComponent = Icons[`${trimmedName}Outlined`];
      if (IconComponent) {
        return IconComponent;
      }
    }
    
    console.log('未找到图标组件:', trimmedName, '可用图标示例:', Object.keys(Icons).slice(0, 5));
    return null;
  };

  // 饼状图配置 - 电影分类占比
  const pieChartOption = {
    title: {
      text: '电影分类占比',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      show: true, // 确保图例显示
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      formatter: (name) => {
        const category = stats.categoryData.find(item => item.name === name);
        if (category && category.icon) {
          const IconComponent = getIconComponent(category.icon);
          if (IconComponent) {
            return `{icon|${name}}`;
          }
        }
        return name;
      },
      textStyle: {
        fontSize: 12,
        rich: {
          icon: {
            padding: [0, 4, 0, 0],
          },
        },
      },
    },
    series: [
      {
        name: '电影数量',
        type: 'pie',
        radius: '50%',
        data: stats.categoryData.map(item => ({
          value: item.count,
          name: item.name,
          categoryId: item.id,
          icon: item.icon,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  // 饼图点击事件
  const onPieChartClick = (params) => {
    if (params && params.data && params.data.categoryId) {
      // 跳转到电影列表页面，并筛选该分类
      navigate(`/movies?categoryId=${params.data.categoryId}`);
    }
  };

  // 柱状图配置 - 浏览量最高的5部电影
  const barChartOption = {
    title: {
      text: '浏览量最高的5部电影',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params) => {
        if (params && params.length > 0) {
          const param = params[0];
          const movie = stats.topMovies[param.dataIndex];
          return `${movie.title}<br/>浏览量: ${param.value}`;
        }
        return '';
      },
    },
    xAxis: {
      type: 'category',
      data: stats.topMovies.map(movie => movie.title),
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      name: '浏览量',
    },
    series: [
      {
        name: '浏览量',
        type: 'bar',
        data: stats.topMovies.map((movie) => movie.viewCount),
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  };

  // 柱状图点击事件
  const onBarChartClick = (params) => {
    if (params && params.dataIndex !== undefined) {
      // 点击柱状图
      const movie = stats.topMovies[params.dataIndex];
      if (movie && movie.id) {
        navigate(`/movies/detail/${movie.id}`);
      }
    } else if (params && params.name) {
      // 点击x轴标签
      const movie = stats.topMovies.find(m => m.title === params.name);
      if (movie && movie.id) {
        navigate(`/movies/detail/${movie.id}`);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h2 className="page-title">{isAdmin ? '系统概览' : '数据统计'}</h2>
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
                style={{ cursor: 'pointer', textAlign: 'center', borderRadius: '16px' }}
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.icon}
                  valueStyle={{ color: card.color, fontSize: 32 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 数据可视化图表 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} lg={12}>
            <Card title="电影分类占比" style={{ borderRadius: '16px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <ReactECharts
                    option={pieChartOption}
                    style={{ height: '400px' }}
                    opts={{ renderer: 'svg' }}
                    onEvents={{
                      click: onPieChartClick,
                    }}
                  />
                </div>
                <div style={{ width: '120px', paddingTop: '20px' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {stats.categoryData.map((category) => {
                      // 获取分类图标 - 直接从Icons对象查找
                      const iconName = category.icon;
                      
                      let IconComponent = null;
                      if (iconName) {
                        // 转换为字符串并去除空格
                        const trimmedName = String(iconName).trim();
                        if (trimmedName) {
                          // 先尝试直接查找
                          IconComponent = Icons[trimmedName];
                          // 如果找不到且不包含后缀，尝试添加Outlined后缀
                          if (!IconComponent && !trimmedName.endsWith('Outlined') && !trimmedName.endsWith('Filled') && !trimmedName.endsWith('TwoTone')) {
                            IconComponent = Icons[`${trimmedName}Outlined`];
                          }
                          // 如果还是找不到，尝试其他常见后缀
                          if (!IconComponent) {
                            IconComponent = Icons[`${trimmedName}Filled`] || Icons[`${trimmedName}TwoTone`];
                          }
                        }
                      }
                      
                      return (
                        <div key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: 24 }}>
                          {IconComponent ? (
                            React.createElement(IconComponent, { 
                              style: { fontSize: 20, color: '#1890ff' } 
                            })
                          ) : null}
                          <span style={{ fontSize: '12px', flex: 1 }}>{category.name}</span>
                        </div>
                      );
                    })}
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="热门电影" style={{ borderRadius: '16px' }}>
              <ReactECharts
                option={barChartOption}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
                onEvents={{
                  click: onBarChartClick,
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 快速操作 - 根据角色显示不同操作 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="快速操作" className="quick-actions-card" style={{ marginBottom: 0 }}>
              <div className="quick-actions">
                {isAdmin ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <Card.Grid
                      className="action-item"
                      hoverable
                      onClick={() => navigate('/movies')}
                    >
                      <VideoCameraOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      <div>浏览电影</div>
                    </Card.Grid>
                    <Card.Grid
                      className="action-item"
                      hoverable
                      onClick={() => navigate('/news-center')}
                    >
                      <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      <div>新闻资讯</div>
                    </Card.Grid>
                    <Card.Grid
                      className="action-item"
                      hoverable
                      onClick={() => navigate('/favorites')}
                    >
                      <HeartOutlined style={{ fontSize: 24, color: '#faad14' }} />
                      <div>我的收藏</div>
                    </Card.Grid>
                    <Card.Grid
                      className="action-item"
                      hoverable
                      onClick={() => navigate('/profile')}
                    >
                      <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                      <div>个人中心</div>
                    </Card.Grid>
                  </>
                )}
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

