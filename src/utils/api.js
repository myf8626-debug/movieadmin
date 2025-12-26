import request from './request';

// 认证相关
export const login = (data) => request.post('/auth/login', data);
export const register = (data) => request.post('/auth/register', data);

// 新闻相关
export const getNewsList = (params) => {
  // 确保 status 参数是数字类型
  if (params && params.status !== undefined && params.status !== null) {
    const statusNum = Number(params.status);
    if (!isNaN(statusNum) && (statusNum === 0 || statusNum === 1)) {
      params.status = statusNum;
    } else {
      // 如果转换失败，删除 status 参数
      delete params.status;
    }
  }
  return request.get('/news/list', { params });
};
export const getNewsById = (id) => request.get(`/news/${id}`);
export const createNews = (data) => request.post('/news/create', data);
export const updateNews = (id, data) => request.put(`/news/${id}`, data);
export const deleteNews = (id) => request.delete(`/news/${id}`);

// 分类相关
export const getCategoryList = () => request.get('/categories/list');
export const getCategoryById = (id) => request.get(`/categories/${id}`);
export const createCategory = (data) => request.post('/categories/create', data);
export const updateCategory = (id, data) => request.put(`/categories/${id}`, data);
export const deleteCategory = (id) => request.delete(`/categories/${id}`);

// 电影相关
export const getMovieList = (params) => {
  // 确保sortBy参数正确传递
  if (!params.sortBy) {
    params.sortBy = 'favorite'; // 默认收藏优先
  }
  return request.get('/movies/list', { params });
};
export const getMovieById = (id) => request.get(`/movies/${id}`);
export const createMovie = (data) => request.post('/movies/create', data);
export const updateMovie = (id, data) => request.put(`/movies/${id}`, data);
export const deleteMovie = (id) => request.delete(`/movies/${id}`);
export const deleteMoviesBatch = (ids) => request.delete('/movies/batch', { data: { ids } });
export const clearAllVideoUrls = () => request.post('/movies/clear-videos');
export const updateMovieVideoUrl = (id, videoUrl) => request.put(`/movies/${id}/video`, { videoUrl });

// 用户相关
export const getCurrentUserInfo = () => request.get('/user/info');
export const updateUserInfo = (data) => request.put('/user/info', data);
export const changePassword = (data) => request.post('/user/change-password', data);

// 评论相关
export const createComment = (data) => request.post('/comments', data);
export const getCommentsByMovie = (movieId) => request.get(`/comments/movie/${movieId}`);
export const deleteComment = (commentId) => {
  console.log('删除评论API调用 - commentId:', commentId);
  return request.delete(`/comments/${commentId}`);
};

// 收藏相关
export const checkFavorite = (movieId) => request.get(`/favorites/check/${movieId}`);
export const toggleFavorite = (data) => request.post('/favorites/toggle', data);
export const getFavoriteList = () => request.get('/favorites/list');
export const getFavoriteMovies = (params) => request.get('/favorites/movies', { params });

// 管理员统计
export const getAdminStatistics = () => request.get('/admin/statistics');

// 视频上传相关（分片上传）
export const initVideoUpload = (data) => request.post('/upload/init', data);
export const getUploadProgress = (uploadId) => request.get(`/upload/progress/${uploadId}`);
export const uploadVideoChunk = (formData, onUploadProgress) => {
  return request.post('/upload/chunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
};
export const completeVideoUpload = (data) => request.post('/upload/complete', data);

