package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.LoginRequest;
import com.movie.dto.RegisterRequest;
import com.movie.entity.User;
import com.movie.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("=== 收到登录请求 ===");
        System.out.println("请求体: username=" + request.getUsername() + ", password=" + request.getPassword());
        try {
            Map<String, Object> result = userService.login(request.getUsername(), request.getPassword());
            System.out.println("登录成功，返回结果");
            return ApiResponse.success("登录成功", result);
        } catch (Exception e) {
            System.err.println("登录异常: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<User> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // 验证密码确认
            if (request.getPassword() == null || request.getConfirmPassword() == null) {
                return ApiResponse.error("密码和确认密码不能为空");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                return ApiResponse.error("两次输入的密码不一致");
            }
            
            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(request.getPassword());
            user.setRealName(request.getRealName());
            user.setEmail(request.getEmail());
            // role 默认为 USER，由实体类设置
            
            User newUser = userService.register(user);
            return ApiResponse.success("注册成功", newUser);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}





