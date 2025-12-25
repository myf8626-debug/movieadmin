package com.movie.repository;

import com.movie.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndMovieId(Long userId, Long movieId);
    
    List<Favorite> findByUserIdOrderByCreateTimeDesc(Long userId);
    
    /**
     * 统计用户的收藏数量
     */
    long countByUserId(Long userId);
    
    @Query("SELECT f FROM Favorite f JOIN FETCH f.movie m JOIN FETCH m.category WHERE f.user.id = :userId ORDER BY f.createTime DESC")
    List<Favorite> findByUserIdWithMovieDetails(@Param("userId") Long userId);
    
    /**
     * 根据用户ID查找所有收藏记录，并加载Movie和Category（用于分页查询）
     */
    @Query("SELECT f FROM Favorite f JOIN FETCH f.movie m LEFT JOIN FETCH m.category WHERE f.user.id = :userId ORDER BY f.createTime DESC")
    List<Favorite> findByUserIdWithMovieAndCategory(@Param("userId") Long userId);
    
    /**
     * 根据电影ID查找所有收藏记录
     */
    List<Favorite> findByMovieId(Long movieId);
    
    /**
     * 根据电影ID删除所有收藏记录
     */
    void deleteByMovieId(Long movieId);
    
    /**
     * 根据用户ID查询收藏的电影列表（直接返回Movie对象）
     * 使用JOIN FETCH确保Movie和Category都被正确加载
     */
    @Query("SELECT f.movie FROM Favorite f WHERE f.user.id = :userId ORDER BY f.createTime DESC")
    List<com.movie.entity.Movie> findMoviesByUserId(@Param("userId") Long userId);
    
    /**
     * 根据用户ID查询收藏的电影列表（带Category，使用JOIN FETCH）
     * 注意：由于JPQL限制，先查询Favorite再提取Movie
     */
    @Query("SELECT f FROM Favorite f JOIN FETCH f.movie m LEFT JOIN FETCH m.category WHERE f.user.id = :userId ORDER BY f.createTime DESC")
    List<Favorite> findFavoritesWithMoviesByUserId(@Param("userId") Long userId);
}




