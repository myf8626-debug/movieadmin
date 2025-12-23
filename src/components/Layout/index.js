import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  VideoCameraOutlined,
  HomeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import './index.css';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: '系统主页',
    },
    {
      key: '/news',
      icon: <FileTextOutlined />,
      label: '新闻管理',
    },
    {
      key: '/categories',
      icon: <AppstoreOutlined />,
      label: '影片分类',
    },
    {
      key: '/movies',
      icon: <VideoCameraOutlined />,
      label: '影片管理',
    },
    {
      key: '/profile',
      icon: <SettingOutlined />,
      label: '个人中心',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout className="app-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" width={240}>
        <div className="logo">
          {collapsed ? '电影' : '电影后台管理系统'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header className="header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger"
          />
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar icon={<UserOutlined />} />
                <span className="username">{user.realName || user.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">{children}</Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;






