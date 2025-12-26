package com.movie.controller;

import com.movie.dto.ApiResponse;
import com.movie.dto.InitUploadRequest;
import com.movie.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/upload")
@CrossOrigin
public class UploadController {
    
    @Autowired
    private UploadService uploadService;
    
    /**
     * 初始化上传
     */
    @PostMapping("/init")
    public ApiResponse<Map<String, String>> initUpload(
            @RequestBody InitUploadRequest request,
            HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            
            // 检查用户是否已登录
            if (username == null) {
                return ApiResponse.error(401, "用户未登录或Token无效");
            }
            
            System.out.println("=== 初始化上传请求 ===");
            System.out.println("用户名: " + username);
            System.out.println("文件名: " + request.getFileName());
            System.out.println("文件大小: " + request.getFileSize());
            
            String uploadId = uploadService.initUpload(request, username);
            Map<String, String> data = new HashMap<>();
            data.put("uploadId", uploadId);
            return ApiResponse.success("初始化成功", data);
        } catch (Exception e) {
            System.err.println("初始化上传失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
    
    /**
     * 上传分片
     */
    @PostMapping("/chunk")
    public ApiResponse<Map<String, Object>> uploadChunk(
            @RequestParam("uploadId") String uploadId,
            @RequestParam("chunk") MultipartFile chunk,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            HttpServletRequest httpRequest) {
        long startTime = System.currentTimeMillis();
        try {
            String username = (String) httpRequest.getAttribute("username");
            
            // 检查用户是否已登录
            if (username == null) {
                return ApiResponse.error(401, "用户未登录或Token无效");
            }
            
            System.out.println("=== 开始上传分片 ===");
            System.out.println("uploadId: " + uploadId);
            System.out.println("chunkIndex: " + chunkIndex + "/" + totalChunks);
            System.out.println("chunkSize: " + chunk.getSize() + " bytes");
            
            uploadService.uploadChunk(uploadId, chunk, chunkIndex, totalChunks, username);
            
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("分片上传成功，耗时: " + duration + "ms");
            
            Map<String, Object> data = new HashMap<>();
            data.put("chunkIndex", chunkIndex);
            data.put("uploadedChunks", uploadService.getUploadedChunks(uploadId));
            data.put("totalChunks", totalChunks);
            return ApiResponse.success("分片上传成功", data);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            System.err.println("上传分片失败 (耗时: " + duration + "ms): " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
    
    /**
     * 查询已上传的分片
     */
    @GetMapping("/progress/{uploadId}")
    public ApiResponse<Map<String, Object>> getUploadProgress(
            @PathVariable String uploadId,
            HttpServletRequest httpRequest) {
        try {
            String username = (String) httpRequest.getAttribute("username");
            
            // 检查用户是否已登录
            if (username == null) {
                return ApiResponse.error(401, "用户未登录或Token无效");
            }
            
            Map<String, Object> progress = uploadService.getUploadProgress(uploadId, username);
            return ApiResponse.success(progress);
        } catch (Exception e) {
            System.err.println("查询上传进度失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
    
    /**
     * 完成上传
     */
    @PostMapping("/complete")
    public ApiResponse<Map<String, Object>> completeUpload(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String uploadId = request.get("uploadId");
            if (uploadId == null || uploadId.isEmpty()) {
                return ApiResponse.error("uploadId不能为空");
            }
            
            String username = (String) httpRequest.getAttribute("username");
            
            // 检查用户是否已登录
            if (username == null) {
                return ApiResponse.error(401, "用户未登录或Token无效");
            }
            
            String fileUrl = uploadService.completeUpload(uploadId, username);
            
            Map<String, Object> data = new HashMap<>();
            data.put("fileUrl", fileUrl);
            return ApiResponse.success("上传完成", data);
        } catch (Exception e) {
            System.err.println("完成上传失败: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(e.getMessage());
        }
    }
}

