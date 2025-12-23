package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.LoginRequest;
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
    public ApiResponse<User> register(@Valid @RequestBody User user) {
        try {
            User newUser = userService.register(user);
            return ApiResponse.success("注册成功", newUser);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}





