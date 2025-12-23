/**
 * 角色工具函数
 * 用于统一管理角色显示名称和颜色
 */

export const getRoleDisplayName = (role) => {
  const roleMap = {
    'ADMIN': '管理员',
    'VIP': 'VIP用户',
    'USER': '普通用户',
  };
  return roleMap[role] || '未知角色';
};

export const getRoleColor = (role) => {
  const colorMap = {
    'ADMIN': 'red',
    'VIP': 'gold',
    'USER': 'blue',
  };
  return colorMap[role] || 'default';
};

export const getRoleTag = (role) => {
  return {
    name: getRoleDisplayName(role),
    color: getRoleColor(role),
  };
};








