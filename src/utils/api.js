import request from './request';

// 认证相关
export const login = (data) => request.post('/auth/login', data);
export const register = (data) => request.post('/auth/register', data);

// 新闻相关
export const getNewsList = (params) => request.get('/news/list', { params });
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
export const getMovieList = (params) => request.get('/movies/list', { params });
export const getMovieById = (id) => request.get(`/movies/${id}`);
export const createMovie = (data) => request.post('/movies/create', data);
export const updateMovie = (id, data) => request.put(`/movies/${id}`, data);
export const deleteMovie = (id) => request.delete(`/movies/${id}`);

// 用户相关
export const getCurrentUserInfo = () => request.get('/user/info');
export const updateUserInfo = (data) => request.put('/user/info', data);
export const changePassword = (data) => request.post('/user/change-password', data);






