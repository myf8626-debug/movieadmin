import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Select, InputNumber, DatePicker, Upload, Progress, Space } from 'antd';
import { UploadOutlined, PlayCircleOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { createMovie, updateMovie, getMovieById, getCategoryList } from '../../utils/api';
import request from '../../utils/request';
import dayjs from 'dayjs';
const { TextArea } = Input;
const { Option } = Select;

const MovieEdit = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
  const [uploading, setUploading] = useState(false); // 是否正在上传
  const [uploadSuccess, setUploadSuccess] = useState(false); // 上传成功标志
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
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.videoUrl !== currentValues.videoUrl}>
                {({ getFieldValue, setFieldValue }) => {
                  const videoUrl = getFieldValue('videoUrl');
                  return (
                    <div>
                      {/* 如果已有 videoUrl，显示预览/下载链接 */}
                      {videoUrl && (
                        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                          <Space>
                            <span>当前视频：</span>
                            <a 
                              href={videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ marginRight: 8 }}
                            >
                              <PlayCircleOutlined /> 预览
                            </a>
                            <a 
                              href={videoUrl} 
                              download
                              style={{ marginRight: 8 }}
                            >
                              <DownloadOutlined /> 下载
                            </a>
                            <Button
                              type="link"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                setFieldValue('videoUrl', '');
                              }}
                            >
                              清除
                            </Button>
                          </Space>
                        </div>
                      )}
                      
                      {/* 上传组件 */}
                      <Upload
                        name="file"
                        action="/api/upload"
                        headers={{
                          Authorization: `Bearer ${localStorage.getItem('token')}`,
                        }}
                        beforeUpload={(file) => {
                          // 检查 token 是否存在
                          const token = localStorage.getItem('token');
                          if (!token) {
                            message.error('请先登录！');
                            return false;
                          }
                          
                          // 验证文件类型
                          const isVideo = file.type.startsWith('video/') || 
                                         file.name.endsWith('.mp4') || 
                                         file.name.endsWith('.avi') || 
                                         file.name.endsWith('.mov') ||
                                         file.name.endsWith('.mkv');
                          if (!isVideo) {
                            message.error('只能上传视频文件！');
                            return false;
                          }
                          
                          // 验证文件大小（500MB）
                          const isLt500M = file.size / 1024 / 1024 < 500;
                          if (!isLt500M) {
                            message.error('文件大小不能超过 500MB！');
                            return false;
                          }
                          
                          return true;
                        }}
                        onChange={(info) => {
                          const { status, percent } = info.file;
                          
                          if (status === 'uploading') {
                            setUploading(true);
                            setUploadProgress(percent || 0);
                          } else if (status === 'done') {
                            setUploading(false);
                            setUploadProgress(100);
                            
                            // 上传成功，获取返回的 URL
                            const response = info.file.response;
                            if (response && response.code === 200 && response.data && response.data.url) {
                              let fileUrl = response.data.url;
                              
                              // 如果 URL 是相对路径，转换为完整 URL
                              if (fileUrl.startsWith('/')) {
                                // 如果是相对路径，添加协议和域名
                                const baseUrl = window.location.origin;
                                fileUrl = baseUrl + fileUrl;
                              }
                              
                              // 设置表单字段值
                              setFieldValue('videoUrl', fileUrl);
                              setUploadSuccess(true); // 标记上传成功
                              message.success('视频上传成功！');
                              // 延迟重置进度条
                              setTimeout(() => {
                                setUploadProgress(0);
                              }, 2000);
                            } else {
                              message.error(response?.message || '上传失败，请重试');
                            }
                          } else if (status === 'error') {
                            setUploading(false);
                            setUploadProgress(0);
                            
                            // 检查是否是认证错误
                            const errorResponse = info.file.response;
                            if (errorResponse && (errorResponse.message?.includes('未登录') || 
                                                  errorResponse.message?.includes('token') ||
                                                  errorResponse.message?.includes('401'))) {
                              message.error('登录已过期，请重新登录');
                              // 清除本地存储并跳转到登录页
                              localStorage.removeItem('token');
                              localStorage.removeItem('user');
                              setTimeout(() => {
                                window.location.href = '/login';
                              }, 1000);
                            } else {
                              message.error(errorResponse?.message || '上传失败，请重试');
                            }
                          }
                        }}
                        onRemove={() => {
                          // 移除文件时，不清除 videoUrl，只清除上传状态
                          setUploadProgress(0);
                          setUploading(false);
                          setUploadSuccess(false);
                          return true;
                        }}
                        maxCount={1}
                        showUploadList={false}
                      >
                        <Button icon={<UploadOutlined />} loading={uploading}>
                          {uploading ? '上传中...' : '上传视频'}
                        </Button>
                      </Upload>
                      
                      {/* 显示上传进度 */}
                      {uploading && uploadProgress > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Progress 
                            percent={Math.round(uploadProgress)} 
                            status="active"
                            showInfo
                          />
                        </div>
                      )}
                      
                      {/* 显示上传成功提示 */}
                      {uploadSuccess && !uploading && videoUrl && (
                        <div style={{ marginTop: 8, color: '#52c41a', fontSize: 14 }}>
                          ✓ 视频已就绪
                        </div>
                      )}
                      
                      {/* 手动输入 URL 的输入框 */}
                      <Input 
                        placeholder="或手动输入视频URL" 
                        style={{ marginTop: 8 }}
                        value={videoUrl || ''}
                        onChange={(e) => {
                          setFieldValue('videoUrl', e.target.value);
                        }}
                      />
                    </div>
                  );
                }}
              </Form.Item>
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








