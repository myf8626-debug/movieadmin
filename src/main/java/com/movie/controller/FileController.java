package com.movie.controller;

import com.movie.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/files")
@CrossOrigin
public class FileController {

    @Value("${file.upload.files-dir:D:/project/movie-uploads}")
    private String uploadDir;

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    /**
     * 文件上传接口
     * @param file 上传的文件
     * @param request HttpServletRequest
     * @return 文件访问URL
     */
    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
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

            // 构建文件访问URL
            // 注意：由于 context-path 是 /api，所以完整URL是 /api/files/uuid-filename.ext
            String fileUrl = contextPath + "/files/" + newFilename;

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

