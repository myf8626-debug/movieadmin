package com.movie.service;

import com.movie.dto.MovieVO;
import com.movie.entity.Movie;
import com.movie.entity.Category;
import com.movie.entity.User;
import com.movie.repository.MovieRepository;
import com.movie.repository.CategoryRepository;
import com.movie.repository.UserRepository;
import com.movie.repository.FavoriteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class MovieService {
    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    public Page<Movie> getAllMovies(Pageable pageable) {
        // 确保按ID升序排序
        return movieRepository.findAll(pageable);
    }

    public Page<Movie> searchMovies(String keyword, Long categoryId, Pageable pageable) {
        // 所有查询方法都会使用Pageable中的排序（已设置为按ID升序）
        if (keyword != null && !keyword.isEmpty() && categoryId != null) {
            return movieRepository.findByTitleContainingAndCategoryId(keyword, categoryId, pageable);
        } else if (keyword != null && !keyword.isEmpty()) {
            return movieRepository.findByTitleContaining(keyword, pageable);
        } else if (categoryId != null) {
            return movieRepository.findByCategoryId(categoryId, pageable);
        }
        // findAll也会使用Pageable中的排序
        return movieRepository.findAll(pageable);
    }

    public Movie getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("电影不存在"));
        movie.setViewCount(movie.getViewCount() + 1);
        return movieRepository.save(movie);
    }
    
    /**
     * 获取带收藏状态的电影详情
     * @param id 电影ID
     * @param username 当前用户名，可为null（未登录用户）
     * @return 带收藏状态的MovieVO
     */
    public MovieVO getMovieByIdWithFavoriteStatus(Long id, String username) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("电影不存在"));
        
        // 增加浏览量
        movie.setViewCount(movie.getViewCount() + 1);
        movieRepository.save(movie);
        
        // 转换为MovieVO
        MovieVO vo = MovieVO.fromMovie(movie);
        
        // 获取当前用户ID（如果已登录）
        Long userId = null;
        if (username != null && !username.trim().isEmpty()) {
            User user = userRepository.findByUsername(username).orElse(null);
            userId = (user != null) ? user.getId() : null;
        }
        
        // 查询收藏状态
        boolean isFavorited = false;
        if (userId != null && userId > 0) {
            try {
                Optional<com.movie.entity.Favorite> favorite = favoriteRepository.findByUserIdAndMovieId(userId, id);
                isFavorited = favorite.isPresent();
                System.out.println("电影详情 - 电影ID: " + id + ", 用户ID: " + userId + ", 收藏状态: " + isFavorited);
            } catch (Exception e) {
                System.err.println("查询收藏状态失败: " + e.getMessage());
                isFavorited = false;
            }
        }
        
        vo.setIsFavorited(isFavorited);
        return vo;
    }

    public Movie createMovie(Movie movie, String username) {
        User uploader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        movie.setUploader(uploader);
        if (movie.getCategory() != null && movie.getCategory().getId() != null) {
            Category category = categoryRepository.findById(movie.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("分类不存在"));
            movie.setCategory(category);
        }
        return movieRepository.save(movie);
    }

    public Movie updateMovie(Long id, Movie movie) {
        Movie existingMovie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("电影不存在"));
        existingMovie.setTitle(movie.getTitle());
        existingMovie.setDescription(movie.getDescription());
        existingMovie.setCoverImage(movie.getCoverImage());
        existingMovie.setVideoUrl(movie.getVideoUrl());
        existingMovie.setReleaseDate(movie.getReleaseDate());
        existingMovie.setDirector(movie.getDirector());
        existingMovie.setActors(movie.getActors());
        existingMovie.setDuration(movie.getDuration());
        existingMovie.setRating(movie.getRating());
        if (movie.getCategory() != null && movie.getCategory().getId() != null) {
            Category category = categoryRepository.findById(movie.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("分类不存在"));
            existingMovie.setCategory(category);
        }
        return movieRepository.save(existingMovie);
    }

    /**
     * 批量清空所有电影的视频URL
     */
    public int clearAllVideoUrls() {
        List<Movie> allMovies = movieRepository.findAll();
        int count = 0;
        for (Movie movie : allMovies) {
            movie.setVideoUrl(null);
            movieRepository.save(movie);
            count++;
        }
        return count;
    }

    /**
     * 更新电影的视频URL
     */
    public Movie updateMovieVideoUrl(Long id, String videoUrl) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("电影不存在"));
        movie.setVideoUrl(videoUrl);
        return movieRepository.save(movie);
    }

    /**
     * 删除电影（单条删除）
     * 删除前先删除favorites表中的关联记录，避免外键约束错误
     */
    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new RuntimeException("电影不存在");
        }
        // 先删除favorites表中关联该电影的所有收藏记录
        favoriteRepository.deleteByMovieId(id);
        // 再删除电影记录
        movieRepository.deleteById(id);
    }

    /**
     * 批量删除电影
     * 删除前先删除favorites表中的关联记录，避免外键约束错误
     * @param ids 电影ID列表
     */
    public void deleteMoviesBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new RuntimeException("删除列表不能为空");
        }
        
        // 检查所有电影是否存在
        List<Movie> movies = movieRepository.findAllById(ids);
        if (movies.size() != ids.size()) {
            throw new RuntimeException("部分电影不存在");
        }
        
        // 先删除favorites表中关联这些电影的所有收藏记录
        for (Long movieId : ids) {
            favoriteRepository.deleteByMovieId(movieId);
        }
        
        // 再批量删除电影记录
        movieRepository.deleteAllById(ids);
    }

    /**
     * 获取带收藏状态的电影列表
     * @param keyword 搜索关键词
     * @param categoryId 分类ID
     * @param pageable 分页参数
     * @param userId 当前用户ID，可为null（未登录用户）- 故障点2修复：直接接收 userId
     * @param sortBy 排序方式：favorite(收藏优先), hot(热度), rating(评分), viewCount(浏览量)
     * @return 带收藏状态的电影分页列表
     */
    public Page<MovieVO> searchMoviesWithFavoriteStatus(String keyword, Long categoryId, Pageable pageable, Long userId, String sortBy) {
        // 查询电影（查询中已按ID排序，Pageable也设置为按ID排序）
        Page<Movie> moviePage = searchMovies(keyword, categoryId, pageable);
        
        // 调试：打印查询结果的ID列表
        List<Long> movieIds = moviePage.getContent().stream()
            .map(Movie::getId)
            .collect(Collectors.toList());
        System.out.println("查询返回的电影ID列表（前10个）: " + movieIds.stream().limit(10).collect(Collectors.toList()));
        
        // 故障点2修复：直接使用传入的 userId，不再从 username 查询
        final Long finalUserId = userId;
        System.out.println("Service 层接收到的 userId: " + finalUserId);
        
        // 故障点3修复：获取当前用户收藏的电影ID列表
        List<Long> favoritedMovieIds = java.util.Collections.emptyList();
        if (finalUserId != null && finalUserId > 0) {
            try {
                // 方法1：使用 findByUserIdOrderByCreateTimeDesc 获取所有收藏记录
                List<com.movie.entity.Favorite> favorites = favoriteRepository.findByUserIdOrderByCreateTimeDesc(finalUserId);
                favoritedMovieIds = favorites.stream()
                    .map(f -> f.getMovie().getId())
                    .distinct() // 去重
                    .collect(Collectors.toList());
                
                // 如果方法1返回空，尝试方法2：使用 findByUserIdWithMovieAndCategory
                if (favoritedMovieIds.isEmpty()) {
                    List<com.movie.entity.Favorite> favorites2 = favoriteRepository.findByUserIdWithMovieAndCategory(finalUserId);
                    favoritedMovieIds = favorites2.stream()
                        .map(f -> f.getMovie().getId())
                        .distinct()
                        .collect(Collectors.toList());
                }
                
                System.out.println("成功获取用户收藏列表，用户ID: " + finalUserId + ", 收藏数量: " + favoritedMovieIds.size());
            } catch (Exception e) {
                // 如果查询失败，设置为空列表
                favoritedMovieIds = java.util.Collections.emptyList();
                System.err.println("获取收藏列表失败: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("用户未登录或用户ID为空，不查询收藏状态");
        }
        
        final List<Long> finalFavoritedMovieIds = favoritedMovieIds;
        
        // 调试：打印用户信息和收藏列表
        System.out.println("=== MovieService.searchMoviesWithFavoriteStatus ===");
        System.out.println("用户ID: " + finalUserId + ", 收藏的电影ID列表: " + favoritedMovieIds);
        System.out.println("收藏列表大小: " + (favoritedMovieIds != null ? favoritedMovieIds.size() : 0));
        
        // 故障点3修复：转换为MovieVO并设置收藏状态
        // 对每一部电影，明确执行查询并设置 isFavorited
        List<MovieVO> voList = moviePage.getContent().stream()
            .map(movie -> {
                MovieVO vo = MovieVO.fromMovie(movie);
                
                // 故障点3修复：核心逻辑 - 明确执行 COUNT 查询
                // SELECT COUNT(*) FROM favorites WHERE user_id = ? AND movie_id = ?
                boolean isFavorited = false;
                if (finalUserId != null && finalUserId > 0) {
                    // 方法1：使用收藏ID列表检查（批量查询，性能更好）
                    if (finalFavoritedMovieIds != null && !finalFavoritedMovieIds.isEmpty()) {
                        isFavorited = finalFavoritedMovieIds.contains(movie.getId());
                    } else {
                        // 方法2：如果列表为空，直接查询数据库（相当于 COUNT > 0）
                        try {
                            Optional<com.movie.entity.Favorite> favorite = favoriteRepository.findByUserIdAndMovieId(finalUserId, movie.getId());
                            // 如果 favorite.isPresent() 为 true，说明 COUNT > 0，即已收藏
                            isFavorited = favorite.isPresent();
                            
                            // 调试日志
                            if (moviePage.getContent().indexOf(movie) < 2) {
                                System.out.println("直接查询收藏状态 - 电影ID: " + movie.getId() + 
                                                 ", 用户ID: " + finalUserId + 
                                                 ", COUNT结果: " + (isFavorited ? "> 0 (已收藏)" : "= 0 (未收藏)"));
                            }
                        } catch (Exception e) {
                            System.err.println("查询电影收藏状态失败 - 电影ID: " + movie.getId() + ", 用户ID: " + finalUserId + ", 错误: " + e.getMessage());
                            isFavorited = false;
                        }
                    }
                }
                
                // 故障点3修复：这一步至关重要！明确设置收藏状态
                vo.setIsFavorited(isFavorited);
                
                // 调试日志：验证设置的值
                if (moviePage.getContent().indexOf(movie) < 2) {
                    System.out.println("✅ 设置收藏状态 - 电影ID: " + movie.getId() + 
                                     ", 标题: " + movie.getTitle() +
                                     ", isFavorited值: " + vo.getIsFavorited() + 
                                     ", 类型: " + (vo.getIsFavorited() != null ? vo.getIsFavorited().getClass().getSimpleName() : "null"));
                }
                
                // 调试日志：打印前3部电影的收藏状态
                if (moviePage.getContent().indexOf(movie) < 3) {
                    System.out.println("✅ 电影收藏状态检查 - 电影ID: " + movie.getId() + 
                                     ", 标题: " + movie.getTitle() + 
                                     ", 用户ID: " + finalUserId + 
                                     ", 是否收藏: " + isFavorited);
                }
                
                return vo;
            })
            .collect(Collectors.toList());
        
        // 所有情况下都按ID升序排序
        voList.sort((a, b) -> {
            return Long.compare(a.getId() != null ? a.getId() : 0, b.getId() != null ? b.getId() : 0);
        });
        
        return new PageImpl<>(voList, pageable, moviePage.getTotalElements());
    }
}














