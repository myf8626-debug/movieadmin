package com.movie.repository;

import com.movie.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    Page<Movie> findByTitleContaining(String keyword, Pageable pageable);
    Page<Movie> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Movie> findByTitleContainingAndCategoryId(String keyword, Long categoryId, Pageable pageable);
}














