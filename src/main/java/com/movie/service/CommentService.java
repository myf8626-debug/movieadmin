package com.movie.service;

import com.movie.dto.CommentRequest;
import com.movie.entity.Comment;
import com.movie.entity.Movie;
import com.movie.entity.User;
import com.movie.repository.CommentRepository;
import com.movie.repository.MovieRepository;
import com.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class CommentService {
    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    public Comment createComment(CommentRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("电影不存在"));

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setUsername(user.getUsername());
        comment.setMovie(movie);

        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByMovieId(Long movieId) {
        return commentRepository.findByMovieIdOrderByCreateTimeDesc(movieId);
    }

    /**
     * 删除评论
     * @param commentId 评论ID
     * @param username 当前用户名
     * @param userRole 当前用户角色
     * @throws RuntimeException 如果评论不存在或权限不足
     */
    public void deleteComment(Long commentId, String username, String userRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("评论不存在"));

        // 检查权限：管理员可以删除所有评论，普通用户只能删除自己的评论
        boolean isAdmin = userRole != null && "ADMIN".equals(userRole);
        
        // 比较用户名时去除空格，确保匹配
        String commentUsername = comment.getUsername() != null ? comment.getUsername().trim() : "";
        String currentUsername = username != null ? username.trim() : "";
        boolean isOwner = commentUsername.equals(currentUsername);

        // 添加调试日志
        System.out.println("=== 删除评论权限检查 ===");
        System.out.println("评论ID: " + commentId);
        System.out.println("评论作者: " + commentUsername);
        System.out.println("当前用户: " + currentUsername);
        System.out.println("用户角色: " + userRole);
        System.out.println("是管理员: " + isAdmin);
        System.out.println("是作者: " + isOwner);
        System.out.println("======================");

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("权限不足，只能删除自己的评论");
        }

        commentRepository.deleteById(commentId);
    }
}




