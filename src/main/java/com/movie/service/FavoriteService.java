package com.movie.service;

import com.movie.dto.MovieVO;
import com.movie.entity.Favorite;
import com.movie.entity.Movie;
import com.movie.entity.User;
import com.movie.repository.FavoriteRepository;
import com.movie.repository.MovieRepository;
import com.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FavoriteService {
    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    public boolean toggleFavorite(Long movieId, String username) {
        System.out.println("FavoriteService.toggleFavorite - username: " + username + ", movieId: " + movieId);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        System.out.println("FavoriteService.toggleFavorite - 用户ID: " + user.getId());

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("电影不存在"));
        System.out.println("FavoriteService.toggleFavorite - 电影ID: " + movie.getId());

        Optional<Favorite> existingFavorite = favoriteRepository.findByUserIdAndMovieId(user.getId(), movieId);
        System.out.println("FavoriteService.toggleFavorite - 是否已收藏: " + existingFavorite.isPresent());

        if (existingFavorite.isPresent()) {
            // 已收藏，取消收藏
            favoriteRepository.delete(existingFavorite.get());
            System.out.println("FavoriteService.toggleFavorite - 执行删除收藏操作");
            return false;
        } else {
            // 未收藏，添加收藏
            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setMovie(movie);
            favoriteRepository.save(favorite);
            System.out.println("FavoriteService.toggleFavorite - 执行添加收藏操作，新记录ID: " + favorite.getId());
            return true;
        }
    }

    public boolean checkFavorite(Long movieId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        return favoriteRepository.findByUserIdAndMovieId(user.getId(), movieId).isPresent();
    }

    public List<Favorite> getUserFavorites(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        return favoriteRepository.findByUserIdWithMovieDetails(user.getId());
    }

    /**
     * 获取用户收藏的电影列表（返回MovieVO）
     * 暂时固定userId为1用于测试
     */
    public List<MovieVO> getFavoriteMoviesByUserId(Long userId) {
        // 使用JOIN FETCH确保Movie和Category都被加载
        List<Favorite> favorites = favoriteRepository.findFavoritesWithMoviesByUserId(userId);
        
        // 转换为MovieVO
        return favorites.stream()
                .map(favorite -> {
                    Movie movie = favorite.getMovie();
                    MovieVO vo = MovieVO.fromMovie(movie);
                    vo.setIsFavorited(true); // 收藏列表中的电影都是已收藏的
                    return vo;
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取用户收藏的电影列表（分页）
     * 使用 JOIN FETCH 确保 Movie 和 Category 都被正确加载
     */
    public org.springframework.data.domain.Page<Movie> getUserFavoriteMovies(String username, org.springframework.data.domain.Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        // 使用 JOIN FETCH 确保 Movie 和 Category 都被加载
        List<Favorite> favorites = favoriteRepository.findByUserIdWithMovieAndCategory(user.getId());
        
        if (favorites.isEmpty()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }
        
        // 从 Favorite 中提取 Movie 对象（已经通过 JOIN FETCH 加载）
        List<Movie> movies = favorites.stream()
                .map(Favorite::getMovie)
                .collect(java.util.stream.Collectors.toList());
        
        // 手动分页
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), movies.size());
        List<Movie> pagedMovies = start < movies.size() ? movies.subList(start, end) : java.util.Collections.emptyList();
        
        return new org.springframework.data.domain.PageImpl<>(pagedMovies, pageable, movies.size());
    }
}




