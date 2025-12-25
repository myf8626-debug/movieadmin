package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.MovieVO;
import com.movie.entity.Movie;
import com.movie.service.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/favorites")
@CrossOrigin
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;

    @PostMapping("/toggle")
    public ApiResponse<Map<String, Object>> toggleFavorite(@RequestBody Map<String, Long> request, HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            if (username == null) {
                return ApiResponse.error("未登录");
            }
            Long movieId = request.get("movieId");
            if (movieId == null) {
                return ApiResponse.error("电影ID不能为空");
            }
            boolean isFavorited = favoriteService.toggleFavorite(movieId, username);
            Map<String, Object> result = new HashMap<>();
            result.put("isFavorited", isFavorited);
            return ApiResponse.success(isFavorited ? "收藏成功" : "取消收藏成功", result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/check/{movieId}")
    public ApiResponse<Map<String, Boolean>> checkFavorite(@PathVariable Long movieId, HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            if (username == null) {
                Map<String, Boolean> result = new HashMap<>();
                result.put("isFavorited", false);
                return ApiResponse.success(result);
            }
            boolean isFavorited = favoriteService.checkFavorite(movieId, username);
            Map<String, Boolean> result = new HashMap<>();
            result.put("isFavorited", isFavorited);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/list")
    public ApiResponse<List<MovieVO>> getFavoriteList(HttpServletRequest httpRequest) {
        try {
            // 暂时固定userId为1用于测试
            Long userId = 1L;
            
            // 后续可以从request中获取当前用户ID
            // String username = (String) httpRequest.getAttribute("username");
            // if (username == null) {
            //     return ApiResponse.error("未登录");
            // }
            // User user = userRepository.findByUsername(username)
            //         .orElseThrow(() -> new RuntimeException("用户不存在"));
            // Long userId = user.getId();
            
            List<MovieVO> movies = favoriteService.getFavoriteMoviesByUserId(userId);
            return ApiResponse.success(movies);
        } catch (Exception e) {
            e.printStackTrace(); // 打印异常堆栈以便调试
            return ApiResponse.error("获取收藏列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取我的收藏电影列表（分页，返回MovieVO）
     */
    @GetMapping("/movies")
    public ApiResponse<Page<MovieVO>> getFavoriteMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            if (username == null) {
                return ApiResponse.error("未登录");
            }
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
            Page<Movie> moviePage = favoriteService.getUserFavoriteMovies(username, pageable);
            
            // 转换为MovieVO，并设置isFavorited为true（因为这些都是收藏的电影）
            List<MovieVO> voList = moviePage.getContent().stream()
                    .map(movie -> {
                        MovieVO vo = MovieVO.fromMovie(movie);
                        vo.setIsFavorited(true); // 收藏列表中的电影都是已收藏的
                        return vo;
                    })
                    .collect(Collectors.toList());
            
            Page<MovieVO> voPage = new org.springframework.data.domain.PageImpl<>(
                    voList, pageable, moviePage.getTotalElements());
            
            return ApiResponse.success(voPage);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}




