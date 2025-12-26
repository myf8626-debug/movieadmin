import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Switch, Radio, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { createNews, updateNews, getNewsById } from '../../utils/api';
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
        const newsData = response.data;
        // 确保字段值正确设置
        form.setFieldsValue({
          ...newsData,
          isTop: newsData.isTop === 1,
          status: newsData.status !== undefined ? newsData.status : 0,
        });
      }
    } catch (error) {
      message.error('获取新闻详情失败');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 转换isTop为整数
      const submitData = {
        ...values,
        isTop: values.isTop ? 1 : 0,
        status: values.status !== undefined ? values.status : 0,
      };
      
      if (isEdit) {
        await updateNews(id, submitData);
        message.success('更新成功');
      } else {
        await createNews(submitData);
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
              name="author"
              label="作者"
              rules={[{ required: true, message: '请输入作者名称!' }]}
            >
              <Input placeholder="请输入作者名称" />
            </Form.Item>

            <Form.Item
              name="isTop"
              label="是否置顶"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="置顶" unCheckedChildren="普通" />
            </Form.Item>

            <Form.Item
              name="status"
              label="发布状态"
              rules={[{ required: true, message: '请选择发布状态!' }]}
              initialValue={0}
            >
              <Radio.Group>
                <Radio value={0}>草稿</Radio>
                <Radio value={1}>已发布</Radio>
              </Radio.Group>
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








