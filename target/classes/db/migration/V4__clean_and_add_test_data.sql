-- 清理无关数据并添加测试数据
-- 此脚本会删除测试数据并重新添加干净的测试数据
-- 注意：此脚本需要手动在数据库中执行，因为项目使用JPA而非Flyway

-- 1. 删除所有电影数据（保留表结构）
DELETE FROM movies;

-- 2. 删除所有新闻数据（保留表结构）
DELETE FROM news;

-- 3. 删除非管理员用户（保留管理员用户）
DELETE FROM users WHERE username != 'movieadmin';

-- 4. 重置分类数据（保留基本分类，删除其他）
DELETE FROM categories WHERE name NOT IN ('动作', '喜剧', '爱情', '科幻', '恐怖');

-- 5. 添加测试用户
INSERT INTO users (username, password, real_name, email, role, create_time, update_time) VALUES
('testuser1', 'test123456', '测试用户1', 'testuser1@example.com', 'USER', NOW(), NOW()),
('testuser2', 'test123456', '测试用户2', 'testuser2@example.com', 'USER', NOW(), NOW()),
('vipuser', 'vip123456', 'VIP用户', 'vip@example.com', 'VIP', NOW(), NOW()),
('editor1', 'editor123', '编辑用户', 'editor@example.com', 'USER', NOW(), NOW())
ON DUPLICATE KEY UPDATE username = username;

