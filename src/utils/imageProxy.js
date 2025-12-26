/**
 * 图片代理工具
 * 处理图片加载失败的情况，提供备用方案
 */

/**
 * 获取可用的图片URL
 * @param {string} originalUrl - 原始图片URL
 * @returns {string} - 处理后的图片URL
 */
export const getImageUrl = (originalUrl) => {
  if (!originalUrl) {
    return null;
  }

  // 如果URL已经是base64或data URI，直接返回
  if (originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  // 如果URL包含example.com，使用占位符
  if (originalUrl.includes('example.com')) {
    return null;
  }

  // 对于外部图片，可以添加CORS代理（如果需要）
  // 这里直接返回原URL，浏览器会处理CORS
  return originalUrl;
};

/**
 * 获取占位符图片
 * @param {string} text - 占位符文本
 * @returns {string} - base64编码的占位符图片
 */
export const getPlaceholderImage = (text = '无法图片') => {
  const svg = `
    <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="400" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-size="16" fill="#ccc" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件
 * @param {string} fallbackText - 备用文本
 */
export const handleImageError = (event, fallbackText = '无法图片') => {
  if (event && event.target) {
    event.target.src = getPlaceholderImage(fallbackText);
    event.target.onerror = null; // 防止无限循环
  }
};



