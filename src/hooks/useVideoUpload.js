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
  const [isPaused, setIsPaused] = useState(false);
  const abortControllerRef = useRef(null);
  const currentUploadIdRef = useRef(null);
  const currentFileRef = useRef(null);
  const uploadedChunksRef = useRef(new Set());

  /**
   * 初始化上传，获取 uploadId
   */
  const initUpload = async (file, existingUploadId = null) => {
    // 检查 token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录！');
    }

    // 如果有现有的 uploadId，先检查进度
    if (existingUploadId) {
      try {
        const progressResponse = await fetch(`/api/upload/progress/${existingUploadId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          if (progressData.code === 200 && progressData.data) {
            const uploadedIndices = progressData.data.uploadedChunkIndices || [];
            uploadedChunksRef.current = new Set(uploadedIndices);
            console.log('恢复上传进度，已上传分片:', uploadedIndices);
            return existingUploadId;
          }
        } else if (progressResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('登录已过期，请重新登录');
        }
      } catch (error) {
        if (error.message?.includes('登录')) {
          throw error;
        }
        console.warn('查询上传进度失败，将重新初始化:', error);
      }
    }

    const response = await fetch('/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunkSize: chunkSize,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error('初始化上传失败');
    }

    const data = await response.json();
    if (data.code !== 200) {
      if (data.message?.includes('未登录') || data.message?.includes('token') || data.message?.includes('401')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(data.message || '初始化上传失败');
    }

    uploadedChunksRef.current.clear();
    return data.data.uploadId;
  };

  /**
   * 上传单个分片（带自动重试机制）
   */
  const uploadChunk = async (uploadId, chunk, chunkIndex, totalChunks, retryCount = 0) => {
    const MAX_RETRIES = 3; // 最大重试次数
    const RETRY_DELAY = 1000; // 重试延迟（毫秒）

    // 检查 token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('登录已过期，请重新登录');
    }

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    // 创建带超时的 AbortController（30分钟超时）
    const chunkAbortController = new AbortController();
    const timeoutId = setTimeout(() => {
      chunkAbortController.abort();
    }, 30 * 60 * 1000); // 30分钟

    try {
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: chunkAbortController.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // 检查是否是认证错误
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('登录已过期，请重新登录');
        }
        
        // 如果是网络错误且未达到最大重试次数，则重试
        if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 0)) {
          console.log(`分片 ${chunkIndex + 1} 上传失败，${RETRY_DELAY}ms 后重试 (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return uploadChunk(uploadId, chunk, chunkIndex, totalChunks, retryCount + 1);
        }
        
        throw new Error(`上传分片 ${chunkIndex + 1}/${totalChunks} 失败`);
      }

      const data = await response.json();
      if (data.code !== 200) {
        // 检查是否是认证错误
        if (data.message?.includes('未登录') || data.message?.includes('token') || data.message?.includes('401')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('登录已过期，请重新登录');
        }
        
        // 如果是服务器错误且未达到最大重试次数，则重试
        if (retryCount < MAX_RETRIES && data.message?.includes('失败')) {
          console.log(`分片 ${chunkIndex + 1} 上传失败，${RETRY_DELAY}ms 后重试 (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return uploadChunk(uploadId, chunk, chunkIndex, totalChunks, retryCount + 1);
        }
        
        throw new Error(data.message || `上传分片 ${chunkIndex + 1}/${totalChunks} 失败`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      // 如果是网络错误且未达到最大重试次数，则重试
      if (retryCount < MAX_RETRIES && (error.name === 'TypeError' || error.name === 'NetworkError' || error.message?.includes('网络'))) {
        console.log(`分片 ${chunkIndex + 1} 网络错误，${RETRY_DELAY}ms 后重试 (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return uploadChunk(uploadId, chunk, chunkIndex, totalChunks, retryCount + 1);
      }
      
      if (error.name === 'AbortError') {
        throw new Error(`上传分片 ${chunkIndex + 1}/${totalChunks} 超时，请重试`);
      }
      throw error;
    }
  };

  /**
   * 完成上传，合并分片
   */
  const completeUpload = async (uploadId) => {
    // 检查 token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('登录已过期，请重新登录');
    }

    const response = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uploadId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error('完成上传失败');
    }

    const data = await response.json();
    if (data.code !== 200) {
      if (data.message?.includes('未登录') || data.message?.includes('token') || data.message?.includes('401')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('登录已过期，请重新登录');
      }
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
   * 保存上传进度到 localStorage
   */
  const saveUploadProgress = (uploadId, file, uploadedBytes, currentChunk, totalChunks) => {
    const progressData = {
      uploadId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedBytes,
      currentChunk,
      totalChunks,
      timestamp: Date.now(),
      uploadedChunks: Array.from(uploadedChunksRef.current),
    };
    localStorage.setItem(`upload_progress_${uploadId}`, JSON.stringify(progressData));
  };

  /**
   * 从 localStorage 恢复上传进度
   */
  const restoreUploadProgress = (uploadId) => {
    try {
      const saved = localStorage.getItem(`upload_progress_${uploadId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('恢复上传进度失败:', error);
    }
    return null;
  };

  /**
   * 清除上传进度
   */
  const clearUploadProgress = (uploadId) => {
    if (uploadId) {
      localStorage.removeItem(`upload_progress_${uploadId}`);
    }
  };

  /**
   * 主上传函数
   */
  const upload = useCallback(async (file, resumeUploadId = null) => {
    // 检查 token 是否存在
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('请先登录！');
      return null;
    }

    // 如果正在上传且未暂停，不允许重复上传
    // 但如果已暂停，允许恢复上传
    if (isUploading && !isPaused) {
      message.warning('已有文件正在上传，请等待完成');
      return null;
    }

    setIsUploading(true);
    setIsPaused(false);
    currentFileRef.current = file;
    
    // 如果是恢复上传，使用现有的 uploadId
    let uploadId = resumeUploadId;
    if (!uploadId) {
      // 尝试从 localStorage 恢复（匹配文件名和大小）
      const savedProgress = Object.keys(localStorage)
        .filter(key => key.startsWith('upload_progress_'))
        .map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            // 检查文件名和大小是否匹配
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
        uploadId = savedProgress.data.uploadId;
        uploadedChunksRef.current = new Set(savedProgress.data.uploadedChunks || []);
        console.log('从本地存储恢复上传进度:', savedProgress.data);
        console.log('恢复上传进度,已上传分片:', Array.from(uploadedChunksRef.current));
      }
    } else {
      // 如果提供了uploadId，尝试从localStorage恢复已上传的分片信息
      try {
        const savedProgress = Object.keys(localStorage)
          .filter(key => key.startsWith('upload_progress_'))
          .map(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data.uploadId === uploadId) {
                return data;
              }
            } catch (e) {
              return null;
            }
            return null;
          })
          .find(data => data !== null);
        
        if (savedProgress) {
          uploadedChunksRef.current = new Set(savedProgress.uploadedChunks || []);
          console.log('从localStorage恢复已上传分片:', Array.from(uploadedChunksRef.current));
        }
      } catch (e) {
        console.warn('恢复上传分片信息失败:', e);
      }
    }

    abortControllerRef.current = new AbortController();

    // 在try块外部定义变量，以便在catch块中访问
    let uploadedBytes = 0;
    let totalChunks = 0;
    let chunks = [];

    try {
      // 1. 初始化上传（如果已有 uploadId，会检查进度）
      uploadId = await initUpload(file, uploadId);
      currentUploadIdRef.current = uploadId;

      // 2. 分割文件
      chunks = splitFileIntoChunks(file);
      totalChunks = chunks.length;
      
      // 3. 计算已上传的字节数
      uploadedBytes = 0;
      for (let i = 0; i < chunks.length; i++) {
        if (uploadedChunksRef.current.has(i)) {
          uploadedBytes += chunks[i].size;
        }
      }

      // 4. 上传每个分片（跳过已上传的）
      for (let i = 0; i < chunks.length; i++) {
        // 检查是否暂停（在每次循环开始时检查）
        if (isPaused) {
          console.log(`上传已暂停，停止在分片 ${i + 1}/${totalChunks}`);
          throw new Error('上传已暂停');
        }

        // 跳过已上传的分片
        if (uploadedChunksRef.current.has(i)) {
          console.log(`跳过已上传的分片: ${i + 1}/${totalChunks}`);
          continue;
        }

        // 检查是否被取消
        if (abortControllerRef.current?.signal.aborted) {
          console.log(`上传已取消，停止在分片 ${i + 1}/${totalChunks}`);
          throw new Error('上传已取消');
        }

        try {
          await uploadChunk(uploadId, chunks[i], i, totalChunks);
        } catch (error) {
          // 如果在上传过程中被暂停，抛出暂停错误
          if (isPaused) {
            throw new Error('上传已暂停');
          }
          // 其他错误继续抛出
          throw error;
        }
        
        // 记录已上传的分片
        uploadedChunksRef.current.add(i);
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
        
        // 保存进度到 localStorage
        saveUploadProgress(uploadId, file, uploadedBytes, i + 1, totalChunks);
      }

      // 5. 完成上传
      const fileUrl = await completeUpload(uploadId);

      setProgress({
        uploaded: file.size,
        total: file.size,
        percentage: 100,
        currentChunk: totalChunks,
        totalChunks,
      });

      // 清除保存的进度
      clearUploadProgress(uploadId);

      onSuccess?.(uploadId, file);
      message.success('文件上传成功！');

      return fileUrl;
    } catch (error) {
      const errorMessage = error.message || '上传失败';
      
      // 如果是暂停，保存进度以便恢复
      if (errorMessage === '上传已暂停') {
        if (currentUploadIdRef.current && file) {
          const currentChunk = Array.from(uploadedChunksRef.current).length;
          saveUploadProgress(
            currentUploadIdRef.current,
            file,
            uploadedBytes || 0,
            currentChunk,
            totalChunks
          );
          console.log('上传已暂停，已保存进度:', { uploadedBytes, currentChunk, totalChunks });
        }
        // 暂停时不显示错误消息
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
      
      // 如果不是暂停或取消，保存进度以便恢复
      if (errorMessage !== '上传已取消') {
        if (currentUploadIdRef.current && file) {
          const currentChunk = Array.from(uploadedChunksRef.current).length;
          saveUploadProgress(
            currentUploadIdRef.current,
            file,
            uploadedBytes || 0,
            currentChunk,
            totalChunks
          );
        }
      }
      
      message.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    } finally {
      // 只有在非暂停状态下才清空引用
      // 如果已暂停，保留引用以便恢复
      if (!isPaused) {
        setIsUploading(false);
        abortControllerRef.current = null;
        currentUploadIdRef.current = null;
        currentFileRef.current = null;
      } else {
        // 暂停时保持 isUploading 为 true，以便UI显示暂停状态
        // 但不清空引用，以便恢复
        console.log('上传已暂停，保留状态以便恢复');
      }
    }
  }, [isUploading, isPaused, chunkSize, onProgress, onSuccess, onError, progress]);

  /**
   * 暂停上传
   */
  const pause = useCallback(() => {
    if (isUploading && !isPaused) {
      setIsPaused(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      message.info('上传已暂停，可以稍后继续');
    }
  }, [isUploading, isPaused]);

  /**
   * 恢复上传
   */
  const resume = useCallback(() => {
    console.log('尝试恢复上传:', {
      isPaused,
      hasFile: !!currentFileRef.current,
      hasUploadId: !!currentUploadIdRef.current,
      uploadedChunks: Array.from(uploadedChunksRef.current)
    });
    
    // 如果文件对象丢失，尝试从localStorage恢复
    if (!currentFileRef.current) {
      const savedProgress = Object.keys(localStorage)
        .filter(key => key.startsWith('upload_progress_'))
        .map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            return { key, data };
          } catch (e) {
            return null;
          }
        })
        .find(item => item && item.data);
      
      if (savedProgress) {
        console.log('从localStorage恢复上传任务:', savedProgress.data);
        // 恢复uploadId和已上传分片信息
        currentUploadIdRef.current = savedProgress.data.uploadId;
        uploadedChunksRef.current = new Set(savedProgress.data.uploadedChunks || []);
        message.warning('文件对象已丢失，无法自动恢复上传。请重新选择相同的文件后继续上传。');
        message.info(`已恢复上传进度：${savedProgress.data.uploadedChunks?.length || 0}/${savedProgress.data.totalChunks || 0} 分片`);
        setIsPaused(false);
        setIsUploading(false);
        return;
      } else {
        message.warning('没有可恢复的上传任务');
        return;
      }
    }
    
    // 如果有文件对象，可以继续上传
    if (isPaused && currentFileRef.current) {
      const uploadId = currentUploadIdRef.current;
      if (!uploadId) {
        message.error('无法恢复上传：上传会话已丢失');
        setIsPaused(false);
        setIsUploading(false);
        return;
      }
      
      setIsPaused(false);
      setIsUploading(true);
      abortControllerRef.current = new AbortController();
      
      // 重新开始上传，会自动跳过已上传的分片
      upload(currentFileRef.current, uploadId).catch(error => {
        console.error('恢复上传失败:', error);
        message.error('恢复上传失败: ' + (error.message || '未知错误'));
        setIsPaused(false);
        setIsUploading(false);
      });
      message.info('正在恢复上传...');
    } else if (!isPaused) {
      message.info('上传未暂停，无需恢复');
    } else {
      message.warning('没有可恢复的上传任务');
    }
  }, [isPaused, upload]);

  /**
   * 取消上传
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setIsPaused(false);
    
    // 清除保存的进度
    if (currentUploadIdRef.current) {
      clearUploadProgress(currentUploadIdRef.current);
    }
    
    setProgress(null);
    currentUploadIdRef.current = null;
    currentFileRef.current = null;
    uploadedChunksRef.current.clear();
    message.info('已取消上传');
  }, []);

  return {
    upload,
    progress,
    isUploading,
    isPaused,
    pause,
    resume,
    cancel,
  };
};


