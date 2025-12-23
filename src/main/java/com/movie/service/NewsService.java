package com.movie.service;

import com.movie.entity.News;
import com.movie.entity.User;
import com.movie.repository.NewsRepository;
import com.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NewsService {
    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<News> getAllNews(Pageable pageable) {
        return newsRepository.findAll(pageable);
    }

    public Page<News> searchNews(String keyword, Pageable pageable) {
        return newsRepository.findByTitleContaining(keyword, pageable);
    }

    public News getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("新闻不存在"));
        news.setViewCount(news.getViewCount() + 1);
        return newsRepository.save(news);
    }

    public News createNews(News news, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        news.setAuthor(author);
        return newsRepository.save(news);
    }

    public News updateNews(Long id, News news) {
        News existingNews = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("新闻不存在"));
        existingNews.setTitle(news.getTitle());
        existingNews.setContent(news.getContent());
        existingNews.setSummary(news.getSummary());
        existingNews.setCoverImage(news.getCoverImage());
        return newsRepository.save(existingNews);
    }

    public void deleteNews(Long id) {
        if (!newsRepository.existsById(id)) {
            throw new RuntimeException("新闻不存在");
        }
        newsRepository.deleteById(id);
    }
}














