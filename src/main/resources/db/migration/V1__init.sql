-- 初始化数据库脚本
-- 创建默认管理员用户
INSERT INTO users (username, password, real_name, role, create_time, update_time)
VALUES ('movieadmin', 'admin123', '系统管理员', 'ADMIN', NOW(), NOW())
ON DUPLICATE KEY UPDATE username = username;

-- 创建默认分类
INSERT INTO categories (name, description, create_time, update_time)
VALUES 
    ('动作', '动作类电影', NOW(), NOW()),
    ('喜剧', '喜剧类电影', NOW(), NOW()),
    ('爱情', '爱情类电影', NOW(), NOW()),
    ('科幻', '科幻类电影', NOW(), NOW()),
    ('恐怖', '恐怖类电影', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;





