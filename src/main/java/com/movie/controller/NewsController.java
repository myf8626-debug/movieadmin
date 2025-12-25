package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.entity.News;
import com.movie.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/news")
@CrossOrigin
public class NewsController {
    @Autowired
    private NewsService newsService;

    @GetMapping("/list")
    public ApiResponse<Page<News>> getNewsList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String statusStr,
            @RequestParam(required = false, defaultValue = "default") String sortBy) {
        try {
            Pageable pageable;
            // 根据排序方式设置排序
            if ("hot".equals(sortBy) || "viewCount".equals(sortBy)) {
                // 按热度排序：置顶优先，然后按浏览量降序，最后按ID升序
                pageable = PageRequest.of(page, size, Sort.by("isTop").descending()
                        .and(Sort.by("viewCount").descending())
                        .and(Sort.by("id").ascending()));
            } else {
                // 默认排序：按ID升序
                pageable = PageRequest.of(page, size, Sort.by("id").ascending());
            }
            Page<News> newsPage;
            
            // 解析 status 参数，支持字符串和数字
            Integer status = null;
            if (statusStr != null && !statusStr.isEmpty()) {
                try {
                    // 如果是字符串 "PUBLISHED" 或 "DRAFT"，转换为数字
                    if ("PUBLISHED".equalsIgnoreCase(statusStr) || "1".equals(statusStr)) {
                        status = 1;
                    } else if ("DRAFT".equalsIgnoreCase(statusStr) || "0".equals(statusStr)) {
                        status = 0;
                    } else {
                        // 尝试直接解析为数字
                        status = Integer.parseInt(statusStr);
                        // 只接受 0 或 1
                        if (status != 0 && status != 1) {
                            status = null;
                        }
                    }
                } catch (NumberFormatException e) {
                    // 如果解析失败，忽略 status 参数
                    status = null;
                }
            }
            
            // 如果有搜索关键词或状态筛选，使用搜索方法
            if ((keyword != null && !keyword.isEmpty()) || status != null) {
                newsPage = newsService.searchNews(keyword, status, pageable);
            } else {
                newsPage = newsService.getAllNews(pageable);
            }
            
            return ApiResponse.success(newsPage);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("获取新闻列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<News> getNewsById(@PathVariable Long id) {
        try {
            News news = newsService.getNewsById(id);
            return ApiResponse.success(news);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/create")
    public ApiResponse<News> createNews(@RequestBody News news, HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            News createdNews = newsService.createNews(news, username);
            return ApiResponse.success("创建成功", createdNews);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<News> updateNews(@PathVariable Long id, @RequestBody News news) {
        try {
            News updatedNews = newsService.updateNews(id, news);
            return ApiResponse.success("更新成功", updatedNews);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNews(@PathVariable Long id) {
        try {
            newsService.deleteNews(id);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}














