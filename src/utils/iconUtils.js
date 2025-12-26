/**
 * 动态渲染Ant Design图标
 * 根据图标名称字符串动态创建图标组件
 */
import * as Icons from '@ant-design/icons';

/**
 * 根据图标名称获取图标组件
 * @param {string} iconName - 图标名称，例如 'HomeOutlined'
 * @returns {React.Component|null} - 图标组件，如果不存在则返回null
 */
export const getIconComponent = (iconName) => {
  if (!iconName) {
    return null;
  }
  
  // 如果图标名称包含Outlined、Filled、TwoTone等后缀，直接查找
  const IconComponent = Icons[iconName];
  
  if (IconComponent) {
    return IconComponent;
  }
  
  // 如果没有找到，尝试添加Outlined后缀
  const IconWithSuffix = Icons[`${iconName}Outlined`];
  if (IconWithSuffix) {
    return IconWithSuffix;
  }
  
  return null;
};

/**
 * 渲染图标组件
 * @param {string} iconName - 图标名称
 * @param {object} props - 传递给图标的属性
 * @returns {React.Element|null}
 */
export const renderIcon = (iconName, props = {}) => {
  const IconComponent = getIconComponent(iconName);
  if (IconComponent) {
    return <IconComponent {...props} />;
  }
  return null;
};

/**
 * 常用的Ant Design图标列表（用于图标选择器）
 */
export const commonIcons = [
  'HomeOutlined',
  'AppstoreOutlined',
  'VideoCameraOutlined',
  'FileTextOutlined',
  'HeartOutlined',
  'StarOutlined',
  'FireOutlined',
  'ThunderboltOutlined',
  'RocketOutlined',
  'CrownOutlined',
  'TrophyOutlined',
  'GiftOutlined',
  'SmileOutlined',
  'LikeOutlined',
  'DislikeOutlined',
  'EyeOutlined',
  'PlayCircleOutlined',
  'MusicOutlined',
  'PictureOutlined',
  'CameraOutlined',
  'BookOutlined',
  'ShoppingOutlined',
  'CarOutlined',
  'CoffeeOutlined',
  'GamepadOutlined',
  'BugOutlined',
  'RobotOutlined',
  'ExperimentOutlined',
  'ToolOutlined',
  'SettingOutlined',
];





