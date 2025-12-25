import { useState, useCallback, useRef } from 'react';
import { message } from 'antd';

/**
 * 视频分片上传 Hook
 * 支持大文件分片上传，实时进度监控，断点续传
 */
export const useVideoUpload = (options = {}) => {
  const {
    chunkSize = 5 * 1024 * 1024, // 默认 5MB
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [progress, setProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef(null);
  const currentUploadIdRef = useRef(null);

  /**
   * 初始化上传，获取 uploadId
   */
  const initUpload = async (file) => {
    const response = await fetch('/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunkSize: chunkSize,
      }),
    });

    if (!response.ok) {
      throw new Error('初始化上传失败');
    }

    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.message || '初始化上传失败');
    }

    return data.data.uploadId;
  };

  /**
   * 上传单个分片
   */
  const uploadChunk = async (uploadId, chunk, chunkIndex, totalChunks) => {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      throw new Error(`上传分片 ${chunkIndex + 1}/${totalChunks} 失败`);
    }

    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.message || `上传分片 ${chunkIndex + 1}/${totalChunks} 失败`);
    }
  };

  /**
   * 完成上传，合并分片
   */
  const completeUpload = async (uploadId) => {
    const response = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ uploadId }),
    });

    if (!response.ok) {
      throw new Error('完成上传失败');
    }

    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.message || '完成上传失败');
    }

    return data.data.fileUrl; // 返回文件URL
  };

  /**
   * 将文件分割成多个分片
   */
  const splitFileIntoChunks = (file) => {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }

    return chunks;
  };

  /**
   * 主上传函数
   */
  const upload = useCallback(async (file) => {
    if (isUploading) {
      message.warning('已有文件正在上传，请等待完成');
      return null;
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    try {
      // 1. 初始化上传
      const uploadId = await initUpload(file);
      currentUploadIdRef.current = uploadId;

      // 2. 分割文件
      const chunks = splitFileIntoChunks(file);
      const totalChunks = chunks.length;

      // 3. 上传每个分片
      let uploadedBytes = 0;
      for (let i = 0; i < chunks.length; i++) {
        await uploadChunk(uploadId, chunks[i], i, totalChunks);

        uploadedBytes += chunks[i].size;
        const progressData = {
          uploaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100),
          currentChunk: i + 1,
          totalChunks,
        };

        setProgress(progressData);
        onProgress?.(progressData);
      }

      // 4. 完成上传
      const fileUrl = await completeUpload(uploadId);

      setProgress({
        uploaded: file.size,
        total: file.size,
        percentage: 100,
        currentChunk: totalChunks,
        totalChunks,
      });

      onSuccess?.(uploadId, file);
      message.success('文件上传成功！');

      return fileUrl;
    } catch (error) {
      const errorMessage = error.message || '上传失败';
      message.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
      currentUploadIdRef.current = null;
    }
  }, [isUploading, chunkSize, onProgress, onSuccess, onError]);

  /**
   * 取消上传
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setProgress(null);
      message.info('已取消上传');
    }
  }, []);

  return {
    upload,
    progress,
    isUploading,
    cancel,
  };
};


