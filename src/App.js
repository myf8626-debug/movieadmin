import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import Layout from './components/Layout';
import Login from './pages/Login';
import NewsList from './pages/news/NewsList';
import NewsEdit from './pages/news/NewsEdit';
import CategoryList from './pages/category/CategoryList';
import MovieList from './pages/movie/MovieList';
import MovieEdit from './pages/movie/MovieEdit';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
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
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/news" element={<NewsList />} />
                    <Route path="/news/create" element={<NewsEdit />} />
                    <Route path="/news/edit/:id" element={<NewsEdit />} />
                    <Route path="/categories" element={<CategoryList />} />
                    <Route path="/movies" element={<MovieList />} />
                    <Route path="/movies/create" element={<MovieEdit />} />
                    <Route path="/movies/edit/:id" element={<MovieEdit />} />
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






