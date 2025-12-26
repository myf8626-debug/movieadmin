import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Popconfirm, Image, Tag, Empty, Table, Modal } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMovieList, deleteMovie, getCategoryList, clearAllVideoUrls, updateMovieVideoUrl, createMovie } from '../../utils/api';
import UploadModal from '../../components/UploadModal/UploadModal';
import { renderIcon } from '../../utils/iconUtils';
import dayjs from 'dayjs';
import './MovieManagement.css';

/**
 * 影片管理页面（管理员专用）
 * 功能：
 * - 展示影片列表（表格布局，专业后台Dashboard风格）
 * - 上传新影片（分片上传）
 * - 编辑影片信息
 * - 删除影片
 * - 播放预览
 */
const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null); // 正在编辑的电影（上传视频）
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
    fetchCategories();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await getMovieList({
        page: 0,
        size: 1000, // 获取所有影片
      });
      if (response.code === 200) {
        const sortedData = (response.data.content || []).sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idA - idB;
        });
        setMovies(sortedData);
      }
    } catch (error) {
      message.error('获取影片列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategoryList();
      if (response.code === 200) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('获取分类列表失败', error);
    }
  };

  // 处理上传成功
  const handleUploadSuccess = async (fileUrl, metadata) => {
    try {
      if (metadata && metadata.movieId) {
        // 编辑模式：更新已有电影的视频URL
        const response = await updateMovieVideoUrl(metadata.movieId, fileUrl);
        if (response.code === 200) {
          message.success('视频上传成功！');
          setUploadModalVisible(false);
          setEditingMovie(null);
          fetchMovies(); // 刷新列表
        } else {
          message.error(response.message || '更新视频URL失败');
        }
      } else {
        // 创建模式：创建新影片
        const movieData = {
          title: metadata?.title || '未命名影片',
          description: metadata?.description || '',
          videoUrl: fileUrl,
          // 设置默认值
          rating: 0,
          viewCount: 0,
          duration: 0,
        };
        
        const response = await createMovie(movieData);
        if (response.code === 200) {
          message.success('影片创建成功！');
          setUploadModalVisible(false);
          fetchMovies(); // 刷新列表
        } else {
          message.error(response.message || '创建影片失败');
        }
      }
    } catch (error) {
      console.error('处理上传成功失败:', error);
      message.error(error.message || '操作失败');
    }
  };

  // 处理为已有电影上传视频
  const handleUploadVideo = (movie) => {
    setEditingMovie(movie);
    setUploadModalVisible(true);
  };

  // 批量清空所有视频URL
  const handleClearAllVideos = async () => {
    try {
      const response = await clearAllVideoUrls();
      if (response.code === 200) {
        message.success(response.message || '已将所有影片状态设置为未上传');
        fetchMovies(); // 刷新列表
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  // 处理删除
  const handleDelete = async (id) => {
    try {
      await deleteMovie(id);
      message.success('删除成功');
      fetchMovies();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理删除视频资源
  const handleDeleteVideo = async (id) => {
    try {
      const response = await updateMovieVideoUrl(id, '');
      if (response.code === 200) {
        message.success('视频资源删除成功');
        fetchMovies();
      } else {
        message.error(response.message || '删除视频资源失败');
      }
    } catch (error) {
      console.error('删除视频资源错误:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除视频资源失败';
      message.error(errorMessage);
    }
  };


  // 获取分类名称
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : '未分类';
  };

  // 获取上传状态标签
  const getUploadStatusTag = (movie) => {
    // 检查是否有有效的视频URL
    const hasVideo = movie.videoUrl && 
                    typeof movie.videoUrl === 'string' && 
                    movie.videoUrl.trim() !== '' &&
                    !movie.videoUrl.includes('search.bilibili.com');
    
    if (!hasVideo) {
      return <Tag color="orange">未上传</Tag>;
    }
    return <Tag color="green">已上传</Tag>;
  };

  // 检查是否有有效视频
  const hasValidVideo = (movie) => {
    return movie.videoUrl && 
           typeof movie.videoUrl === 'string' && 
           movie.videoUrl.trim() !== '' &&
           !movie.videoUrl.includes('search.bilibili.com');
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
    },
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (coverImage, record) => (
        <Image
          src={coverImage}
          alt={record.title}
          width={80}
          height={120}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWbvueJhzwvdGV4dD48L3N2Zz4="
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      key: 'category',
      render: (categoryId, record) => {
        // 优先使用 categoryName（如果后端返回了）
        if (record.categoryName) {
          const category = categories.find(cat => cat.id === categoryId);
          const icon = category?.icon ? renderIcon(category.icon, { style: { fontSize: 14 } }) : null;
          return (
            <Space size={4}>
              {icon}
              <span>{record.categoryName}</span>
            </Space>
          );
        }
        // 如果没有 categoryName，使用 getCategoryName 函数
        const categoryName = getCategoryName(categoryId);
        const category = categories.find(cat => cat.id === categoryId);
        const icon = category?.icon ? renderIcon(category.icon, { style: { fontSize: 14 } }) : null;
        return (
          <Space size={4}>
            {icon}
            <span>{categoryName}</span>
          </Space>
        );
      },
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      sorter: (a, b) => (a.viewCount || 0) - (b.viewCount || 0),
    },
    {
      title: '上传状态',
      key: 'status',
      width: 100,
      render: (_, record) => getUploadStatusTag(record),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
      sorter: (a, b) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
        return timeA - timeB;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/movies/detail/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => handleUploadVideo(record)}
          >
            上传
          </Button>
          {hasValidVideo(record) && (
            <Popconfirm
              title="确定要删除该影片的视频资源吗？"
              onConfirm={() => handleDeleteVideo(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除视频
              </Button>
            </Popconfirm>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/movies/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这部影片吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="movie-management">
      <div className="page-header">
        <h2 className="page-title">影片管理</h2>
        <Space>
          <Popconfirm
            title="确定要将所有影片状态设置为未上传吗？此操作不可恢复！"
            onConfirm={handleClearAllVideos}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="default"
              size="large"
            >
              批量清空视频
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              setEditingMovie(null);
              setUploadModalVisible(true);
            }}
          >
            上传新影片
          </Button>
        </Space>
      </div>

      <div className="movie-management-content">
        {movies.length === 0 && !loading ? (
          <Card>
            <Empty
              description="暂无影片，点击上方按钮上传新影片"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <Card>
            <Table
              dataSource={movies}
              rowKey="id"
              loading={loading}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        )}
      </div>

      {/* 上传模态框 */}
      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setEditingMovie(null);
        }}
        onSuccess={handleUploadSuccess}
        movieId={editingMovie?.id || null}
        movieTitle={editingMovie?.title || null}
      />

    </div>
  );
};

export default MovieManagement;
