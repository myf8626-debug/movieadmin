package com.movie.repository;

import com.movie.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    // 明确指定按ID升序排序，确保查询结果按ID排序
    @Query("SELECT m FROM Movie m WHERE m.title LIKE CONCAT('%', :keyword, '%') ORDER BY m.id ASC")
    Page<Movie> findByTitleContaining(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT m FROM Movie m WHERE m.category.id = :categoryId ORDER BY m.id ASC")
    Page<Movie> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);
    
    @Query("SELECT m FROM Movie m WHERE m.title LIKE CONCAT('%', :keyword, '%') AND m.category.id = :categoryId ORDER BY m.id ASC")
    Page<Movie> findByTitleContainingAndCategoryId(@Param("keyword") String keyword, @Param("categoryId") Long categoryId, Pageable pageable);
    
    /**
     * 查询电影列表，并在查询时判断是否被指定用户收藏
     * 使用LEFT JOIN favorites表来判断收藏状态
     */
    @Query(value = "SELECT m.*, " +
            "CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited " +
            "FROM movies m " +
            "LEFT JOIN favorites f ON m.id = f.movie_id AND f.user_id = :userId " +
            "WHERE (:keyword IS NULL OR :keyword = '' OR m.title LIKE CONCAT('%', :keyword, '%')) " +
            "AND (:categoryId IS NULL OR m.category_id = :categoryId) " +
            "ORDER BY m.id ASC",
            countQuery = "SELECT COUNT(*) FROM movies m " +
                    "WHERE (:keyword IS NULL OR :keyword = '' OR m.title LIKE CONCAT('%', :keyword, '%')) " +
                    "AND (:categoryId IS NULL OR m.category_id = :categoryId)",
            nativeQuery = true)
    Page<Object[]> findMoviesWithFavoriteStatus(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("userId") Long userId,
            Pageable pageable);
}














