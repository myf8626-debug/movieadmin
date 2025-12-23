import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Popconfirm, message, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMovieList, deleteMovie, getCategoryList } from '../../utils/api';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';

const { Option } = Select;

const MovieList = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchData();
  }, []);

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

  const fetchData = async (page = 1, searchKeyword = '', catId = null) => {
    setLoading(true);
    try {
      const response = await getMovieList({
        page: page - 1,
        size: pagination.pageSize,
        keyword: searchKeyword,
        categoryId: catId,
      });
      if (response.code === 200) {
        setData(response.data.content);
        setPagination({
          ...pagination,
          current: page,
          total: response.data.totalElements,
        });
      }
    } catch (error) {
      message.error('获取电影列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData(1, keyword, categoryId);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMovie(id);
      message.success('删除成功');
      fetchData(pagination.current, keyword, categoryId);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => category ? <Tag>{category.name}</Tag> : '-',
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">影片管理</h2>
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
              onChange={(value) => setCategoryId(value)}
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/movies/create')}
          >
            新增电影
          </Button>
        </div>
        <div className="table-container">
          <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={(pagination) => {
            fetchData(pagination.current, keyword, categoryId);
          }}
        />
        </div>
      </div>
    </div>
  );
};

export default MovieList;








