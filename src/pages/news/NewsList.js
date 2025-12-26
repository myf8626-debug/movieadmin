import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Popconfirm, message, Tag, Badge, Image, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNewsList, deleteNews } from '../../utils/api';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';

const { Option } = Select;

const NewsList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined); // undefined=全部, 1=已发布, 0=草稿
  const navigate = useNavigate();

  const fetchData = async (page = 1, searchKeyword = '', status = null) => {
    setLoading(true);
    try {
      const params = {
        page: page - 1,
        size: pagination.pageSize,
      };
      if (searchKeyword && searchKeyword.trim() !== '') {
        params.keyword = searchKeyword.trim();
      }
      if (status !== null && status !== undefined && status !== '') {
        // 强制转换为数字类型，只接受 0 或 1
        let statusNum;
        if (typeof status === 'string') {
          // 处理字符串类型
          if (status === 'PUBLISHED' || status === '1') {
            statusNum = 1;
          } else if (status === 'DRAFT' || status === '0') {
            statusNum = 0;
          } else {
            statusNum = parseInt(status, 10);
          }
        } else {
          statusNum = Number(status);
        }
        if (!isNaN(statusNum) && (statusNum === 0 || statusNum === 1)) {
          params.status = statusNum;
        } else {
          // 如果转换失败或值无效，不添加 status 参数
          console.warn('Invalid status value:', status);
        }
      }
      const response = await getNewsList(params);
      if (response && response.code === 200) {
        // 按ID从小到大排序
        const sortedData = [...(response.data?.content || [])].sort((a, b) => {
          return (a.id || 0) - (b.id || 0);
        });
        setData(sortedData);
        setPagination({
          ...pagination,
          current: page,
          total: response.data?.totalElements || 0,
        });
      } else {
        message.error(response?.message || '获取新闻列表失败');
      }
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      message.error(error.response?.data?.message || error.message || '获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(1, keyword, statusFilter);
  };

  const handleStatusFilterChange = (value) => {
    // 确保值是数字类型或 undefined
    let statusValue = undefined;
    if (value !== undefined && value !== null && value !== '') {
      // 强制转换为数字，处理字符串 "0"、"1" 或数字 0、1
      let numValue;
      if (typeof value === 'string') {
        // 如果是字符串，先尝试解析
        if (value === 'PUBLISHED' || value === '1') {
          numValue = 1;
        } else if (value === 'DRAFT' || value === '0') {
          numValue = 0;
        } else {
          numValue = parseInt(value, 10);
        }
      } else {
        numValue = Number(value);
      }
      // 只接受 0 或 1
      if (!isNaN(numValue) && (numValue === 0 || numValue === 1)) {
        statusValue = numValue;
      }
    }
    setStatusFilter(statusValue);
    fetchData(1, keyword, statusValue);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNews(id);
      message.success('删除成功');
      fetchData(pagination.current, keyword, statusFilter);
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
      render: (text, record) => {
        return (
          <Space>
            {record.isTop === 1 && (
              <Tag color="red" style={{ margin: 0 }}>[置顶]</Tag>
            )}
            <span>{text}</span>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => {
        return status === 1 ? (
          <Badge status="success" text="已发布" />
        ) : (
          <Badge status="default" text="草稿" />
        );
      },
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (author) => author || '-',
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
      align: 'center',
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
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <Option value={undefined}>全部</Option>
              <Option value={1}>已发布</Option>
              <Option value={0}>草稿</Option>
            </Select>
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
            fetchData(pagination.current, keyword, statusFilter);
          }}
        />
        </div>
      </div>
    </div>
  );
};

export default NewsList;








