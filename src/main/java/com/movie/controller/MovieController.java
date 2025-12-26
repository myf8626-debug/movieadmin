package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.MovieVO;
import com.movie.entity.Movie;
import com.movie.entity.User;
import com.movie.repository.UserRepository;
import com.movie.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

@RestController
@RequestMapping("/movies")
@CrossOrigin
public class MovieController {
    @Autowired
    private MovieService movieService;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/list")
    public ApiResponse<Page<MovieVO>> getMovieList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "favorite") String sortBy,
            @RequestParam(required = false) Long userId, // 故障点2修复：强制接收 userId 参数
            HttpServletRequest request) {
        // 获取当前用户名（可能为null，如果未登录）- 作为备用方案
        String username = (String) request.getAttribute("username");
        
        // 调试日志：打印用户信息
        System.out.println("=== MovieController.getMovieList ===");
        System.out.println("当前用户名 (username): " + username);
        System.out.println("前端传递的 userId 参数: " + userId);
        
        // 故障点2修复：如果 userId 为空，打印红色警告日志
        Long finalUserId = userId;
        if (finalUserId == null || finalUserId <= 0) {
            // 尝试从 username 获取 userId（备用方案）
            if (username != null && !username.trim().isEmpty()) {
                try {
                    Optional<User> userOpt = userRepository.findByUsername(username);
                    finalUserId = userOpt.map(User::getId).orElse(null);
                    System.out.println("从 username 获取的 userId: " + finalUserId);
                } catch (Exception e) {
                    System.err.println("获取用户ID失败: " + e.getMessage());
                }
            }
            
            // 如果最终还是 null，打印警告
            if (finalUserId == null || finalUserId <= 0) {
                System.err.println("❌❌❌ 警告：userId 为空或无效！userId = " + finalUserId);
                System.err.println("   这将导致所有电影的收藏状态都是 false！");
            }
        } else {
            System.out.println("✅ 成功接收到 userId: " + finalUserId);
        }
        
        // 所有情况下都按ID升序排序
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
        
        // 传递 userId 给 Service 层（优先使用前端传递的 userId）
        Page<MovieVO> moviePage = movieService.searchMoviesWithFavoriteStatus(keyword, categoryId, pageable, finalUserId, sortBy);
        
        // 调试日志：打印返回的第一条电影的收藏状态
        if (moviePage != null && !moviePage.getContent().isEmpty()) {
            MovieVO firstMovie = moviePage.getContent().get(0);
            System.out.println("返回的第一条电影 - ID: " + firstMovie.getId() + 
                             ", 标题: " + firstMovie.getTitle() + 
                             ", isFavorited: " + firstMovie.getIsFavorited() + 
                             ", 类型: " + (firstMovie.getIsFavorited() != null ? firstMovie.getIsFavorited().getClass().getSimpleName() : "null"));
        }
        
        return ApiResponse.success(moviePage);
    }

    @GetMapping("/{id}")
    public ApiResponse<MovieVO> getMovieById(@PathVariable Long id, HttpServletRequest request) {
        try {
            // 获取当前用户名（可能为null，如果未登录）
            String username = (String) request.getAttribute("username");
            
            // 使用带收藏状态的方法
            MovieVO movieVO = movieService.getMovieByIdWithFavoriteStatus(id, username);
            return ApiResponse.success(movieVO);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/create")
    public ApiResponse<Movie> createMovie(@RequestBody Movie movie, HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            
            // 调试日志：打印用户名和接收到的电影对象
            System.out.println("=== 创建电影请求 ===");
            System.out.println("当前用户名 (username): " + username);
            System.out.println("接收到的电影对象: " + movie);
            System.out.println("电影标题: " + (movie != null ? movie.getTitle() : "null"));
            System.out.println("发布日期: " + (movie != null ? movie.getReleaseDate() : "null"));
            
            // 检查用户是否已登录
            if (username == null) {
                System.out.println("错误: 用户未登录，username 为 null");
                return ApiResponse.error(401, "创建失败：用户未登录或Token无效");
            }
            
            Movie createdMovie = movieService.createMovie(movie, username);
            System.out.println("电影创建成功，ID: " + createdMovie.getId());
            return ApiResponse.success("创建成功", createdMovie);
        } catch (Exception e) {
            // 打印完整堆栈跟踪以便调试
            System.err.println("创建电影时发生异常:");
            e.printStackTrace();
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

    /**
     * 批量清空所有电影的视频URL（设置为未上传状态）
     */
    @PostMapping("/clear-videos")
    public ApiResponse<Void> clearAllVideoUrls(HttpServletRequest request) {
        try {
            // 检查用户角色，只有管理员可以操作
            String userRole = (String) request.getAttribute("userRole");
            if (userRole == null || !"ADMIN".equals(userRole)) {
                return ApiResponse.error(403, "权限不足，只有管理员可以执行此操作");
            }
            
            int count = movieService.clearAllVideoUrls();
            return ApiResponse.success("已将所有影片状态设置为未上传，共 " + count + " 条记录", null);
        } catch (Exception e) {
            System.err.println("清空视频URL失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新电影的视频URL（支持删除视频，传入空字符串）
     */
    @PutMapping("/{id}/video")
    public ApiResponse<Movie> updateMovieVideo(@PathVariable Long id, @RequestBody java.util.Map<String, String> requestBody, HttpServletRequest request) {
        try {
            String username = (String) request.getAttribute("username");
            if (username == null) {
                return ApiResponse.error(401, "用户未登录或Token无效");
            }
            
            String videoUrl = requestBody.get("videoUrl");
            // 允许空字符串来删除视频
            if (videoUrl == null) {
                return ApiResponse.error("视频URL参数不能为空");
            }
            
            Movie updatedMovie = movieService.updateMovieVideoUrl(id, videoUrl);
            String message = videoUrl.isEmpty() ? "视频资源删除成功" : "视频上传成功";
            return ApiResponse.success(message, updatedMovie);
        } catch (Exception e) {
            System.err.println("更新电影视频URL失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
}














