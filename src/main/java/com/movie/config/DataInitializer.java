package com.movie.config;

import com.movie.entity.User;
import com.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DataSource dataSource;

    @Override
    public void run(String... args) {
        // 首先测试数据库连接
        testDatabaseConnection();
        
        try {
            // 初始化默认管理员账号
            Optional<User> existingUser = userRepository.findByUsername("movieadmin");
            if (!existingUser.isPresent()) {
                User admin = new User();
                admin.setUsername("movieadmin");
                admin.setPassword("admin123");
                admin.setRealName("系统管理员");
                admin.setEmail("admin@movie.com");
                admin.setRole("ADMIN");
                userRepository.save(admin);
                System.out.println("========================================");
                System.out.println("✓ 默认管理员账号已创建");
                System.out.println("  用户名: movieadmin");
                System.out.println("  密码: admin123");
                System.out.println("========================================");
            } else {
                User user = existingUser.get();
                // 确保密码正确
                if (!"admin123".equals(user.getPassword())) {
                    user.setPassword("admin123");
                    userRepository.save(user);
                    System.out.println("========================================");
                    System.out.println("✓ 管理员账号密码已重置为: admin123");
                    System.out.println("========================================");
                } else {
                    System.out.println("✓ 管理员账号已存在，用户名: movieadmin, 密码: admin123");
                }
            }
            
            // 初始化VIP用户示例（可选）
            Optional<User> vipUserOpt = userRepository.findByUsername("vipuser");
            if (!vipUserOpt.isPresent()) {
                User vipUser = new User();
                vipUser.setUsername("vipuser");
                vipUser.setPassword("vip123456");
                vipUser.setRealName("VIP用户");
                vipUser.setEmail("vip@movie.com");
                vipUser.setRole("VIP");
                userRepository.save(vipUser);
                System.out.println("✓ VIP用户示例已创建: vipuser / vip123456");
            }
        } catch (Exception e) {
            System.err.println("========================================");
            System.err.println("✗ 初始化用户账号失败");
            System.err.println("错误信息: " + e.getMessage());
            System.err.println("========================================");
            e.printStackTrace();
        }
    }
    
    private void testDatabaseConnection() {
        try {
            System.out.println("========================================");
            System.out.println("正在测试数据库连接...");
            Connection connection = dataSource.getConnection();
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("✓ 数据库连接成功！");
            System.out.println("  数据库产品: " + metaData.getDatabaseProductName());
            System.out.println("  数据库版本: " + metaData.getDatabaseProductVersion());
            System.out.println("  驱动名称: " + metaData.getDriverName());
            System.out.println("  驱动版本: " + metaData.getDriverVersion());
            System.out.println("  URL: " + metaData.getURL());
            System.out.println("========================================");
            connection.close();
        } catch (Exception e) {
            System.err.println("========================================");
            System.err.println("✗ 数据库连接失败！");
            System.err.println("错误信息: " + e.getMessage());
            System.err.println("");
            System.err.println("请检查以下配置：");
            System.err.println("1. MySQL服务是否已启动");
            System.err.println("2. 数据库 'movie_db' 是否存在");
            System.err.println("3. application.yml 中的数据库配置是否正确：");
            System.err.println("   - URL: jdbc:mysql://localhost:3306/movie_db");
            System.err.println("   - 用户名和密码是否正确");
            System.err.println("4. 数据库用户是否有足够的权限");
            System.err.println("========================================");
            e.printStackTrace();
            throw new RuntimeException("数据库连接失败，应用无法启动", e);
        }
    }
}
