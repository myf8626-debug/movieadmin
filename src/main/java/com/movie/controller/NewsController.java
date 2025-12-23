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
            @RequestParam(required = false) String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createTime").descending());
        Page<News> newsPage = keyword != null && !keyword.isEmpty() ?
                newsService.searchNews(keyword, pageable) :
                newsService.getAllNews(pageable);
        return ApiResponse.success(newsPage);
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














