import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Tag, message, Input, List, Avatar, Space, Typography, Popconfirm, Modal } from 'antd';
import { HeartOutlined, HeartFilled, ArrowLeftOutlined, UserOutlined, VideoCameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMovieById, createComment, getCommentsByMovie, toggleFavorite, checkFavorite, deleteComment, getCurrentUserInfo } from '../../utils/api';
import MoviePlayer from '../../components/MoviePlayer/MoviePlayer';
import dayjs from 'dayjs';
import './MovieDetail.css';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // 当前登录用户信息
  const [playerModalVisible, setPlayerModalVisible] = useState(false); // 播放器模态框显示状态

  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 当用户信息变化时，重新获取用户信息
  useEffect(() => {
    if (isLoggedIn && !currentUser) {
      checkLoginStatus();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchMovie();
    fetchComments();
  }, [id]);

  // 注意：收藏状态现在从 fetchMovie 中获取（后端返回的 isFavorited 字段）
  // 这个 useEffect 保留作为备用，但主要依赖 fetchMovie 中的设置
  useEffect(() => {
    // 如果 fetchMovie 还没有设置收藏状态，则使用 checkFavorite 作为备用
    // 但通常不需要，因为 fetchMovie 已经返回了收藏状态
    const token = localStorage.getItem('token');
    if (id && token && movie && movie.isFavorited === undefined) {
      // 只有在 movie 对象存在但 isFavorited 未定义时才查询
      checkFavorite(id).then(res => {
        if (res.code === 200) {
          setIsFavorited(Boolean(res.data.isFavorited));
        }
      }).catch(err => {
        console.error('获取收藏状态失败:', err);
        setIsFavorited(false);
      });
    } else if (!token) {
      // 如果没有 token，直接设置为未收藏
      setIsFavorited(false);
    }
  }, [id, movie]);

  const checkLoginStatus = async () => {
    const token = localStorage.getItem('token');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    
    // 如果已登录，获取当前用户信息
    if (token) {
      try {
        const response = await getCurrentUserInfo();
        if (response.code === 200) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error('获取用户信息失败', error);
      }
    }
  };

  const fetchMovie = async () => {
    setLoading(true);
    try {
      const response = await getMovieById(id);
      if (response.code === 200) {
        setMovie(response.data);
        
        // 使用后端返回的 isFavorited 字段（后端已经根据当前登录用户查询了收藏状态）
        if (response.data && response.data.isFavorited !== undefined) {
          setIsFavorited(Boolean(response.data.isFavorited));
          console.log('电影详情 - 使用后端返回的收藏状态:', {
            movieId: id,
            isFavorited: response.data.isFavorited,
            type: typeof response.data.isFavorited
          });
        }
      }
    } catch (error) {
      message.error('获取电影详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsByMovie(id);
      if (response.code === 200) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('获取评论失败', error);
    }
  };

  const handleToggleFavorite = async () => {
    // 双重检查：检查本地状态和 token
    const token = localStorage.getItem('token');
    if (!token || !isLoggedIn) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    // 获取用户信息用于调试
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || user?.userId;
    
    // 调试日志：检查参数
    console.log('收藏操作 - User:', userId, 'Movie:', id, 'CurrentStatus:', isFavorited);

    setFavoriteLoading(true);
    try {
      const response = await toggleFavorite({ movieId: id });
      console.log('收藏响应:', response);
      
      if (response.code === 200) {
        // 根据后端返回的 res.data.isFavorited 更新状态
        const favoriteStatus = Boolean(response.data?.isFavorited);
        console.log('新的收藏状态:', favoriteStatus);
        
        setIsFavorited(favoriteStatus);
        message.success(favoriteStatus ? '收藏成功' : '取消收藏成功');
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      // 显示后端返回的具体错误信息
      const errorMessage = error.message || error.response?.data?.message || '操作失败';
      
      // 如果是未登录错误，提示用户登录
      if (errorMessage.includes('未登录') || errorMessage.includes('请先登录')) {
        message.error('登录已过期，请重新登录');
        // 清除本地存储并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        message.error(errorMessage);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    if (!commentContent.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    setCommentLoading(true);
    try {
      const response = await createComment({
        movieId: parseInt(id),
        content: commentContent.trim(),
      });
      if (response.code === 200) {
        message.success('评论成功');
        setCommentContent('');
        fetchComments();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '评论失败');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      console.log('删除评论 - 评论ID:', commentId);
      console.log('当前用户信息:', currentUser);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await deleteComment(commentId);
      console.log('删除评论响应:', response);
      
      if (response && response.code === 200) {
        message.success('删除成功');
        fetchComments(); // 刷新评论列表
      } else {
        message.error(response?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除评论错误详情:', error);
      console.error('错误响应:', error.response);
      console.error('错误状态码:', error.response?.status);
      console.error('错误数据:', error.response?.data);
      
      if (error.response?.status === 404) {
        message.error('接口不存在，请检查后端服务是否正常运行');
      } else if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || '删除失败';
        message.error(errorMessage);
      }
    }
  };

  // 判断是否可以删除评论
  const canDeleteComment = (comment) => {
    if (!isLoggedIn || !currentUser) {
      return false;
    }
    // 管理员可以删除所有评论，普通用户只能删除自己的评论
    const isAdmin = currentUser.role === 'ADMIN';
    // 比较用户名时去除空格，确保匹配
    const commentUsername = comment.username ? comment.username.trim() : '';
    const currentUsername = currentUser.username ? currentUser.username.trim() : '';
    const isOwner = commentUsername === currentUsername;
    
    console.log('权限检查 - 评论作者:', commentUsername, '当前用户:', currentUsername, '是管理员:', isAdmin, '是作者:', isOwner);
    
    return isAdmin || isOwner;
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>加载中...</div>;
  }

  if (!movie) {
    return <div style={{ padding: 20, textAlign: 'center' }}>电影不存在</div>;
  }

  return (
    <div className="movie-detail-container">
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => {
            // 尝试返回上一页，如果失败则返回到电影列表页
            try {
              // 检查是否有可返回的历史记录
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/movies');
              }
            } catch (error) {
              // 如果返回失败，返回到电影列表页
              navigate('/movies');
            }
          }}
        >
          返回
        </Button>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          {movie.title}
          <Button
            type="text"
            icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleToggleFavorite}
            loading={favoriteLoading}
            style={{
              color: isFavorited ? '#ff4d4f' : '#8c8c8c',
              fontSize: 24,
              padding: 0,
              height: 'auto',
            }}
          />
        </Title>
      </div>

      <div className="page-content">
        <Card>
          <div className="movie-info">
            <div className="movie-cover">
              {movie.coverImage ? (
                <img
                  src={movie.coverImage}
                  alt={movie.title}
                  onError={(e) => {
                    // 如果第一次加载失败，尝试使用备用URL
                    if (!e.target.dataset.retried) {
                      e.target.dataset.retried = 'true';
                      // 如果原URL包含代理服务，尝试直接访问原URL
                      if (e.target.src.includes('images.weserv.nl')) {
                        const originalUrl = e.target.src.split('url=')[1];
                        if (originalUrl) {
                          e.target.src = decodeURIComponent(originalUrl);
                          return;
                        }
                      }
                      const placeholderUrl = `https://via.placeholder.com/300x450?text=${encodeURIComponent(movie.title)}`;
                      e.target.src = placeholderUrl;
                    } else if (!e.target.dataset.retried2) {
                      // 如果备用URL也失败，使用base64占位符
                      e.target.dataset.retried2 = 'true';
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5rOV5Zu+54mHPC90ZXh0Pjwvc3ZnPg==';
                      e.target.onerror = null;
                    }
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 400,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                  }}
                >
                  <VideoCameraOutlined style={{ fontSize: 64, color: '#ccc' }} />
                </div>
              )}
            </div>
            <div className="movie-details">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">分类：</Text>
                  {movie.category && <Tag color="blue">{movie.category.name}</Tag>}
                </div>
                {movie.director && (
                  <div>
                    <Text type="secondary">导演：</Text>
                    <Text>{movie.director}</Text>
                  </div>
                )}
                {movie.actors && (
                  <div>
                    <Text type="secondary">演员：</Text>
                    <Text>{movie.actors}</Text>
                  </div>
                )}
                {movie.releaseDate && (
                  <div>
                    <Text type="secondary">上映日期：</Text>
                    <Text>{dayjs(movie.releaseDate).format('YYYY-MM-DD')}</Text>
                  </div>
                )}
                {movie.duration && (
                  <div>
                    <Text type="secondary">时长：</Text>
                    <Text>{movie.duration} 分钟</Text>
                  </div>
                )}
                <div>
                  <Text type="secondary">评分：</Text>
                  <Text strong style={{ color: '#faad14' }}>
                    {movie.rating?.toFixed(1) || '0.0'}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">观看次数：</Text>
                  <Text>{movie.viewCount || 0}</Text>
                </div>
                {movie.description && (
                  <div>
                    <Text type="secondary">简介：</Text>
                    <Paragraph>{movie.description}</Paragraph>
                  </div>
                )}
                <div>
                  {movie && (() => {
                    // 检查是否有有效的视频URL
                    const hasVideo = movie.videoUrl && 
                                    typeof movie.videoUrl === 'string' && 
                                    movie.videoUrl.trim() !== '' &&
                                    !movie.videoUrl.includes('search.bilibili.com');
                    
                    if (hasVideo) {
                      return (
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={() => {
                            setPlayerModalVisible(true);
                          }}
                        >
                          观看电影
                        </Button>
                      );
                    } else {
                      return (
                        <Button 
                          type="primary" 
                          size="large"
                          disabled
                          title="该影片暂无视频文件"
                        >
                          暂无视频
                        </Button>
                      );
                    }
                  })()}
                </div>
              </Space>
            </div>
          </div>
        </Card>

        <Card title="评论区" style={{ marginTop: 20 }}>
          {!isLoggedIn ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">请登录后评论</Text>
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <TextArea
                rows={4}
                placeholder="请输入您的评论..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                maxLength={500}
                showCount
              />
              <Button
                type="primary"
                onClick={handleSubmitComment}
                loading={commentLoading}
                style={{ marginTop: 12 }}
              >
                发表评论
              </Button>
            </div>
          )}

          <List
            dataSource={comments}
            locale={{ emptyText: '暂无评论' }}
            renderItem={(comment) => (
              <List.Item
                actions={
                  canDeleteComment(comment)
                    ? [
                        <Popconfirm
                          title="确定要删除这条评论吗？"
                          onConfirm={() => handleDeleteComment(comment.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                          >
                            删除
                          </Button>
                        </Popconfirm>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <Text strong>{comment.username}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(comment.createTime).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                  }
                  description={<Paragraph style={{ margin: 0 }}>{comment.content}</Paragraph>}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 播放器模态框 */}
      <Modal
        title={movie?.title || '影片播放'}
        open={playerModalVisible}
        onCancel={() => {
          setPlayerModalVisible(false);
        }}
        footer={null}
        width={900}
        destroyOnClose
        centered
      >
        {movie && movie.videoUrl && (() => {
          // 处理视频URL，确保是完整的URL
          let videoUrl = movie.videoUrl.trim();
          
          console.log('原始视频URL:', videoUrl);
          
          // 如果URL已经包含完整地址，直接使用
          if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
            console.log('处理后的视频URL:', videoUrl);
            return (
              <MoviePlayer
                src={videoUrl}
                poster={movie.coverImage}
                title={movie.title}
                movieId={movie.id}
                autoPlay={true}
              />
            );
          }
          
          // 对于相对路径，ReactPlayer需要完整的URL
          // 由于视频文件较大，直接访问后端服务器（8080端口）而不是通过前端代理
          const backendUrl = 'http://localhost:8080';
          
          // 构建完整的URL路径
          let path = videoUrl;
          if (path.startsWith('/')) {
            // 如果是 /api/ 开头的路径，直接使用
            if (!path.startsWith('/api/')) {
              // 其他路径添加 /api 前缀
              path = '/api' + path;
            }
          } else {
            // 如果不是以 / 开头，添加 /api/ 前缀
            path = '/api/' + path;
          }
          
          // 使用 new URL() 自动处理编码，避免双重编码
          // 只对路径部分进行编码，如果路径已经包含编码字符，URL 构造函数会正确处理
          try {
            // 先解码路径，确保不会对已编码的部分再次编码
            // 如果路径包含 %，说明可能已经编码过，先尝试解码
            let decodedPath = path;
            try {
              // 尝试解码，如果解码失败说明不是编码过的，使用原路径
              decodedPath = decodeURIComponent(path);
            } catch (e) {
              // 解码失败，说明路径可能包含未编码的中文字符，使用原路径
              decodedPath = path;
            }
            
            // 使用 new URL() 构建完整URL，它会自动对路径进行正确的编码
            const urlObj = new URL(decodedPath, backendUrl);
            videoUrl = urlObj.href;
            console.log('URL处理后的视频URL:', videoUrl);
          } catch (e) {
            // 如果 URL 构造失败，使用简单拼接（不推荐，但作为后备方案）
            console.warn('URL构造失败，使用简单拼接:', e);
            videoUrl = backendUrl + path;
          }
          
          console.log('最终处理后的视频URL:', videoUrl);
          
          return (
            <MoviePlayer
              src={videoUrl}
              poster={movie.coverImage}
              title={movie.title}
              movieId={movie.id}
              autoPlay={true}
            />
          );
        })()}
      </Modal>
    </div>
  );
};

export default MovieDetail;

