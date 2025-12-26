-- 数据库结构同步脚本
-- 确保数据库表结构与实体类完全一致
-- 注意：由于JPA使用ddl-auto: update，表结构应该已经自动同步
-- 此脚本用于手动确保数据库结构与代码一致

-- 1. 确保users表有email字段（如果不存在则添加）
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'email'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN email VARCHAR(100) NULL',
    'SELECT "Column email already exists in users table" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 确保users表的字段长度和约束正确
ALTER TABLE users 
MODIFY COLUMN username VARCHAR(50) NOT NULL,
MODIFY COLUMN password VARCHAR(255) NOT NULL,
MODIFY COLUMN real_name VARCHAR(50) NULL,
MODIFY COLUMN email VARCHAR(100) NULL,
MODIFY COLUMN role VARCHAR(20) DEFAULT 'USER',
MODIFY COLUMN create_time DATETIME NULL,
MODIFY COLUMN update_time DATETIME NULL;

-- 确保username唯一约束
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND CONSTRAINT_NAME = 'UK_users_username'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT UK_users_username UNIQUE (username)',
    'SELECT "Unique constraint on username already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 确保categories表结构正确
ALTER TABLE categories
MODIFY COLUMN name VARCHAR(50) NOT NULL,
MODIFY COLUMN description VARCHAR(200) NULL,
MODIFY COLUMN create_time DATETIME NULL,
MODIFY COLUMN update_time DATETIME NULL;

-- 确保name唯一约束
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'categories' 
    AND CONSTRAINT_NAME = 'UK_categories_name'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE categories ADD CONSTRAINT UK_categories_name UNIQUE (name)',
    'SELECT "Unique constraint on name already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 确保movies表结构正确
ALTER TABLE movies
MODIFY COLUMN title VARCHAR(200) NOT NULL,
MODIFY COLUMN description TEXT NULL,
MODIFY COLUMN cover_image VARCHAR(500) NULL,
MODIFY COLUMN video_url VARCHAR(500) NULL,
MODIFY COLUMN release_date DATE NULL,
MODIFY COLUMN director VARCHAR(50) NULL,
MODIFY COLUMN actors VARCHAR(200) NULL,
MODIFY COLUMN duration INT NULL,
MODIFY COLUMN rating DOUBLE DEFAULT 0.0,
MODIFY COLUMN view_count INT DEFAULT 0,
MODIFY COLUMN create_time DATETIME NULL,
MODIFY COLUMN update_time DATETIME NULL;

-- 5. 确保news表结构正确
ALTER TABLE news
MODIFY COLUMN title VARCHAR(200) NOT NULL,
MODIFY COLUMN content TEXT NULL,
MODIFY COLUMN summary VARCHAR(500) NULL,
MODIFY COLUMN cover_image VARCHAR(200) NULL,
MODIFY COLUMN view_count INT DEFAULT 0,
MODIFY COLUMN create_time DATETIME NULL,
MODIFY COLUMN update_time DATETIME NULL;

-- 6. 确保外键约束存在（如果表已存在但外键缺失）
-- movies表的category_id外键
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'movies' 
    AND CONSTRAINT_NAME LIKE '%category_id%'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE movies ADD CONSTRAINT FK_movies_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL',
    'SELECT "Foreign key on category_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- movies表的user_id外键
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'movies' 
    AND CONSTRAINT_NAME LIKE '%user_id%'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE movies ADD CONSTRAINT FK_movies_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "Foreign key on user_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- news表的user_id外键
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'news' 
    AND CONSTRAINT_NAME LIKE '%user_id%'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE news ADD CONSTRAINT FK_news_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "Foreign key on user_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

