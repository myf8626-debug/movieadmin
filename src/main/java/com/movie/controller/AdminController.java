package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.repository.MovieRepository;
import com.movie.repository.UserRepository;
import com.movie.repository.NewsRepository;
import com.movie.repository.CategoryRepository;
import com.movie.entity.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@CrossOrigin
public class AdminController {
    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping("/statistics")
    public ApiResponse<Map<String, Object>> getStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 电影总数
            long movieCount = movieRepository.count();
            statistics.put("movieCount", movieCount);
            
            // 用户总数
            long userCount = userRepository.count();
            statistics.put("userCount", userCount);
            
            // 新闻总数
            long newsCount = newsRepository.count();
            statistics.put("newsCount", newsCount);
            
            // 分类数据（分类名称、ID、图标和该分类下的电影数量）
            List<Category> categories = categoryRepository.findAllOrderBySortOrderAndCreateTime();
            List<Map<String, Object>> categoryData = categories.stream().map(category -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", category.getId());
                data.put("name", category.getName());
                data.put("icon", category.getIcon()); // 添加图标信息
                data.put("count", movieRepository.findByCategoryId(category.getId(), 
                    PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements());
                return data;
            }).collect(Collectors.toList());
            statistics.put("categoryData", categoryData);
            
            // 浏览量最高的5部电影
            List<Map<String, Object>> topMovies = movieRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "viewCount"))
            ).getContent().stream().map(movie -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", movie.getId());
                data.put("title", movie.getTitle());
                data.put("viewCount", movie.getViewCount());
                return data;
            }).collect(Collectors.toList());
            statistics.put("topMovies", topMovies);
            
            return ApiResponse.success(statistics);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}


