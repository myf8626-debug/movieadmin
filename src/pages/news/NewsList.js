import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNewsList, deleteNews } from '../../utils/api';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';

const NewsList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const fetchData = async (page = 1, searchKeyword = '') => {
    setLoading(true);
    try {
      const response = await getNewsList({
        page: page - 1,
        size: pagination.pageSize,
        keyword: searchKeyword,
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
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(1, keyword);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNews(id);
      message.success('删除成功');
      fetchData(pagination.current, keyword);
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
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
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
            onClick={() => navigate(`/news/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条新闻吗？"
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
        <h2 className="page-title">新闻管理</h2>
      </div>
      <div className="page-content">
        <div className="list-actions">
          <Space className="list-search-bar">
            <Input
              placeholder="搜索新闻标题"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8E8E93' }} />}
              style={{ maxWidth: 400 }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/news/create')}
          >
            新增新闻
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
            fetchData(pagination.current, keyword);
          }}
        />
        </div>
      </div>
    </div>
  );
};

export default NewsList;








