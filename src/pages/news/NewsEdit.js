import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { createNews, updateNews, getNewsById } from '../../utils/api';
import { Space } from 'antd';
const { TextArea } = Input;

const NewsEdit = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchNews();
    }
  }, [id]);

  const fetchNews = async () => {
    try {
      const response = await getNewsById(id);
      if (response.code === 200) {
        form.setFieldsValue(response.data);
      }
    } catch (error) {
      message.error('获取新闻详情失败');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await updateNews(id, values);
        message.success('更新成功');
      } else {
        await createNews(values);
        message.success('创建成功');
      }
      navigate('/news');
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isEdit ? '编辑新闻' : '新增新闻'}</h2>
      </div>
      <div className="page-content">
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题!' }]}
            >
              <Input placeholder="请输入新闻标题" />
            </Form.Item>

            <Form.Item
              name="summary"
              label="摘要"
            >
              <TextArea rows={3} placeholder="请输入新闻摘要" />
            </Form.Item>

            <Form.Item
              name="coverImage"
              label="封面图片URL"
            >
              <Input placeholder="请输入封面图片URL" />
            </Form.Item>

            <Form.Item
              name="content"
              label="内容"
              rules={[{ required: true, message: '请输入内容!' }]}
            >
              <TextArea rows={10} placeholder="请输入新闻内容" />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Space size="large">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ minWidth: 120 }}
                >
                  {isEdit ? '更新' : '创建'}
                </Button>
                <Button 
                  onClick={() => navigate('/news')}
                  style={{ minWidth: 120 }}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default NewsEdit;








