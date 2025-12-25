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

    public Page<News> searchNews(String keyword, Integer status, Pageable pageable) {
        if (keyword != null && !keyword.isEmpty() && status != null) {
            return newsRepository.findByTitleContainingAndStatus(keyword, status, pageable);
        } else if (keyword != null && !keyword.isEmpty()) {
            return newsRepository.findByTitleContaining(keyword, pageable);
        } else if (status != null) {
            return newsRepository.findByStatus(status, pageable);
        } else {
            return newsRepository.findAll(pageable);
        }
    }

    public News getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("新闻不存在"));
        news.setViewCount(news.getViewCount() + 1);
        return newsRepository.save(news);
    }

    public News createNews(News news, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        news.setUser(user);
        // 如果author字段为空，使用用户名作为默认作者
        if (news.getAuthor() == null || news.getAuthor().isEmpty()) {
            news.setAuthor(username);
        }
        // 设置默认值
        if (news.getStatus() == null) {
            news.setStatus(0); // 默认为草稿
        }
        if (news.getIsTop() == null) {
            news.setIsTop(0); // 默认为普通
        }
        return newsRepository.save(news);
    }

    public News updateNews(Long id, News news) {
        News existingNews = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("新闻不存在"));
        existingNews.setTitle(news.getTitle());
        existingNews.setContent(news.getContent());
        existingNews.setSummary(news.getSummary());
        existingNews.setCoverImage(news.getCoverImage());
        existingNews.setAuthor(news.getAuthor());
        existingNews.setStatus(news.getStatus() != null ? news.getStatus() : 0);
        existingNews.setIsTop(news.getIsTop() != null ? news.getIsTop() : 0);
        return newsRepository.save(existingNews);
    }

    public void deleteNews(Long id) {
        if (!newsRepository.existsById(id)) {
            throw new RuntimeException("新闻不存在");
        }
        newsRepository.deleteById(id);
    }
}














