package com.movie.service;

import com.movie.entity.User;
import com.movie.repository.UserRepository;
import com.movie.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    public Map<String, Object> login(String username, String password) {
        System.out.println("=== 登录请求 ===");
        System.out.println("用户名: " + username);
        System.out.println("密码: " + password);
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (!userOpt.isPresent()) {
            System.out.println("✗ 登录失败: 用户不存在 - " + username);
            // 列出所有用户以便调试
            userRepository.findAll().forEach(u -> 
                System.out.println("  数据库中的用户: " + u.getUsername())
            );
            throw new RuntimeException("用户名或密码错误");
        }
        
        User user = userOpt.get();
        System.out.println("找到用户: " + user.getUsername());
        System.out.println("数据库密码: " + user.getPassword());
        System.out.println("输入密码: " + password);
        System.out.println("密码匹配: " + user.getPassword().equals(password));
        
        if (!user.getPassword().equals(password)) {
            System.out.println("✗ 登录失败: 密码错误");
            throw new RuntimeException("用户名或密码错误");
        }

        String token = jwtUtil.generateToken(username);
        System.out.println("✓ 登录成功: " + username);
        System.out.println("生成Token: " + token.substring(0, Math.min(20, token.length())) + "...");
        System.out.println("================");

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);
        return result;
    }

    public User register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    public User updateUserInfo(String username, String newRealName, String newEmail, String newUsername) {
        User user = getUserByUsername(username);
        
        // 如果修改用户名，检查新用户名是否已存在
        if (newUsername != null && !newUsername.isEmpty() && !newUsername.equals(user.getUsername())) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("用户名已存在");
            }
            user.setUsername(newUsername);
        }
        
        if (newRealName != null) {
            user.setRealName(newRealName);
        }
        
        if (newEmail != null) {
            user.setEmail(newEmail);
        }
        
        return userRepository.save(user);
    }

    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = getUserByUsername(username);
        
        // 验证原密码
        if (!user.getPassword().equals(oldPassword)) {
            throw new RuntimeException("原密码错误");
        }
        
        // 更新密码
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    public User getCurrentUser(String username) {
        return getUserByUsername(username);
    }
}





