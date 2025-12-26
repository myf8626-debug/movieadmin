package com.movie.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.movie.entity.Movie;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MovieVO {
    private Long id;
    private String title;
    private String description;
    private String coverImage;
    private String videoUrl;
    private LocalDate releaseDate;
    private String director;
    private String actors;
    private Integer duration;
    private Double rating;
    private Integer viewCount;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long userId;
    private String username;
    
    // 强制指定 JSON 字段名为 isFavorited，确保前端能正确接收
    @JsonProperty("isFavorited")
    private Boolean isFavorited; // 是否被当前用户收藏

    public static MovieVO fromMovie(Movie movie) {
        MovieVO vo = new MovieVO();
        vo.setId(movie.getId());
        vo.setTitle(movie.getTitle());
        vo.setDescription(movie.getDescription());
        vo.setCoverImage(movie.getCoverImage());
        vo.setVideoUrl(movie.getVideoUrl());
        vo.setReleaseDate(movie.getReleaseDate());
        vo.setDirector(movie.getDirector());
        vo.setActors(movie.getActors());
        vo.setDuration(movie.getDuration());
        vo.setRating(movie.getRating());
        vo.setViewCount(movie.getViewCount());
        if (movie.getCategory() != null) {
            vo.setCategoryId(movie.getCategory().getId());
            vo.setCategoryName(movie.getCategory().getName());
        }
        vo.setCreateTime(movie.getCreateTime());
        vo.setUpdateTime(movie.getUpdateTime());
        if (movie.getUploader() != null) {
            vo.setUserId(movie.getUploader().getId());
            vo.setUsername(movie.getUploader().getUsername());
        }
        vo.setIsFavorited(false); // 默认值，需要在Service中设置
        return vo;
    }
}

