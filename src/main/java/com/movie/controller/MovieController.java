package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.MovieVO;
import com.movie.entity.Movie;
import com.movie.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/movies")
@CrossOrigin
public class MovieController {
    @Autowired
    private MovieService movieService;

    @GetMapping("/list")
    public ApiResponse<Page<MovieVO>> getMovieList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "favorite") String sortBy,
            HttpServletRequest request) {
        // 获取当前用户名（可能为null，如果未登录）
        String username = (String) request.getAttribute("username");
        
        // 所有情况下都按ID升序排序
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
        
        Page<MovieVO> moviePage = movieService.searchMoviesWithFavoriteStatus(keyword, categoryId, pageable, username, sortBy);
        return ApiResponse.success(moviePage);
    }

    @GetMapping("/{id}")
    public ApiResponse<Movie> getMovieById(@PathVariable Long id) {
        try {
            Movie movie = movieService.getMovieById(id);
            return ApiResponse.success(movie);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/create")
    public ApiResponse<Movie> createMovie(@RequestBody Movie movie, HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            Movie createdMovie = movieService.createMovie(movie, username);
            return ApiResponse.success("创建成功", createdMovie);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Movie> updateMovie(@PathVariable Long id, @RequestBody Movie movie) {
        try {
            Movie updatedMovie = movieService.updateMovie(id, movie);
            return ApiResponse.success("更新成功", updatedMovie);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteMovie(@PathVariable Long id, HttpServletRequest request) {
        try {
            // 检查用户角色，只有管理员可以删除
            String userRole = (String) request.getAttribute("userRole");
            if (userRole == null || !"ADMIN".equals(userRole)) {
                return ApiResponse.error(403, "权限不足，只有管理员可以删除电影");
            }
            
            movieService.deleteMovie(id);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 批量删除电影
     * @param requestBody 包含电影ID列表的请求体
     * @param request HttpServletRequest，用于获取用户角色
     * @return 删除结果
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> deleteMoviesBatch(@RequestBody java.util.Map<String, java.util.List<Long>> requestBody, HttpServletRequest request) {
        try {
            // 检查用户角色，只有管理员可以删除
            String userRole = (String) request.getAttribute("userRole");
            if (userRole == null || !"ADMIN".equals(userRole)) {
                return ApiResponse.error(403, "权限不足，只有管理员可以删除电影");
            }
            
            java.util.List<Long> ids = requestBody.get("ids");
            if (ids == null || ids.isEmpty()) {
                return ApiResponse.error("删除列表不能为空");
            }
            movieService.deleteMoviesBatch(ids);
            return ApiResponse.success("批量删除成功，共删除 " + ids.size() + " 条记录", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}














