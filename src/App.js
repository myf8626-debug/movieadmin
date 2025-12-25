import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import Layout from './components/Layout';
import Login from './pages/Login';
import NewsList from './pages/news/NewsList';
import NewsEdit from './pages/news/NewsEdit';
import NewsCenter from './pages/news/NewsCenter';
import CategoryList from './pages/category/CategoryList';
import MovieList from './pages/movie/MovieList';
import MovieEdit from './pages/movie/MovieEdit';
import MovieDetail from './pages/movie/MovieDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import MovieManagement from './pages/admin/MovieManagement';
import './App.css';
import './styles/ios-global.css';
import './styles/ios-animations.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  // 管理员路由保护
  const AdminRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'USER';
    if (userRole === 'ADMIN') {
      return children;
    }
    // 普通用户访问管理员路由时，重定向到电影大厅
    return <Navigate to="/movies" replace />;
  };

  // 根据用户角色获取默认路由
  const getDefaultRoute = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'USER';
    // 管理员默认跳转到系统主页，普通用户跳转到电影大厅
    return userRole === 'ADMIN' ? '/dashboard' : '/movies';
  };

  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#007AFF',
          borderRadius: 12,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
          fontSize: 17,
        },
        components: {
          Button: {
            borderRadius: 12,
            fontWeight: 600,
            controlHeight: 44,
          },
          Input: {
            borderRadius: 12,
            controlHeight: 44,
          },
          Card: {
            borderRadius: 16,
            paddingLG: 20,
          },
          Table: {
            borderRadius: 16,
          },
          Modal: {
            borderRadius: 20,
          },
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
                    {/* 系统主页 - 仅管理员可访问 */}
                    <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                    {/* 管理员专用路由 */}
                    <Route path="/news" element={<AdminRoute><NewsList /></AdminRoute>} />
                    <Route path="/news/create" element={<AdminRoute><NewsEdit /></AdminRoute>} />
                    <Route path="/news/edit/:id" element={<AdminRoute><NewsEdit /></AdminRoute>} />
                    <Route path="/categories" element={<AdminRoute><CategoryList /></AdminRoute>} />
                    <Route path="/admin/movies" element={<AdminRoute><MovieManagement /></AdminRoute>} />
                    <Route path="/movies/create" element={<AdminRoute><MovieEdit /></AdminRoute>} />
                    <Route path="/movies/edit/:id" element={<AdminRoute><MovieEdit /></AdminRoute>} />
                    {/* 公共路由 */}
                    <Route path="/movies" element={<MovieList />} />
                    <Route path="/movies/detail/:id" element={<MovieDetail />} />
                    <Route path="/news-center" element={<NewsCenter />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;






