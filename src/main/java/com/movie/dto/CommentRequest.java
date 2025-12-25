package com.movie.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class CommentRequest {
    @NotNull(message = "电影ID不能为空")
    private Long movieId;

    @NotBlank(message = "评论内容不能为空")
    private String content;
}




