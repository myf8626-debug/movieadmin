import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Select, InputNumber, DatePicker } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { createMovie, updateMovie, getMovieById, getCategoryList } from '../../utils/api';
import dayjs from 'dayjs';
import { Space } from 'antd';
const { TextArea } = Input;
const { Option } = Select;

const MovieEdit = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchMovie();
    }
  }, [id]);

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

  const fetchMovie = async () => {
    try {
      const response = await getMovieById(id);
      if (response.code === 200) {
        const movie = response.data;
        form.setFieldsValue({
          ...movie,
          categoryId: movie.category?.id,
          releaseDate: movie.releaseDate ? dayjs(movie.releaseDate) : null,
        });
      }
    } catch (error) {
      message.error('获取电影详情失败');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        category: values.categoryId ? { id: values.categoryId } : null,
        releaseDate: values.releaseDate ? values.releaseDate.format('YYYY-MM-DD') : null,
      };
      delete data.categoryId;
      
      if (isEdit) {
        await updateMovie(id, data);
        message.success('更新成功');
      } else {
        await createMovie(data);
        message.success('创建成功');
      }
      navigate('/movies');
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{isEdit ? '编辑电影' : '新增电影'}</h2>
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
              <Input placeholder="请输入电影标题" />
            </Form.Item>

            <Form.Item
              name="categoryId"
              label="分类"
            >
              <Select placeholder="请选择分类" allowClear>
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea rows={4} placeholder="请输入电影描述" />
            </Form.Item>

            <Form.Item
              name="coverImage"
              label="封面图片URL"
            >
              <Input placeholder="请输入封面图片URL" />
            </Form.Item>

            <Form.Item
              name="videoUrl"
              label="视频URL"
            >
              <Input placeholder="请输入视频URL" />
            </Form.Item>

            <Form.Item
              name="director"
              label="导演"
            >
              <Input placeholder="请输入导演姓名" />
            </Form.Item>

            <Form.Item
              name="actors"
              label="演员"
            >
              <Input placeholder="请输入演员姓名，多个用逗号分隔" />
            </Form.Item>

            <Form.Item
              name="releaseDate"
              label="上映日期"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="duration"
              label="时长（分钟）"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入时长" />
            </Form.Item>

            <Form.Item
              name="rating"
              label="评分"
            >
              <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} placeholder="请输入评分" />
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
                  onClick={() => navigate('/movies')}
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

export default MovieEdit;








