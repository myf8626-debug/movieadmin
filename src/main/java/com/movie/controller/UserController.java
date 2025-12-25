package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.ChangePasswordRequest;
import com.movie.dto.UpdateUserInfoRequest;
import com.movie.dto.UserVO;
import com.movie.entity.User;
import com.movie.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
@CrossOrigin
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/info")
    public ApiResponse<UserVO> getCurrentUserInfo(HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            UserVO userVO = userService.getCurrentUserWithStats(username);
            return ApiResponse.success(userVO);
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

    /**
     * 上传用户头像
     * @param file 头像文件
     * @param request HTTP请求
     * @return 包含新头像URL的响应
     */
    @PostMapping("/avatar")
    public ApiResponse<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            
            if (file == null || file.isEmpty()) {
                return ApiResponse.error("请选择要上传的文件");
            }
            
            User updatedUser = userService.updateAvatar(username, file);
            
            Map<String, String> result = new HashMap<>();
            result.put("avatarUrl", updatedUser.getAvatarUrl());
            
            return ApiResponse.success("头像上传成功", result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(e.getMessage());
        } catch (IOException e) {
            return ApiResponse.error("文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("上传失败: " + e.getMessage());
        }
    }
}

