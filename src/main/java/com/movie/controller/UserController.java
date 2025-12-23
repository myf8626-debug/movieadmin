package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.ChangePasswordRequest;
import com.movie.dto.UpdateUserInfoRequest;
import com.movie.entity.User;
import com.movie.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/user")
@CrossOrigin
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/info")
    public ApiResponse<User> getCurrentUserInfo(HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            User user = userService.getCurrentUser(username);
            // 不返回密码
            user.setPassword(null);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/info")
    public ApiResponse<User> updateUserInfo(
            @Valid @RequestBody UpdateUserInfoRequest request,
            HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            User updatedUser = userService.updateUserInfo(
                    username,
                    request.getRealName(),
                    request.getEmail(),
                    request.getUsername()
            );
            updatedUser.setPassword(null);
            return ApiResponse.success("更新成功", updatedUser);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            
            // 验证新密码和确认密码是否一致
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return ApiResponse.error("新密码和确认密码不一致");
            }
            
            // 验证新密码长度
            if (request.getNewPassword().length() < 6) {
                return ApiResponse.error("新密码长度不能少于6位");
            }
            
            userService.changePassword(username, request.getOldPassword(), request.getNewPassword());
            return ApiResponse.success("密码修改成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

