import React, { useState, useEffect } from 'react';
import { Card, List, Empty, message, Input, Pagination, Tag, Badge, Space, Select } from 'antd';
import { SearchOutlined, ReadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNewsList } from '../../utils/api';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';
import './NewsCenter.css';

const { Option } = Select;

const NewsCenter = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'hot'
  const navigate = useNavigate();

  const fetchData = async (page = 1, searchKeyword = '', pageSize = 10, sort = sortBy) => {
    setLoading(true);
    try {
      const params = {
        page: page - 1,
        size: pageSize,
        status: 1, // 只显示已发布的新闻
        sortBy: sort,
      };
      if (searchKeyword && searchKeyword.trim() !== '') {
        params.keyword = searchKeyword.trim();
      }
      const response = await getNewsList(params);
      if (response && response.code === 200) {
        let newsList = response.data?.content || [];
        
        // 如果后端已经排序，直接使用；否则前端再次排序
        if (sort === 'hot') {
          // 按热度排序：置顶优先，然后按浏览量降序
          newsList = [...newsList].sort((a, b) => {
            // 先按置顶排序
            if (a.isTop !== b.isTop) {
              return (b.isTop || 0) - (a.isTop || 0);
            }
            // 再按浏览量降序
            const aViews = a.viewCount || 0;
            const bViews = b.viewCount || 0;
            if (aViews !== bViews) {
              return bViews - aViews;
            }
            // 最后按创建时间倒序
            if (a.createTime && b.createTime) {
              return new Date(b.createTime) - new Date(a.createTime);
            }
            return 0;
          });
        } else {
          // 默认排序：置顶优先，然后按创建时间倒序
          newsList = [...newsList].sort((a, b) => {
            if (a.isTop !== b.isTop) {
              return (b.isTop || 0) - (a.isTop || 0);
            }
            if (a.createTime && b.createTime) {
              return new Date(b.createTime) - new Date(a.createTime);
            }
            return 0;
          });
        }
        setData(newsList);
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
    fetchData(1, keyword, pagination.pageSize, sortBy);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    fetchData(1, keyword, pagination.pageSize, value);
  };

  const handleNewsClick = (news) => {
    // 可以跳转到新闻详情页，或者显示详情弹窗
    // 这里暂时显示一个消息提示
    message.info(`查看新闻：${news.title}`);
    // 如果需要详情页，可以添加路由：navigate(`/news-center/detail/${news.id}`);
  };

  return (
    <div className="news-center-container">
      <div className="page-header">
        <h2 className="page-title">
          <ReadOutlined style={{ marginRight: 8 }} />
          新闻资讯
        </h2>
        <p className="page-subtitle">浏览最新发布的新闻资讯</p>
      </div>
      <div className="page-content">
        <div className="list-actions">
          <Space>
            <Input
              placeholder="搜索新闻标题"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8E8E93' }} />}
              style={{ maxWidth: 400 }}
              allowClear
            />
            <Select
              placeholder="排序方式"
              style={{ minWidth: 140 }}
              value={sortBy}
              onChange={handleSortChange}
            >
              <Option value="default">最新发布</Option>
              <Option value="hot">热门新闻</Option>
            </Select>
          </Space>
        </div>
        {data.length > 0 ? (
          <>
            <List
              loading={loading}
              dataSource={data}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    className="news-card"
                    onClick={() => handleNewsClick(item)}
                  >
                    <div className="news-header">
                      {item.isTop === 1 && (
                        <Tag color="red" style={{ marginRight: 8 }}>
                          置顶
                        </Tag>
                      )}
                      <Badge status="success" text="已发布" />
                      <span className="news-author" style={{ marginLeft: 8, color: '#8E8E93' }}>
                        {item.author || '系统'}
                      </span>
                      <span className="news-time" style={{ marginLeft: 8, color: '#8E8E93' }}>
                        {dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                    <h3 className="news-title">{item.title}</h3>
                    {item.summary && (
                      <p className="news-summary">{item.summary}</p>
                    )}
                    <div className="news-footer">
                      <span className="news-views">浏览量: {item.viewCount || 0}</span>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                showTotal={(total) => `共 ${total} 条新闻`}
                showSizeChanger
                showQuickJumper
                onChange={(page, pageSize) => {
                  setPagination({ ...pagination, pageSize, current: page });
                  fetchData(page, keyword, pageSize, sortBy);
                }}
              />
            </div>
          </>
        ) : (
          <Empty
            description={loading ? '加载中...' : keyword ? '未找到相关新闻' : '暂无新闻'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        )}
      </div>
    </div>
  );
};

export default NewsCenter;

