package com.movie.dto;

import com.movie.entity.User;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserVO {
    private Long id;
    private String username;
    private String realName;
    private String email;
    private String role;
    private String avatarUrl; // 头像URL
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    
    // 统计字段
    private Long favoriteCount; // 收藏影片数
    private Long daysSinceRegistration; // 入驻天数
    private Long totalViews; // 累计浏览数（暂时使用mock数据）

    public static UserVO fromUser(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setEmail(user.getEmail());
        vo.setRole(user.getRole());
        vo.setAvatarUrl(user.getAvatarUrl());
        vo.setCreateTime(user.getCreateTime());
        vo.setUpdateTime(user.getUpdateTime());
        return vo;
    }
}

