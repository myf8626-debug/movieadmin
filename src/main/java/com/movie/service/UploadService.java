package com.movie.service;

import com.movie.dto.InitUploadRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UploadService {
    
    @Value("${file.upload.dir:uploads}")
    private String uploadDir;
    
    @Value("${file.upload.url-prefix:/api/uploads}")
    private String urlPrefix;
    
    // 存储上传会话信息：uploadId -> UploadSession
    private final Map<String, UploadSession> uploadSessions = new ConcurrentHashMap<>();
    
    // 存储已上传的分片：uploadId -> Set<chunkIndex>
    private final Map<String, Set<Integer>> uploadedChunks = new ConcurrentHashMap<>();
    
    // 最大文件大小：10GB
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024 * 1024;
    
    /**
     * 初始化上传会话
     */
    public String initUpload(InitUploadRequest request, String username) {
        // 验证文件大小
        if (request.getFileSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("文件大小超出限制，最大支持10GB");
        }
        
        // 验证文件名
        if (request.getFileName() == null || request.getFileName().isEmpty()) {
            throw new IllegalArgumentException("文件名不能为空");
        }
        
        // 生成唯一的上传ID
        String uploadId = UUID.randomUUID().toString();
        
        // 创建上传会话
        UploadSession session = new UploadSession();
        session.setUploadId(uploadId);
        session.setFileName(request.getFileName());
        session.setFileSize(request.getFileSize());
        session.setFileType(request.getFileType());
        session.setChunkSize(request.getChunkSize() != null ? request.getChunkSize() : 5 * 1024 * 1024L);
        session.setUsername(username);
        session.setStatus("IN_PROGRESS");
        session.setCreateTime(new Date());
        
        // 计算总分片数
        long totalChunks = (request.getFileSize() + session.getChunkSize() - 1) / session.getChunkSize();
        session.setTotalChunks((int) totalChunks);
        
        // 保存会话
        uploadSessions.put(uploadId, session);
        uploadedChunks.put(uploadId, new HashSet<>());
        
        // 创建临时目录
        Path tempDir = Paths.get(uploadDir, "temp", uploadId);
        try {
            Files.createDirectories(tempDir);
        } catch (IOException e) {
            throw new RuntimeException("创建上传目录失败: " + e.getMessage());
        }
        
        System.out.println("初始化上传会话成功: uploadId=" + uploadId + ", fileName=" + request.getFileName() + ", totalChunks=" + totalChunks);
        
        return uploadId;
    }
    
    /**
     * 上传分片
     */
    public void uploadChunk(String uploadId, MultipartFile chunk, int chunkIndex, int totalChunks, String username) {
        // 验证上传会话
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new IllegalArgumentException("上传会话不存在或已过期");
        }
        
        // 验证用户权限
        if (!session.getUsername().equals(username)) {
            throw new IllegalArgumentException("无权访问此上传会话");
        }
        
        // 验证分片索引
        if (chunkIndex < 0 || chunkIndex >= totalChunks) {
            throw new IllegalArgumentException("分片索引错误");
        }
        
        // 保存分片到临时目录
        Path tempDir = Paths.get(uploadDir, "temp", uploadId);
        Path chunkFile = tempDir.resolve("chunk_" + chunkIndex);
        
        try {
            // 使用流式写入，避免一次性加载所有字节到内存
            try (java.io.InputStream inputStream = chunk.getInputStream();
                 java.io.FileOutputStream outputStream = new java.io.FileOutputStream(chunkFile.toFile());
                 java.io.BufferedOutputStream bufferedOutputStream = new java.io.BufferedOutputStream(outputStream, 8192)) {
                
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    bufferedOutputStream.write(buffer, 0, bytesRead);
                }
                bufferedOutputStream.flush();
            }
            
            // 记录已上传的分片
            uploadedChunks.get(uploadId).add(chunkIndex);
            
            System.out.println("分片上传成功: uploadId=" + uploadId + ", chunkIndex=" + chunkIndex + "/" + totalChunks + ", size=" + chunk.getSize() + " bytes");
        } catch (IOException e) {
            throw new RuntimeException("保存分片失败: " + e.getMessage());
        }
    }
    
    /**
     * 完成上传，合并分片
     */
    public String completeUpload(String uploadId, String username) {
        // 验证上传会话
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new IllegalArgumentException("上传会话不存在或已过期");
        }
        
        // 验证用户权限
        if (!session.getUsername().equals(username)) {
            throw new IllegalArgumentException("无权访问此上传会话");
        }
        
        // 验证所有分片是否已上传
        Set<Integer> uploaded = uploadedChunks.get(uploadId);
        if (uploaded.size() != session.getTotalChunks()) {
            throw new IllegalArgumentException("分片未完全上传，已上传: " + uploaded.size() + "/" + session.getTotalChunks());
        }
        
        // 合并分片
        Path tempDir = Paths.get(uploadDir, "temp", uploadId);
        Path finalFile = Paths.get(uploadDir, "videos", session.getFileName());
        
        try {
            // 创建目标目录
            Files.createDirectories(finalFile.getParent());
            
            // 按顺序合并所有分片（使用流式操作，避免内存溢出）
            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(finalFile.toFile());
                 java.io.BufferedOutputStream bos = new java.io.BufferedOutputStream(fos, 8192)) {
                
                for (int i = 0; i < session.getTotalChunks(); i++) {
                    Path chunkFile = tempDir.resolve("chunk_" + i);
                    if (!Files.exists(chunkFile)) {
                        throw new RuntimeException("分片文件不存在: chunk_" + i);
                    }
                    
                    // 使用流式读取和写入
                    try (java.io.FileInputStream fis = new java.io.FileInputStream(chunkFile.toFile());
                         java.io.BufferedInputStream bis = new java.io.BufferedInputStream(fis, 8192)) {
                        
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = bis.read(buffer)) != -1) {
                            bos.write(buffer, 0, bytesRead);
                        }
                    }
                    System.out.println("已合并分片: " + (i + 1) + "/" + session.getTotalChunks());
                }
                bos.flush();
            }
            
            // 生成文件URL
            // 注意：文件名可能包含特殊字符（中文、空格等），但不需要手动编码
            // Spring Boot 的静态资源处理器和浏览器会自动处理URL编码
            // 如果手动编码，可能导致文件路径不匹配
            String fileUrl = urlPrefix + "/videos/" + session.getFileName();
            System.out.println("生成的文件URL: " + fileUrl);
            System.out.println("文件实际路径: " + finalFile.toAbsolutePath().toString());
            
            // 验证文件是否存在
            if (!Files.exists(finalFile)) {
                throw new RuntimeException("合并后的文件不存在: " + finalFile.toString());
            }
            
            // 验证文件大小
            long fileSize = Files.size(finalFile);
            System.out.println("文件合并完成，实际大小: " + fileSize + " bytes, 期望大小: " + session.getFileSize() + " bytes");
            
            if (Math.abs(fileSize - session.getFileSize()) > 1024) { // 允许1KB误差
                System.err.println("警告: 文件大小不匹配！实际: " + fileSize + ", 期望: " + session.getFileSize());
            }
            
            // 清理临时文件
            try {
                Files.walk(tempDir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
            } catch (Exception e) {
                System.err.println("清理临时文件失败: " + e.getMessage());
            }
            
            // 更新会话状态
            session.setStatus("COMPLETED");
            session.setFileUrl(fileUrl);
            
            System.out.println("上传完成: uploadId=" + uploadId + ", fileUrl=" + fileUrl);
            
            return fileUrl;
        } catch (IOException e) {
            throw new RuntimeException("合并分片失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取已上传的分片数量
     */
    public int getUploadedChunks(String uploadId) {
        Set<Integer> chunks = uploadedChunks.get(uploadId);
        return chunks != null ? chunks.size() : 0;
    }
    
    /**
     * 获取上传进度信息
     */
    public Map<String, Object> getUploadProgress(String uploadId, String username) {
        // 验证上传会话
        UploadSession session = uploadSessions.get(uploadId);
        if (session == null) {
            throw new IllegalArgumentException("上传会话不存在或已过期");
        }
        
        // 验证用户权限
        if (!session.getUsername().equals(username)) {
            throw new IllegalArgumentException("无权访问此上传会话");
        }
        
        Set<Integer> uploaded = uploadedChunks.get(uploadId);
        int uploadedCount = uploaded != null ? uploaded.size() : 0;
        
        Map<String, Object> progress = new HashMap<>();
        progress.put("uploadId", uploadId);
        progress.put("fileName", session.getFileName());
        progress.put("fileSize", session.getFileSize());
        progress.put("totalChunks", session.getTotalChunks());
        progress.put("uploadedChunks", uploadedCount);
        progress.put("uploadedChunkIndices", uploaded != null ? new ArrayList<>(uploaded) : new ArrayList<>());
        progress.put("status", session.getStatus());
        progress.put("percentage", session.getTotalChunks() > 0 
            ? Math.round((uploadedCount * 100.0) / session.getTotalChunks()) : 0);
        
        return progress;
    }
    
    /**
     * 上传会话信息
     */
    private static class UploadSession {
        private String uploadId;
        private String fileName;
        private Long fileSize;
        private String fileType;
        private Long chunkSize;
        private int totalChunks;
        private String username;
        private String status;
        private Date createTime;
        private String fileUrl;
        
        // Getters and Setters
        public String getUploadId() { return uploadId; }
        public void setUploadId(String uploadId) { this.uploadId = uploadId; }
        
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        
        public Long getFileSize() { return fileSize; }
        public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
        
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        
        public Long getChunkSize() { return chunkSize; }
        public void setChunkSize(Long chunkSize) { this.chunkSize = chunkSize; }
        
        public int getTotalChunks() { return totalChunks; }
        public void setTotalChunks(int totalChunks) { this.totalChunks = totalChunks; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public Date getCreateTime() { return createTime; }
        public void setCreateTime(Date createTime) { this.createTime = createTime; }
        
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    }
}

