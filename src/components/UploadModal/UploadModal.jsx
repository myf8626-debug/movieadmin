import React, { useState, useEffect } from 'react';
import { Modal, Progress, Form, Input, Button, message, Upload, Space } from 'antd';
import { InboxOutlined, CloseOutlined, PauseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useVideoUpload } from '../../hooks/useVideoUpload';
import './UploadModal.css';

const { Dragger } = Upload;
const { TextArea } = Input;

/**
 * 影片上传模态框组件
 * 支持拖拽上传、分片上传、进度显示、元数据编辑
 */
const UploadModal = ({
  visible,
  onCancel,
  onSuccess,
  categoryId,
  movieId = null, // 如果提供 movieId，则为编辑模式（为已有电影上传视频）
  movieTitle = null, // 已有电影的标题
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const isEditMode = movieId !== null; // 是否为编辑模式

  const { upload, progress, isUploading, isPaused, pause, resume, cancel } = useVideoUpload({
    onProgress: (progressData) => {
      // 进度更新时的回调
      console.log(`上传进度: ${progressData.percentage}%`);
    },
    onSuccess: (uploadId, file) => {
      // 上传成功后的回调
      console.log('上传成功:', uploadId, file.name);
    },
    onError: (error) => {
      message.error(`上传失败: ${error.message}`);
    },
  });

  // 重置表单和状态
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setFileList([]);
      setUploadedFileUrl(null);
      setCurrentFile(null);
    } else if (isEditMode && movieTitle) {
      // 编辑模式下，预填充电影标题
      form.setFieldsValue({ title: movieTitle });
    }
  }, [visible, form, isEditMode, movieTitle]);

  // 处理文件选择
  const handleFileChange = (info) => {
    const { fileList: newFileList } = info;
    
    // 只允许选择一个文件
    const filteredList = newFileList.slice(-1);
    setFileList(filteredList);

    if (filteredList.length > 0) {
      const file = filteredList[0].originFileObj;
      if (file) {
        // 验证文件类型
        const validTypes = ['video/mp4', 'video/x-m4v', 'application/x-mpegURL', 'video/quicktime'];
        const isValidType = validTypes.some(type => file.type.includes(type.split('/')[1]) || file.type === type);
        
        if (!isValidType && !file.name.endsWith('.mp4') && !file.name.endsWith('.m3u8') && !file.name.endsWith('.m4v')) {
          message.error('请选择视频文件（支持 MP4、M3U8、M4V 格式）');
          setFileList([]);
          return;
        }

        // 验证文件大小（最大 10GB）
        const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
        if (file.size > maxSize) {
          message.error('文件大小不能超过 10GB');
          setFileList([]);
          return;
        }

        setCurrentFile(file);
        
        // 检查是否有未完成的上传任务（相同文件名和大小）
        const savedProgress = Object.keys(localStorage)
          .filter(key => key.startsWith('upload_progress_'))
          .map(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data.fileName === file.name && data.fileSize === file.size) {
                return { key, data };
              }
            } catch (e) {
              return null;
            }
            return null;
          })
          .find(item => item && item.data);
        
        if (savedProgress) {
          message.info(`检测到未完成的上传任务，已上传 ${savedProgress.data.uploadedChunks?.length || 0} 个分片，可以继续上传`);
        }
        
        // 如果不是编辑模式，自动填充标题（使用文件名，去除扩展名）
        if (!isEditMode) {
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          form.setFieldsValue({ title: fileName });
        }
      }
    } else {
      setCurrentFile(null);
    }
  };

  // 开始上传
  const handleUpload = async () => {
    if (!currentFile) {
      message.warning('请先选择要上传的文件');
      return;
    }

    // 检查 token
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('请先登录！');
      return;
    }

    try {
      // 检查是否有未完成的上传任务（相同文件名和大小）
      const savedProgress = Object.keys(localStorage)
        .filter(key => key.startsWith('upload_progress_'))
        .map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.fileName === currentFile.name && data.fileSize === currentFile.size) {
              return { key, data };
            }
          } catch (e) {
            return null;
          }
          return null;
        })
        .find(item => item && item.data);
      
      // 如果有未完成的上传，使用恢复上传
      const fileUrl = savedProgress 
        ? await upload(currentFile, savedProgress.data.uploadId)
        : await upload(currentFile);
        
      if (fileUrl) {
        setUploadedFileUrl(fileUrl);
        message.success('文件上传成功，请填写影片信息');
      }
    } catch (error) {
      const errorMessage = error.message || '上传失败';
      // 如果是暂停，不显示错误消息
      if (errorMessage !== '上传已暂停') {
        message.error(`上传失败: ${errorMessage}`);
      }
      
      // 如果是认证错误，跳转到登录页
      if (errorMessage.includes('登录')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  };

  // 提交表单（创建影片记录或更新视频URL）
  const handleSubmit = async () => {
    if (!uploadedFileUrl) {
      message.warning('请先完成文件上传');
      return;
    }

    try {
      if (isEditMode) {
        // 编辑模式：直接更新电影的视频URL
        onSuccess(uploadedFileUrl, { movieId });
        message.success('视频上传成功！');
        onCancel();
      } else {
        // 创建模式：创建新影片
        const values = await form.validateFields();
        onSuccess(uploadedFileUrl, {
          title: values.title,
          description: values.description,
        });
        message.success('影片创建成功！');
        onCancel();
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 取消上传
  const handleCancelUpload = () => {
    cancel();
    // 取消时清空文件列表和状态
    setFileList([]);
    setCurrentFile(null);
    setUploadedFileUrl(null);
  };
  
  // 检查是否有可恢复的上传任务
  useEffect(() => {
    if (visible && !isUploading && !isPaused && !currentFile) {
      // 检查localStorage中是否有未完成的上传
      const savedProgress = Object.keys(localStorage)
        .filter(key => key.startsWith('upload_progress_'))
        .map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            // 检查是否过期（超过24小时）
            if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
              return { key, data };
            }
          } catch (e) {
            return null;
          }
          return null;
        })
        .find(item => item && item.data);
      
      if (savedProgress) {
        console.log('检测到未完成的上传任务:', savedProgress.data.fileName);
      }
    }
  }, [visible, isUploading, isPaused, currentFile]);

  return (
    <Modal
      title={isEditMode ? `为"${movieTitle || '影片'}"上传视频` : "上传影片"}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose
      className="upload-modal"
    >
      <div className="upload-modal-content">
        {/* 文件上传区域 */}
        {!uploadedFileUrl && (
          <div className="upload-section">
            <Dragger
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false} // 阻止自动上传
              accept="video/mp4,video/x-m4v,application/x-mpegURL,video/quicktime,.mp4,.m3u8,.m4v"
              maxCount={1}
              disabled={isUploading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽视频文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 MP4、M3U8、M4V 格式，最大 10GB
              </p>
            </Dragger>

            {currentFile && !isUploading && !uploadedFileUrl && (
              <div className="upload-file-info">
                <Space>
                  <span>已选择: {currentFile.name}</span>
                  <span>大小: {(currentFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <Button
                    type="link"
                    danger
                    icon={<CloseOutlined />}
                    onClick={handleCancelUpload}
                  >
                    取消
                  </Button>
                </Space>
              </div>
            )}

            {isUploading && progress && (
              <div className="upload-progress">
                <Progress
                  percent={progress.percentage}
                  status={isPaused ? "exception" : "active"}
                  format={(percent) => `${percent}%`}
                />
                <div className="upload-progress-info">
                  <span>
                    {isPaused ? '已暂停' : '上传中'}: {progress.currentChunk} / {progress.totalChunks} 分片
                  </span>
                  <span>
                    {((progress.uploaded / 1024 / 1024).toFixed(2))} MB /{' '}
                    {((progress.total / 1024 / 1024).toFixed(2))} MB
                  </span>
                </div>
                <Space style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                  {!isPaused ? (
                    <Button
                      icon={<PauseOutlined />}
                      onClick={pause}
                    >
                      暂停
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={resume}
                    >
                      继续上传
                    </Button>
                  )}
                  <Button
                    type="default"
                    danger
                    onClick={handleCancelUpload}
                  >
                    取消上传
                  </Button>
                </Space>
              </div>
            )}
            
            {isPaused && !isUploading && currentFile && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={resume}
                  style={{ width: '100%' }}
                >
                  继续上传
                </Button>
              </div>
            )}

            {currentFile && !isUploading && !uploadedFileUrl && (
              <Button
                type="primary"
                size="large"
                onClick={handleUpload}
                style={{ width: '100%', marginTop: 16 }}
              >
                开始上传
              </Button>
            )}
          </div>
        )}

        {/* 影片信息表单（仅创建模式显示） */}
        {uploadedFileUrl && !isEditMode && (
          <div className="metadata-section">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="title"
                label="影片标题"
                rules={[{ required: true, message: '请输入影片标题' }]}
              >
                <Input placeholder="请输入影片标题" size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="影片简介"
              >
                <TextArea
                  rows={4}
                  placeholder="请输入影片简介（可选）"
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                  >
                    创建影片
                  </Button>
                  <Button
                    onClick={() => {
                      setUploadedFileUrl(null);
                      setFileList([]);
                      setCurrentFile(null);
                    }}
                  >
                    重新上传
                  </Button>
                  <Button onClick={onCancel}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* 编辑模式：上传完成后直接完成 */}
        {uploadedFileUrl && isEditMode && (
          <div className="metadata-section" style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              视频上传成功！点击下方按钮完成更新。
            </p>
            <Space>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
              >
                完成
              </Button>
              <Button
                onClick={() => {
                  setUploadedFileUrl(null);
                  setFileList([]);
                  setCurrentFile(null);
                }}
              >
                重新上传
              </Button>
              <Button onClick={onCancel}>取消</Button>
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadModal;


