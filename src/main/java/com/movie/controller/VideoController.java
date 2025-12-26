package com.movie.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
@CrossOrigin
public class VideoController {
    
    @Value("${file.upload.dir:uploads}")
    private String uploadDir;
    
    /**
     * 视频文件流式传输，支持Range请求
     */
    @GetMapping("/videos/**")
    public ResponseEntity<Resource> getVideo(@RequestHeader(value = "Range", required = false) String rangeHeader,
                                             HttpServletRequest request) {
        try {
            // 获取请求的文件路径
            String requestURI = request.getRequestURI();
            // 去掉 /api/uploads/videos/ 前缀，获取实际文件路径
            String filePath = requestURI.replaceFirst(".*/uploads/videos/", "");
            
            // 解码URL（处理中文字符）
            filePath = java.net.URLDecoder.decode(filePath, "UTF-8");
            
            // 构建完整文件路径
            Path videoPath = Paths.get(uploadDir, "videos", filePath);
            File videoFile = videoPath.toFile();
            
            if (!videoFile.exists() || !videoFile.isFile()) {
                System.err.println("视频文件不存在: " + videoPath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(videoFile);
            long fileSize = videoFile.length();
            
            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("video/mp4"));
            headers.add("Accept-Ranges", "bytes");
            headers.setContentLength(fileSize);
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            headers.set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
            
            // 处理Range请求（视频流播放必需）
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String rangeValue = rangeHeader.substring(6);
                String[] ranges = rangeValue.split("-");
                long rangeStart = 0;
                long rangeEnd = fileSize - 1;
                
                if (ranges.length >= 1 && !ranges[0].isEmpty()) {
                    rangeStart = Long.parseLong(ranges[0]);
                }
                if (ranges.length >= 2 && !ranges[1].isEmpty()) {
                    rangeEnd = Long.parseLong(ranges[1]);
                }
                
                long contentLength = rangeEnd - rangeStart + 1;
                headers.setContentLength(contentLength);
                headers.set("Content-Range", String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileSize));
                
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .headers(headers)
                        .body(new RangeFileSystemResource(videoFile, rangeStart, rangeEnd));
            }
            
            // 非Range请求，返回完整文件
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            System.err.println("获取视频文件失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 支持Range请求的文件资源
     */
    private static class RangeFileSystemResource extends FileSystemResource {
        private final long rangeStart;
        private final long rangeEnd;
        
        public RangeFileSystemResource(File file, long rangeStart, long rangeEnd) {
            super(file);
            this.rangeStart = rangeStart;
            this.rangeEnd = rangeEnd;
        }
        
        @Override
        public long contentLength() throws IOException {
            return rangeEnd - rangeStart + 1;
        }
        
        @Override
        public java.io.InputStream getInputStream() throws IOException {
            java.io.RandomAccessFile raf = new java.io.RandomAccessFile(getFile(), "r");
            raf.seek(rangeStart);
            return new java.io.InputStream() {
                private long remaining = rangeEnd - rangeStart + 1;
                
                @Override
                public int read() throws IOException {
                    if (remaining <= 0) {
                        raf.close();
                        return -1;
                    }
                    remaining--;
                    return raf.read();
                }
                
                @Override
                public int read(byte[] b, int off, int len) throws IOException {
                    if (remaining <= 0) {
                        raf.close();
                        return -1;
                    }
                    int toRead = (int) Math.min(len, remaining);
                    int read = raf.read(b, off, toRead);
                    if (read > 0) {
                        remaining -= read;
                    }
                    if (remaining <= 0) {
                        raf.close();
                    }
                    return read;
                }
                
                @Override
                public void close() throws IOException {
                    raf.close();
                }
            };
        }
    }
}

