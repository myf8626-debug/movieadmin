import axios from 'axios';
import { message } from 'antd';
import { history } from './history';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    console.log('API响应:', res);
    if (res.code === 200) {
      return res;
    } else {
      // 对于非200的响应，不在这里显示错误，让调用方处理
      return Promise.reject(new Error(res.message || '请求失败'));
    }
  },
  (error) => {
    console.error('请求错误:', error);
    if (error.response) {
      const data = error.response.data;
      console.error('错误响应数据:', data);
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 登录接口的401错误不跳转，让登录页面自己处理
        if (!window.location.pathname.includes('/login')) {
          message.error('登录已过期，请重新登录');
          window.location.href = '/login';
        }
      }
      // 返回错误信息，让调用方处理
      const errorMessage = data?.message || `请求失败: ${error.response.status}`;
      return Promise.reject(new Error(errorMessage));
    } else {
      const errorMessage = error.message || '网络错误，请检查网络连接';
      return Promise.reject(new Error(errorMessage));
    }
  }
);

export default request;





