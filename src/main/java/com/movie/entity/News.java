package com.movie.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "news")
@Data
public class News {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String summary;

    @Column(name = "cover_image", length = 500)
    private String coverImage; // 封面图URL

    @Column(name = "author", length = 50)
    private String author; // 作者名称

    @Column(name = "status")
    private Integer status = 0; // 状态：1=已发布, 0=草稿

    @Column(name = "is_top")
    private Integer isTop = 0; // 是否置顶：1=置顶, 0=普通

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "create_time")
    private LocalDateTime createTime;

    @Column(name = "update_time")
    private LocalDateTime updateTime;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // 创建者用户（保留原有关联）

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}














