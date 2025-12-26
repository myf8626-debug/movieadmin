import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Spin } from 'antd';
import './MoviePlayer.css';

/**
 * 高质量流媒体播放器组件
 * 使用 react-player 实现
 * 支持 HLS (.m3u8) 和 MP4 格式
 * 具备记忆播放功能（自动记录和恢复播放进度）
 */
const MoviePlayer = ({
  src,
  poster,
  title,
  movieId,
  autoPlay = false,
  onTimeUpdate,
}) => {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const storageKey = movieId ? `movie_playback_${movieId}` : null;
  const loadingTimeoutRef = useRef(null);

  // 从 localStorage 恢复播放进度
  const restorePlaybackPosition = () => {
    if (!storageKey || !playerRef.current) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { currentTime, duration, timestamp } = JSON.parse(saved);
        const now = Date.now();
        
        // 如果保存的时间超过7天，则清除记录
        if (now - timestamp > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(storageKey);
          return;
        }

        // 如果剩余时间超过10秒，则跳转到保存的位置
        if (currentTime && duration && duration - currentTime > 10) {
          // 使用 seekTo 方法跳转到指定时间（使用秒数）
          playerRef.current.seekTo(currentTime, 'seconds');
          setPlayedSeconds(currentTime);
        }
      }
    } catch (error) {
      console.error('恢复播放进度失败:', error);
    }
  };

  // 保存播放进度
  const savePlaybackPosition = (currentTime, duration) => {
    if (!storageKey) return;

    try {
      if (currentTime > 0 && duration > 0) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            currentTime,
            duration,
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error('保存播放进度失败:', error);
    }
  };

  // 处理播放器准备就绪
  const handleReady = () => {
    console.log('播放器准备就绪，视频URL:', src);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsReady(true);
    setIsLoading(false);
    setHasError(false);
    // 延迟恢复播放位置，确保播放器完全加载
    setTimeout(() => {
      restorePlaybackPosition();
    }, 500);
  };

  // 处理播放进度更新
  const handleProgress = (state) => {
    const { playedSeconds: currentTime, played, loadedSeconds } = state;
    setPlayedSeconds(currentTime);
    
    // 调用外部回调
    if (onTimeUpdate && playerRef.current) {
      try {
        const duration = playerRef.current.getDuration();
        if (duration && !isNaN(duration)) {
          onTimeUpdate(currentTime, duration);
        }
      } catch (error) {
        // 如果获取 duration 失败，忽略错误
        console.warn('获取视频时长失败:', error);
      }
    }
  };

  // 定期保存播放进度（每5秒）
  useEffect(() => {
    if (!isReady || !storageKey || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        const duration = playerRef.current.getDuration();
        if (duration && !isNaN(duration) && playedSeconds > 0) {
          savePlaybackPosition(playedSeconds, duration);
        }
      } catch (error) {
        // 如果获取 duration 失败，忽略错误
        console.warn('保存播放进度时获取时长失败:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isReady, storageKey, playedSeconds]);

  // 处理错误
  const handleError = (error) => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    console.error('播放器错误:', error);
    console.error('视频URL:', src);
    console.error('错误类型:', error?.type);
    console.error('错误详情:', error);
    setHasError(true);
    setIsLoading(false);
  };

  // 处理播放结束
  const handleEnded = () => {
    // 播放结束时清除播放记录
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  // 判断是否为 HLS 流
  const isHLS = src && (src.endsWith('.m3u8') || src.includes('.m3u8'));

  // 设置加载超时（30秒）
  useEffect(() => {
    if (src && isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          console.warn('视频加载超时:', src);
          setHasError(true);
          setIsLoading(false);
        }
      }, 30000); // 30秒超时
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [src, isLoading]);

  // 当src变化时重置状态
  useEffect(() => {
    setIsReady(false);
    setIsLoading(true);
    setHasError(false);
    setPlayedSeconds(0);
  }, [src]);

  return (
    <div className="movie-player-container">
      <div className="movie-player-wrapper">
        {isLoading && (
          <div className="movie-player-loading">
            <Spin size="large" tip="加载中..." />
          </div>
        )}
        
        {hasError && (
          <div className="movie-player-error">
            <p>视频加载失败，请检查视频地址是否正确</p>
            <p style={{ fontSize: '12px', color: '#999' }}>URL: {src}</p>
          </div>
        )}

        <ReactPlayer
          ref={playerRef}
          url={src}
          playing={autoPlay}
          controls={true}
          width="100%"
          height="100%"
          poster={poster}
          light={poster && !isReady}
          onReady={handleReady}
          onProgress={handleProgress}
          onError={handleError}
          onEnded={handleEnded}
          onStart={() => {
            console.log('视频开始播放');
            setIsLoading(false);
          }}
          onBuffer={() => {
            console.log('视频缓冲中...');
          }}
          onBufferEnd={() => {
            console.log('视频缓冲完成');
            setIsLoading(false);
          }}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
                playsInline: true,
                crossOrigin: 'anonymous',
                preload: 'auto',
              },
              hlsOptions: {
                // HLS.js 配置选项
                enableWorker: true,
                lowLatencyMode: false,
                xhrSetup: (xhr, url) => {
                  // 允许跨域请求
                  xhr.withCredentials = false;
                },
              },
              forceVideo: true,
              forceHLS: false,
              forceDASH: false,
            },
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
      {title && <div className="movie-player-title">{title}</div>}
    </div>
  );
};

export default MoviePlayer;
