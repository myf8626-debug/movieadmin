package com.movie.controller;

import com.movie.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/upload")
@CrossOrigin
public class SimpleUploadController {

    @Value("${file.upload.simple-dir:D:/movie_uploads}")
    private String uploadDir;
    
    // 注意：上传的文件会保存到 uploadDir，但访问URL使用 /files/** 路径
    // 确保 WebConfig 中 /files/** 映射到相同的目录

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Value("${server.port:8080}")
    private int serverPort;

    /**
     * 简单的文件上传接口
     * POST /api/upload
     * 
     * @param file 上传的文件
     * @return 文件访问URL
     */
    @PostMapping
    public ApiResponse<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file) {
        try {
            // 检查文件是否为空
            if (file.isEmpty()) {
                return ApiResponse.error("文件不能为空");
            }

            // 获取原始文件名
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                return ApiResponse.error("文件名不能为空");
            }

            // 获取文件扩展名
            String extension = "";
            int lastDotIndex = originalFilename.lastIndexOf('.');
            if (lastDotIndex > 0) {
                extension = originalFilename.substring(lastDotIndex);
            }

            // 使用 UUID 重命名文件，防止文件名冲突
            String uuid = UUID.randomUUID().toString();
            String newFilename = uuid + extension;

            // 确保上传目录存在
            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                boolean created = uploadDirectory.mkdirs();
                if (!created) {
                    System.err.println("无法创建上传目录: " + uploadDir);
                    return ApiResponse.error("无法创建上传目录");
                }
                System.out.println("创建上传目录: " + uploadDir);
            }

            // 保存文件到本地磁盘
            Path filePath = Paths.get(uploadDir, newFilename);
            Files.write(filePath, file.getBytes());

            System.out.println("文件上传成功:");
            System.out.println("  原始文件名: " + originalFilename);
            System.out.println("  新文件名: " + newFilename);
            System.out.println("  文件大小: " + file.getSize() + " bytes");
            System.out.println("  保存路径: " + filePath.toAbsolutePath());

            // 构建完整的文件访问URL
            // 格式: http://localhost:8080/api/files/uuid-filename.ext
            // 注意：contextPath 通常包含 /api，所以不需要重复添加
            String fileUrl;
            if (contextPath.endsWith("/")) {
                fileUrl = String.format("http://localhost:%d%sfiles/%s", 
                        serverPort, contextPath, newFilename);
            } else {
                fileUrl = String.format("http://localhost:%d%s/files/%s", 
                        serverPort, contextPath, newFilename);
            }
            
            System.out.println("生成的文件访问URL: " + fileUrl);

            Map<String, String> data = new HashMap<>();
            data.put("url", fileUrl);
            data.put("filename", newFilename);
            data.put("originalFilename", originalFilename);
            data.put("size", String.valueOf(file.getSize()));

            return ApiResponse.success("文件上传成功", data);
        } catch (IOException e) {
            System.err.println("文件上传失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("文件上传异常: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error("文件上传异常: " + e.getMessage());
        }
    }
}