-- 6. 确保基本分类存在
INSERT INTO categories (name, description, create_time, update_time) VALUES
('动作', '动作类电影', NOW(), NOW()),
('喜剧', '喜剧类电影', NOW(), NOW()),
('爱情', '爱情类电影', NOW(), NOW()),
('科幻', '科幻类电影', NOW(), NOW()),
('恐怖', '恐怖类电影', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- 7. 添加测试电影数据
-- 使用变量存储ID，避免子查询问题
SET @action_category_id = (SELECT id FROM categories WHERE name = '动作' LIMIT 1);
SET @comedy_category_id = (SELECT id FROM categories WHERE name = '喜剧' LIMIT 1);
SET @romance_category_id = (SELECT id FROM categories WHERE name = '爱情' LIMIT 1);
SET @sci_fi_category_id = (SELECT id FROM categories WHERE name = '科幻' LIMIT 1);
SET @horror_category_id = (SELECT id FROM categories WHERE name = '恐怖' LIMIT 1);

SET @admin_user_id = (SELECT id FROM users WHERE username = 'movieadmin' LIMIT 1);
SET @vip_user_id = (SELECT id FROM users WHERE username = 'vipuser' LIMIT 1);
SET @testuser1_id = (SELECT id FROM users WHERE username = 'testuser1' LIMIT 1);
SET @testuser2_id = (SELECT id FROM users WHERE username = 'testuser2' LIMIT 1);
SET @editor1_id = (SELECT id FROM users WHERE username = 'editor1' LIMIT 1);

INSERT INTO movies (title, description, cover_image, video_url, release_date, director, actors, duration, rating, view_count, category_id, user_id, create_time, update_time) VALUES
('肖申克的救赎', '银行家安迪因为妻子和她的情人被杀而被判无期徒刑，由于监狱的腐败，他在真相即将大白的情况下仍然得不到昭雪，反而在肖申克监狱饱受了各种精神上的残酷折磨。然而，安迪并没有被多舛的命运毁掉，他经过20多年水滴石穿般地不懈挖掘，终于在一个雷雨交加的夜晚，从500码长的污粪管道中爬出，重获自由，在墨西哥海边过上了自由人的生活。', 'https://example.com/covers/shawshank.jpg', 'https://example.com/videos/shawshank.mp4', '1994-09-23', '弗兰克·德拉邦特', '蒂姆·罗宾斯,摩根·弗里曼', 142, 9.7, 1250000, @action_category_id, @admin_user_id, NOW(), NOW()),

('阿甘正传', '阿甘于二战结束后不久出生在美国南方阿拉巴马州一个闭塞的小镇，他先天弱智，智商只有75，然而他的妈妈是一个性格坚强的女性，她常常鼓励阿甘"傻人有傻福"，要他自强不息。阿甘像普通孩子一样上学，并且认识了一生的朋友和至爱珍妮，在珍妮和妈妈的爱护下，阿甘凭着上帝赐予的"飞毛腿"开始了一生不停的奔跑。', 'https://example.com/covers/forrest.jpg', 'https://example.com/videos/forrest.mp4', '1994-07-06', '罗伯特·泽米吉斯', '汤姆·汉克斯,罗宾·怀特', 142, 9.5, 980000, @comedy_category_id, @admin_user_id, NOW(), NOW()),

('泰坦尼克号', '1912年4月10日，号称 "世界工业史上的奇迹"的豪华客轮泰坦尼克号开始了自己的处女航，从英国的南安普顿出发驶往美国纽约。富家少女罗丝与母亲及未婚夫卡尔一道上船，另一边，不羁的少年画家杰克靠在码头上的一场赌博赢到了船票。罗丝厌倦了上流社会虚伪的生活，不愿嫁给卡尔，打算投海自尽，被杰克救起。很快，美丽活泼的罗丝与英俊开朗的杰克相爱，杰克带罗丝参加下等舱的舞会、为她画像，二人的感情逐渐升温。', 'https://example.com/covers/titanic.jpg', 'https://example.com/videos/titanic.mp4', '1997-12-19', '詹姆斯·卡梅隆', '莱昂纳多·迪卡普里奥,凯特·温丝莱特', 194, 9.4, 1500000, @romance_category_id, @admin_user_id, NOW(), NOW()),

('星际穿越', '在不远的未来，随着地球自然环境的恶化，人类面临着无法生存的威胁。这时科学家们在太阳系中的土星附近发现了一个虫洞，通过它可以打破人类的能力限制，到更遥远外太空寻找延续生命希望的机会。一个探险小组通过这个虫洞穿越到太阳系之外，他们的目标是找到一颗适合人类移民的星球。', 'https://example.com/covers/interstellar.jpg', 'https://example.com/videos/interstellar.mp4', '2014-11-12', '克里斯托弗·诺兰', '马修·麦康纳,安妮·海瑟薇', 169, 9.3, 850000, @sci_fi_category_id, @vip_user_id, NOW(), NOW()),

('盗梦空间', '道姆·柯布与同事阿瑟和纳什在一次针对日本能源大亨齐藤的盗梦行动中失败，反被齐藤利用。齐藤威逼利诱因遭通缉而流亡海外的柯布帮他拆分他竞争对手的公司，采取极端措施在其唯一继承人罗伯特·费希尔的深层潜意识中种下放弃家族公司、自立门户的想法。为了重返美国，柯布偷偷求助于岳父迈尔斯，吸收了年轻的梦境设计师艾里阿德妮、梦境演员艾姆斯和药剂师约瑟夫加入行动。', 'https://example.com/covers/inception.jpg', 'https://example.com/videos/inception.mp4', '2010-09-01', '克里斯托弗·诺兰', '莱昂纳多·迪卡普里奥,玛丽昂·歌迪亚', 148, 9.3, 920000, @sci_fi_category_id, @testuser1_id, NOW(), NOW()),

('这个杀手不太冷', '里昂是名孤独的职业杀手，受人雇佣。一天，邻居家小姑娘马蒂尔达敲开他的房门，要求在他那里暂避杀身之祸。原来邻居家的主人是警方缉毒组的眼线，只因贪污了一小包毒品而遭恶警杀害全家的惩罚。马蒂尔达得到里昂的留救，幸免于难，并留在里昂那里。里昂教小女孩使枪，她教里昂法文，两人关系日趋亲密，相处融洽。', 'https://example.com/covers/leon.jpg', 'https://example.com/videos/leon.mp4', '1994-09-14', '吕克·贝松', '让·雷诺,娜塔莉·波特曼', 110, 9.4, 780000, @action_category_id, @testuser2_id, NOW(), NOW()),

('三傻大闹宝莱坞', '本片根据印度畅销书作家奇坦·巴哈特的处女作小说《五点人》改编而成。法兰、拉杜与兰乔是皇家工程学院的学生，三人共居一室，结为好友。在以严格著称的学院里，兰乔是个非常与众不同的学生，他不死记硬背，甚至还公然顶撞校长"病毒"，质疑他的教学方法。他不仅鼓动法兰与拉杜去勇敢追寻理想，还劝说校长的二女儿碧雅离开满眼铜臭的未婚夫。', 'https://example.com/covers/3idiots.jpg', 'https://example.com/videos/3idiots.mp4', '2009-12-25', '拉库马·希拉尼', '阿米尔·汗,卡琳娜·卡普尔', 171, 9.2, 650000, @comedy_category_id, @editor1_id, NOW(), NOW()),

('闪灵', '作家杰克·托兰斯为了寻找灵感，摆脱工作上的失意，决定接管奢华的山间饭店。曾经有传言说上一任山间饭店的管理者曾经莫名的丧失理智，残忍地杀害全家之后自杀。专心于写作的杰克-托伦斯看中了饭店的偏远，不顾好友托尼的劝告，决定带着妻子温蒂和儿子丹尼一起住进了这间豪华饭店。他们在新家里制定了新的计划，杰克还专门为自己设计了专心创作的休息室。', 'https://example.com/covers/shining.jpg', 'https://example.com/videos/shining.mp4', '1980-05-23', '斯坦利·库布里克', '杰克·尼科尔森,谢莉·杜瓦尔', 146, 8.8, 420000, @horror_category_id, @admin_user_id, NOW(), NOW());

-- 8. 添加测试新闻数据
INSERT INTO news (title, content, summary, cover_image, view_count, user_id, create_time, update_time) VALUES
('2024年最值得期待的电影盘点', '随着2024年的到来，电影行业也迎来了新的发展机遇。从科幻大片到温馨剧情片，从动作冒险到悬疑惊悚，各种类型的电影都将在今年与观众见面。本文将为您盘点2024年最值得期待的十部电影，包括《阿凡达3》、《复仇者联盟5》等备受关注的作品。这些电影不仅在制作上投入巨大，更在故事情节和视觉效果上都有所突破，相信会给观众带来全新的观影体验。', '2024年电影市场展望，盘点最值得期待的十部电影作品，包括科幻、动作、剧情等多种类型。', 'https://example.com/news/2024-movies.jpg', 1250, @editor1_id, NOW(), NOW()),

('经典电影回顾：那些年我们追过的电影', '电影作为第七艺术，承载着无数人的青春记忆。从《泰坦尼克号》的浪漫爱情，到《肖申克的救赎》的人生哲理，从《阿甘正传》的励志故事，到《星际穿越》的科幻想象，每一部经典电影都给我们留下了深刻的印象。本文将带您回顾那些年我们追过的经典电影，重温那些感动人心的瞬间。', '回顾经典电影，重温那些年感动人心的电影作品和精彩瞬间。', 'https://example.com/news/classic-movies.jpg', 890, @admin_user_id, NOW(), NOW()),

('电影行业数字化转型趋势分析', '随着科技的不断发展，电影行业也在经历着深刻的数字化转型。从拍摄技术的革新，到发行渠道的多元化，从观影方式的改变，到内容创作的创新，数字化正在重塑整个电影产业。本文将深入分析电影行业数字化转型的趋势，探讨新技术对电影制作、发行和观影体验的影响，以及未来电影行业的发展方向。', '分析电影行业数字化转型趋势，探讨新技术对电影产业的影响和未来发展方向。', 'https://example.com/news/digital-transformation.jpg', 650, @testuser1_id, NOW(), NOW()),

('如何选择适合的电影类型', '面对琳琅满目的电影作品，如何选择一部适合自己的电影？不同的电影类型有着不同的特点和魅力。动作片紧张刺激，喜剧片轻松幽默，爱情片温馨浪漫，科幻片充满想象，恐怖片惊险刺激。本文将为您详细介绍各种电影类型的特点，帮助您根据自己的心情和喜好选择最适合的电影。', '介绍不同电影类型的特点，帮助观众根据自己的喜好选择适合的电影作品。', 'https://example.com/news/movie-types.jpg', 420, @testuser2_id, NOW(), NOW()),

('电影评分系统解析', '电影评分系统是观众选择电影的重要参考依据。不同的评分平台有着不同的评分标准和算法。IMDb、豆瓣、烂番茄等平台都有各自的评分体系。本文将详细解析各大电影评分系统的工作原理，帮助观众更好地理解和使用这些评分系统，从而选择到真正适合自己的优质电影。', '解析各大电影评分系统的工作原理，帮助观众更好地理解和使用评分系统。', 'https://example.com/news/rating-system.jpg', 380, @vip_user_id, NOW(), NOW());

