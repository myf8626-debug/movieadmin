import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Popconfirm, message, Select, Tag, Image, Card, Row, Col, Empty, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, AppstoreOutlined, UnorderedListOutlined, VideoCameraOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMovieList, deleteMovie, deleteMoviesBatch, getCategoryList, toggleFavorite, getCurrentUserInfo } from '../../utils/api';
import { renderIcon } from '../../utils/iconUtils';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';
import './MovieList.css';

const { Option } = Select;

const MovieList = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 选中的行ID
  const [userRole, setUserRole] = useState(null); // 当前用户角色
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState(() => {
    const catId = searchParams.get('categoryId');
    return catId ? parseInt(catId) : null;
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [sortBy, setSortBy] = useState('favorite'); // 'favorite', 'hot', 'rating', 'viewCount'
  const navigate = useNavigate();
  

  // 判断是否为管理员
  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    fetchCategories();
    fetchUserInfo();
    const catId = searchParams.get('categoryId');
    // 确保从第1页开始加载
    setPagination(prev => ({ ...prev, current: 1 }));
    if (catId) {
      setCategoryId(parseInt(catId));
      fetchData(1, keyword, parseInt(catId), sortBy);
    } else {
      fetchData(1, keyword, null, sortBy);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await getCurrentUserInfo();
      if (response.code === 200) {
        setUserRole(response.data.role);
      }
    } catch (error) {
      // 未登录或获取失败，设置为null
      setUserRole(null);
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

  const fetchData = async (page = 1, searchKeyword = '', catId = null, sort = sortBy) => {
    setLoading(true);
    try {
      // 故障点1修复：正确解析 localStorage 中的 userId
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let userId = null;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // 尝试多种可能的字段名：id, userId, user_id
          userId = user?.id || user?.userId || user?.user_id;
        } catch (e) {
          console.error('解析 user 对象失败:', e);
        }
      }
      
      console.log('=== 前端 fetchData 开始 ===');
      console.log('准备发送请求 - userId:', userId, 'token存在:', !!token, 'userStr:', userStr);
      
      // 确保page至少为1
      const pageNumber = Math.max(1, page);
      
      // 故障点1修复：将 userId 明确添加到 params 中
      const requestParams = {
        page: pageNumber - 1, // 后端使用0-based分页
        size: pagination.pageSize,
        keyword: searchKeyword,
        categoryId: catId,
        sortBy: sort,
      };
      
      // 如果 userId 存在，添加到请求参数中
      if (userId) {
        requestParams.userId = userId;
        console.log('✅ userId 已添加到请求参数:', requestParams);
      } else {
        console.warn('⚠️ userId 为空，未添加到请求参数');
      }
      
      const response = await getMovieList(requestParams);
      
      console.log('收到后端响应:', {
        code: response.code,
        hasData: !!response.data,
        hasContent: !!(response.data?.content),
        contentLength: response.data?.content?.length || 0
      });
      
      if (response.code === 200) {
        let sortedData = response.data.content || [];
        
        // 调试：打印后端返回的第一条电影数据（完整对象）
        if (sortedData.length > 0) {
          console.log('后端返回的第一条电影数据（完整）:', JSON.stringify(sortedData[0], null, 2));
          console.log('后端返回的第一条电影数据（简化）:', {
            id: sortedData[0].id,
            title: sortedData[0].title,
            isFavorited: sortedData[0].isFavorited,
            isFavorite: sortedData[0].isFavorite, // 检查是否有 isFavorite 字段
            favorite: sortedData[0].favorite, // 检查是否有 favorite 字段
            allKeys: Object.keys(sortedData[0]) // 打印所有字段名
          });
        }
        
        // 强制按ID从小到大排序（确保排序正确）
        sortedData = [...sortedData].sort((a, b) => {
          const idA = Number(a.id) || 0;
          const idB = Number(b.id) || 0;
          return idA - idB;
        });
        
        // 调试：打印排序后的ID列表（前10个）
        if (sortedData.length > 0) {
          console.log('电影排序后的ID列表（前10个）:', sortedData.slice(0, 10).map(m => m.id));
        }
        
        // 确保 isFavorited 字段存在，并验证用户是否已登录
        // 如果未登录，所有电影的 isFavorited 都应该是 false
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;
        
        // 调试：打印第一条电影的收藏状态
        if (sortedData.length > 0) {
          console.log('第一条电影的原始数据:', {
            id: sortedData[0].id,
            title: sortedData[0].title,
            isFavorited: sortedData[0].isFavorited,
            isFavoritedType: typeof sortedData[0].isFavorited,
            isLoggedIn: isLoggedIn
          });
        }
        
        // 直接使用后端返回的 isFavorited 字段，确保是布尔值
        // 注意：根据后端返回的实际字段名来使用（可能是 isFavorited、isFavorite 或 favorite）
        const dataWithFavoriteStatus = sortedData.map(movie => {
          // 检查后端返回的字段名（优先级：isFavorited > isFavorite > favorite）
          let rawFavoriteValue = movie.isFavorited !== undefined ? movie.isFavorited : 
                                (movie.isFavorite !== undefined ? movie.isFavorite : 
                                (movie.favorite !== undefined ? movie.favorite : false));
          
          // 转换为布尔值
          let isFavorited = Boolean(rawFavoriteValue);
          
          // 如果未登录，强制设置为 false（双重保险）
          if (!isLoggedIn) {
            isFavorited = false;
          }
          
          // 调试：如果第一条电影，打印详细信息
          if (movie.id === sortedData[0]?.id) {
            console.log('处理收藏状态（刷新后）:', {
              movieId: movie.id,
              movieTitle: movie.title,
              rawIsFavorited: movie.isFavorited,
              rawIsFavorite: movie.isFavorite,
              rawFavorite: movie.favorite,
              rawFavoriteValue: rawFavoriteValue,
              rawType: typeof rawFavoriteValue,
              isLoggedIn: isLoggedIn,
              finalIsFavorited: isFavorited,
              message: '使用后端返回的收藏状态'
            });
          }
          
          return {
            ...movie,
            isFavorited: isFavorited  // 统一使用 isFavorited 字段
          };
        });
        
        // 调试：打印处理后的第一条电影的收藏状态
        if (dataWithFavoriteStatus.length > 0) {
          console.log('第一条电影处理后的数据:', {
            id: dataWithFavoriteStatus[0].id,
            title: dataWithFavoriteStatus[0].title,
            isFavorited: dataWithFavoriteStatus[0].isFavorited,
            isFavoritedType: typeof dataWithFavoriteStatus[0].isFavorited
          });
        }
        setData(dataWithFavoriteStatus);
        setPagination(prev => ({
          ...prev,
          current: pageNumber,
          total: response.data.totalElements,
        }));
      }
    } catch (error) {
      message.error('获取电影列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData(1, keyword, categoryId, sortBy);
  };

  const handleCategoryChange = (value) => {
    const newCategoryId = value || null;
    setCategoryId(newCategoryId);
    // 更新URL参数
    if (newCategoryId) {
      setSearchParams({ categoryId: newCategoryId });
    } else {
      setSearchParams({});
    }
    // 触发搜索，保持当前的排序条件
    fetchData(1, keyword, newCategoryId, sortBy);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    // 触发搜索，保持当前的分类筛选条件
    fetchData(1, keyword, categoryId, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMovie(id);
      message.success('删除成功');
      // 清空选中状态
      setSelectedRowKeys([]);
      fetchData(pagination.current, keyword, categoryId, sortBy);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一条记录');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个影片吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMoviesBatch(selectedRowKeys);
          message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
          // 清空选中状态
          setSelectedRowKeys([]);
          // 刷新数据，保持当前的筛选和排序条件
          fetchData(pagination.current, keyword, categoryId, sortBy);
        } catch (error) {
          message.error(error.response?.data?.message || '批量删除失败');
        }
      },
    });
  };


  const handleToggleFavorite = async (movieId, currentStatus, e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发行点击
    
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
    console.log('收藏操作 - User:', userId, 'Movie:', movieId, 'CurrentStatus:', currentStatus);
    
    try {
      // 修复：传递正确的参数格式 { movieId: movieId }
      const response = await toggleFavorite({ movieId: movieId });
      console.log('收藏响应:', response);
      
      if (response.code === 200) {
        // 确保 newStatus 是布尔值
        const newStatus = Boolean(response.data?.isFavorited);
        console.log('新的收藏状态:', newStatus);
        
        message.success(newStatus ? '收藏成功' : '取消收藏成功');
        
        // 更新本地数据状态 - 立即更新UI，不等待页面刷新
        setData(prevData => 
          prevData.map(movie => 
            movie.id === movieId 
              ? { ...movie, isFavorited: newStatus }
              : movie
          )
        );
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      message.error(error.response?.data?.message || error.message || '操作失败，请先登录');
    }
  };

  // 表格行选择配置（仅管理员可用）
  const rowSelection = isAdmin ? {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      name: record.title,
    }),
  } : null;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      // 移除sorter，使用数据本身的排序
    },
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 120,
      render: (coverImage, record) => (
        coverImage ? (
          <Image
            src={coverImage}
            alt={record.title}
            width={80}
            height={120}
            style={{ objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
            preview={false}
            onClick={() => navigate(`/movies/detail/${record.id}`)}
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWbvueJhzwvdGV4dD48L3N2Zz4="
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 120,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/movies/detail/${record.id}`)}
          >
            <VideoCameraOutlined style={{ fontSize: 24, color: '#ccc' }} />
          </div>
        )
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/movies/detail/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      key: 'category',
      width: 120,
      render: (categoryId, record) => {
        // 优先使用 categoryName（如果后端返回了）
        if (record.categoryName) {
          const category = categories.find(cat => cat.id === categoryId);
          const icon = category?.icon ? renderIcon(category.icon, { style: { fontSize: 14 } }) : null;
          return (
            <Tag>
              <Space size={4}>
                {icon}
                <span>{record.categoryName}</span>
              </Space>
            </Tag>
          );
        }
        // 如果没有 categoryName，从 categories 列表中查找
        if (categoryId) {
          const category = categories.find(cat => cat.id === categoryId);
          if (category) {
            const icon = category.icon ? renderIcon(category.icon, { style: { fontSize: 14 } }) : null;
            return (
              <Tag>
                <Space size={4}>
                  {icon}
                  <span>{category.name}</span>
                </Space>
              </Tag>
            );
          }
        }
        return '-';
      },
    },
    {
      title: '导演',
      dataIndex: 'director',
      key: 'director',
      width: 120,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating) => rating ? rating.toFixed(1) : '-',
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
    },
    {
      title: '收藏',
      key: 'favorite',
      width: 80,
      align: 'center',
      render: (_, record) => {
        // 确保 isFavorited 是布尔值，并且只有在已登录时才可能为 true
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;
        // 使用 record.isFavorited（已经在 fetchData 中处理过，确保是布尔值）
        const isFavorited = isLoggedIn && Boolean(record.isFavorited);
        
        return (
          <Button
            type="text"
            icon={isFavorited ? (
              <HeartFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
            ) : (
              <HeartOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />
            )}
            onClick={(e) => handleToggleFavorite(record.id, isFavorited, e)}
            style={{ border: 'none', padding: 0 }}
            title={isLoggedIn ? (isFavorited ? '取消收藏' : '收藏') : '请先登录'}
          />
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/movies/detail/${record.id}`)}
          >
            查看
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => navigate(`/movies/edit/${record.id}`)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这部电影吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isAdmin ? '影片管理' : '电影大厅'}</h2>
      </div>
      <div className="page-content">
        <div className="list-actions">
          <Space className="list-search-bar">
            <Input
              placeholder="搜索电影标题"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8E8E93' }} />}
              style={{ maxWidth: 300 }}
            />
            <Select
              placeholder="选择分类"
              allowClear
              style={{ minWidth: 150 }}
              value={categoryId}
              onChange={handleCategoryChange}
            >
              {categories.map(cat => {
                const icon = cat.icon ? renderIcon(cat.icon, { style: { fontSize: 14 } }) : null;
                return (
                  <Option key={cat.id} value={cat.id}>
                    <Space size={4}>
                      {icon}
                      <span>{cat.name}</span>
                    </Space>
                  </Option>
                );
              })}
            </Select>
            <Select
              placeholder="排序方式"
              style={{ minWidth: 140 }}
              value={sortBy}
              onChange={handleSortChange}
            >
              <Option value="favorite">收藏优先</Option>
              <Option value="hot">综合热度</Option>
              <Option value="rating">评分最高</Option>
              <Option value="viewCount">浏览量最高</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            {viewMode === 'table' && isAdmin && selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
          <Space>
            <Button.Group>
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setViewMode('table')}
              >
                列表
              </Button>
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === 'card' ? 'primary' : 'default'}
                onClick={() => setViewMode('card')}
              >
                卡片
              </Button>
            </Button.Group>
            {isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/movies/create')}
              >
                新增电影
              </Button>
            )}
          </Space>
        </div>
        {viewMode === 'table' ? (
            <div className="table-container">
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              rowSelection={rowSelection}
              // 禁用Table的排序功能，使用数据本身的排序
              showSorterTooltip={false}
              onRow={(record) => {
                return {
                  onClick: (e) => {
                    // 如果点击的是复选框或操作按钮，不跳转
                    if (e.target.closest('.ant-checkbox-wrapper') || 
                        e.target.closest('.ant-btn') ||
                        e.target.closest('.ant-popconfirm')) {
                      return;
                    }
                    navigate(`/movies/detail/${record.id}`);
                  },
                  style: { cursor: 'pointer' }
                };
              }}
              pagination={{
                ...pagination,
                showTotal: (total) => `共 ${total} 条`,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              onChange={(pagination) => {
                // 切换页面时清空选中状态
                setSelectedRowKeys([]);
                fetchData(pagination.current, keyword, categoryId, sortBy);
              }}
            />
          </div>
        ) : (
          <div className="card-container">
            {data.length === 0 ? (
              <Card>
                <Empty description="暂无电影数据" />
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {data.map((movie) => (
                  <Col xs={24} sm={12} md={8} lg={6} xl={6} key={movie.id}>
                    <Card
                      hoverable
                      onClick={(e) => {
                        // 如果点击的是按钮或操作区域，不跳转
                        if (e.target.closest('.ant-card-actions') || 
                            e.target.closest('button') || 
                            e.target.closest('.ant-popconfirm')) {
                          return;
                        }
                        navigate(`/movies/detail/${movie.id}`);
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
                              onClick={() => navigate(`/movies/detail/${movie.id}`)}
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
                                  // 尝试使用占位符服务
                                  const placeholderUrl = `https://via.placeholder.com/300x400?text=${encodeURIComponent(movie.title)}`;
                                  e.target.src = placeholderUrl;
                                } else if (!e.target.dataset.retried2) {
                                  // 如果备用URL也失败，使用base64占位符
                                  e.target.dataset.retried2 = 'true';
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5rOV5Zu+54mHPC90ZXh0Pjwvc3ZnPg==';
                                  e.target.onerror = null; // 防止无限循环
                                }
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
                            onClick={() => navigate(`/movies/detail/${movie.id}`)}
                          >
                            <VideoCameraOutlined style={{ fontSize: 48, color: '#ccc' }} />
                          </div>
                        )
                      }
                      actions={[
                        <Button
                          type="text"
                          icon={(() => {
                            // 确保 isFavorited 是布尔值，并且只有在已登录时才可能为 true
                            const token = localStorage.getItem('token');
                            const isLoggedIn = !!token;
                            // 使用 movie.isFavorited（已经在 fetchData 中处理过，确保是布尔值）
                            const isFavorited = isLoggedIn && Boolean(movie.isFavorited);
                            return isFavorited ? (
                              <HeartFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
                            ) : (
                              <HeartOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />
                            );
                          })()}
                          onClick={(e) => {
                            e.stopPropagation();
                            const token = localStorage.getItem('token');
                            const isLoggedIn = !!token;
                            // 使用 movie.isFavorited（已经在 fetchData 中处理过，确保是布尔值）
                            const isFavorited = isLoggedIn && Boolean(movie.isFavorited);
                            handleToggleFavorite(movie.id, isFavorited, e);
                          }}
                          title={(() => {
                            const token = localStorage.getItem('token');
                            const isLoggedIn = !!token;
                            // 使用 movie.isFavorited（已经在 fetchData 中处理过，确保是布尔值）
                            const isFavorited = isLoggedIn && Boolean(movie.isFavorited);
                            return isLoggedIn ? (isFavorited ? '取消收藏' : '收藏') : '请先登录';
                          })()}
                        />,
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/movies/detail/${movie.id}`);
                          }}
                        >
                          查看
                        </Button>,
                        ...(isAdmin ? [
                          <Button
                            key="edit"
                            type="link"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/movies/edit/${movie.id}`);
                            }}
                          >
                            编辑
                          </Button>,
                          <Popconfirm
                            key="delete"
                            title="确定要删除这部电影吗？"
                            onConfirm={() => handleDelete(movie.id)}
                          >
                            <Button 
                              type="link" 
                              danger 
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            >
                              删除
                            </Button>
                          </Popconfirm>
                        ] : [])
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Button
                            type="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/movies/detail/${movie.id}`);
                            }}
                            style={{ padding: 0, height: 'auto', fontWeight: 600 }}
                          >
                            {movie.title}
                          </Button>
                        }
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              {(() => {
                                // 优先使用 categoryName（如果后端返回了）
                                let categoryName = movie.categoryName;
                                let categoryIcon = null;
                                
                                // 如果没有 categoryName，从 categories 列表中查找
                                if (!categoryName && movie.categoryId) {
                                  const category = categories.find(cat => cat.id === movie.categoryId);
                                  if (category) {
                                    categoryName = category.name;
                                    categoryIcon = category.icon ? renderIcon(category.icon, { style: { fontSize: 12 } }) : null;
                                  }
                                } else if (categoryName && movie.categoryId) {
                                  // 如果有 categoryName，也尝试获取图标
                                  const category = categories.find(cat => cat.id === movie.categoryId);
                                  categoryIcon = category?.icon ? renderIcon(category.icon, { style: { fontSize: 12 } }) : null;
                                }
                                
                                return categoryName ? (
                                  <Tag color="blue">
                                    <Space size={4}>
                                      {categoryIcon}
                                      <span>{categoryName}</span>
                                    </Space>
                                  </Tag>
                                ) : null;
                              })()}
                              {movie.rating && (
                                <Tag color="gold">评分: {movie.rating.toFixed(1)}</Tag>
                              )}
                            </div>
                            {movie.director && (
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                                导演: {movie.director}
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              观看: {movie.viewCount || 0}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                onClick={() => fetchData(pagination.current - 1, keyword, categoryId)}
                disabled={pagination.current === 1}
              >
                上一页
              </Button>
              <span style={{ margin: '0 16px' }}>
                第 {pagination.current} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              <Button
                onClick={() => fetchData(pagination.current + 1, keyword, categoryId)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default MovieList;








