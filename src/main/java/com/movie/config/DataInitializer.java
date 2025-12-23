package com.movie.config;

import com.movie.entity.User;
import com.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) {
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
            System.err.println("初始化用户账号失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
