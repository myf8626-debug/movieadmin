import React, { useState, useEffect } from 'react';
import { Card, List, Empty, message, Button, Row, Col, Pagination } from 'antd';
import { VideoCameraOutlined, EyeOutlined, HeartFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFavoriteMovies, toggleFavorite } from '../../utils/api';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';
import './index.css';

const Favorites = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites(1);
  }, []);

  const fetchFavorites = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getFavoriteMovies({
        page: page - 1, // 后端使用0-based分页
        size: pagination.pageSize,
      });
      if (response && response.code === 200) {
        setMovies(response.data.content || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.totalElements || 0,
        }));
      } else {
        message.error(response?.message || '获取收藏列表失败');
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      // 处理不同类型的错误
      if (error.response) {
        // axios 错误响应
        if (error.response.status === 401) {
          message.error('请先登录');
        } else if (error.response.data?.message) {
          message.error(error.response.data.message);
        } else {
          message.error('获取收藏列表失败');
        }
      } else if (error.message) {
        // 响应拦截器 reject 的错误
        message.error(error.message);
      } else {
        message.error('获取收藏列表失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movies/detail/${movieId}`);
  };

  const handleToggleFavorite = async (movieId, e) => {
    e.stopPropagation();
    
    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('请先登录');
      return;
    }
    
    // 获取用户信息用于调试
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || user?.userId;
    
    // 调试日志：检查参数
    console.log('收藏操作 - User:', userId, 'Movie:', movieId);
    
    try {
      // 修复：传递正确的参数格式 { movieId: movieId }
      const response = await toggleFavorite({ movieId: movieId });
      console.log('收藏响应:', response);
      
      if (response.code === 200) {
        const newStatus = Boolean(response.data?.isFavorited);
        console.log('新的收藏状态:', newStatus);
        
        message.success(newStatus ? '收藏成功' : '取消收藏成功');
        
        // 如果取消收藏，从列表中移除
        if (!newStatus) {
          setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
          setPagination(prev => ({
            ...prev,
            total: prev.total - 1,
          }));
        } else {
          // 如果收藏，更新状态
          setMovies(prevMovies =>
            prevMovies.map(movie =>
              movie.id === movieId ? { ...movie, isFavorited: newStatus } : movie
            )
          );
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error(error.response?.data?.message || error.message || '操作失败');
    }
  };

  return (
    <div className="favorites-container">
      <div className="page-header">
        <h2 className="page-title">我的收藏</h2>
      </div>
      <div className="page-content">
        {movies.length === 0 && !loading ? (
          <Card>
            <Empty description="暂无收藏的电影" />
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {movies.map((movie) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={6} key={movie.id}>
                  <Card
                    hoverable
                    loading={loading}
                    onClick={(e) => {
                      // 如果点击的是按钮或操作区域，不跳转
                      if (e.target.closest('.ant-card-actions') || 
                          e.target.closest('button')) {
                        return;
                      }
                      handleMovieClick(movie.id);
                    }}
                    style={{ cursor: 'pointer' }}
                    cover={
                      movie.coverImage ? (
                        <div style={{ height: 300, overflow: 'hidden' }}>
                          <img
                            alt={movie.title}
                            src={movie.coverImage}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleMovieClick(movie.id)}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5rOV5Zu+54mHPC90ZXh0Pjwvc3ZnPg==';
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 300,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f0f0f0',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleMovieClick(movie.id)}
                        >
                          <VideoCameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
                        </div>
                      )
                    }
                    actions={[
                      <Button
                        type="text"
                        icon={<HeartFilled style={{ color: '#ff4d4f', fontSize: 18 }} />}
                        onClick={(e) => handleToggleFavorite(movie.id, e)}
                        title="取消收藏"
                      />,
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMovieClick(movie.id);
                        }}
                      >
                        查看详情
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <span 
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovieClick(movie.id);
                          }}
                        >
                          {movie.title}
                        </span>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            {movie.categoryName && (
                              <span style={{ color: '#1890ff', fontSize: 12 }}>{movie.categoryName}</span>
                            )}
                            {movie.rating && (
                              <span style={{ marginLeft: 8, fontSize: 12, color: '#faad14' }}>
                                评分: {movie.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {movie.director && <span>导演: {movie.director}</span>}
                            <span style={{ marginLeft: 12 }}>
                              观看: {movie.viewCount || 0}
                            </span>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            {pagination.total > 0 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showTotal={(total) => `共 ${total} 条`}
                  showSizeChanger
                  showQuickJumper
                  onChange={(page) => fetchFavorites(page)}
                  onShowSizeChange={(current, size) => {
                    setPagination(prev => ({ ...prev, pageSize: size }));
                    fetchFavorites(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;



