package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.CommentRequest;
import com.movie.entity.Comment;
import com.movie.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/comments")
@CrossOrigin
public class CommentController {
    @Autowired
    private CommentService commentService;

    @PostMapping
    public ApiResponse<Comment> createComment(@Valid @RequestBody CommentRequest request, HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            if (username == null) {
                return ApiResponse.error("未登录");
            }
            
            // Validate request data
            if (request.getMovieId() == null) {
                return ApiResponse.error("电影ID不能为空");
            }
            if (request.getContent() == null || request.getContent().trim().isEmpty()) {
                return ApiResponse.error("评论内容不能为空");
            }
            
            // Check content length (safety check, though TEXT should handle it)
            if (request.getContent().length() > 10000) {
                return ApiResponse.error("评论内容过长，请控制在10000字以内");
            }
            
            Comment comment = commentService.createComment(request, username);
            return ApiResponse.success("评论成功", comment);
        } catch (org.hibernate.exception.GenericJDBCException e) {
            // Handle database constraint violations (must catch before RuntimeException)
            String errorMessage = "评论提交失败";
            if (e.getMessage() != null && e.getMessage().contains("Data too long")) {
                errorMessage = "评论内容过长，请缩短后重试";
            } else if (e.getMessage() != null && e.getMessage().contains("foreign key")) {
                errorMessage = "电影不存在或已被删除";
            }
            System.err.println("评论提交数据库错误: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(errorMessage);
        } catch (RuntimeException e) {
            // Handle business logic errors
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            // Handle other unexpected errors
            System.err.println("评论提交失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("评论提交失败，请稍后重试");
        }
    }

    @GetMapping("/movie/{movieId}")
    public ApiResponse<List<Comment>> getCommentsByMovie(@PathVariable Long movieId) {
        try {
            List<Comment> comments = commentService.getCommentsByMovieId(movieId);
            return ApiResponse.success(comments);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(@PathVariable Long id, HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            String userRole = (String) httpRequest.getAttribute("userRole");
            
            System.out.println("=== 删除评论请求 ===");
            System.out.println("评论ID: " + id);
            System.out.println("用户名: " + username);
            System.out.println("用户角色: " + userRole);
            System.out.println("==================");
            
            if (username == null) {
                return ApiResponse.error("未登录");
            }

            commentService.deleteComment(id, username, userRole);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            System.err.println("删除评论失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
}




