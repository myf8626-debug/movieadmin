package com.movie.service;

import com.movie.entity.Movie;
import com.movie.entity.Category;
import com.movie.entity.User;
import com.movie.repository.MovieRepository;
import com.movie.repository.CategoryRepository;
import com.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MovieService {
    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<Movie> getAllMovies(Pageable pageable) {
        return movieRepository.findAll(pageable);
    }

    public Page<Movie> searchMovies(String keyword, Long categoryId, Pageable pageable) {
        if (keyword != null && !keyword.isEmpty() && categoryId != null) {
            return movieRepository.findByTitleContainingAndCategoryId(keyword, categoryId, pageable);
        } else if (keyword != null && !keyword.isEmpty()) {
            return movieRepository.findByTitleContaining(keyword, pageable);
        } else if (categoryId != null) {
            return movieRepository.findByCategoryId(categoryId, pageable);
        }
        return movieRepository.findAll(pageable);
    }

    public Movie getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("电影不存在"));
        movie.setViewCount(movie.getViewCount() + 1);
        return movieRepository.save(movie);
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

    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new RuntimeException("电影不存在");
        }
        movieRepository.deleteById(id);
    }
}














