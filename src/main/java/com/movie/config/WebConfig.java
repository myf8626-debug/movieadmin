package com.movie.config;

import com.movie.interceptor.JwtInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private JwtInterceptor jwtInterceptor;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${file.upload.files-dir:D:/project/movie-uploads}")
    private String filesDir;

    @Value("${file.upload.simple-dir:D:/movie_uploads}")
    private String simpleUploadDir;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/auth/login", "/auth/register", "/news/list", "/movies/list", "/categories/list", 
                        "/comments/movie/**", "/favorites/check/**", "/error", "/uploads/**", "/files/**", "/upload");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置静态资源访问路径
        // 注意：由于 server.servlet.context-path=/api，访问 /api/uploads/** 时
        // Spring Boot 会自动去掉 context-path，实际匹配的是 /uploads/**
        String uploadPath = new File(uploadDir).getAbsolutePath();
        System.out.println("配置静态资源映射: /uploads/** -> " + uploadPath);
        
        // 映射 /uploads/** 到文件系统（context-path 会自动处理）
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + File.separator)
                .setCachePeriod(0); // 不缓存，确保视频文件实时更新
        
        System.out.println("静态资源映射配置完成，文件访问路径: /api/uploads/**");
        
        // 映射 /files/** 到简单上传目录（D:/movie_uploads/）
        // 统一使用 simpleUploadDir 作为文件存储目录
        File filesDirectory = new File(simpleUploadDir);
        if (!filesDirectory.exists()) {
            boolean created = filesDirectory.mkdirs();
            if (created) {
                System.out.println("自动创建文件目录: " + simpleUploadDir);
            } else {
                System.err.println("无法创建文件目录: " + simpleUploadDir);
            }
        }
        
        String filesPath = filesDirectory.getAbsolutePath();
        System.out.println("配置静态资源映射: /files/** -> " + filesPath);
        
        // 映射 /files/** 到文件系统（context-path 会自动处理）
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + filesPath + File.separator)
                .setCachePeriod(3600); // 缓存1小时
        
        System.out.println("静态资源映射配置完成，文件访问路径: /api/files/**");
    }
}

