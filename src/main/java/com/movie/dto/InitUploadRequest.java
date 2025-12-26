package com.movie.dto;

import lombok.Data;

@Data
public class InitUploadRequest {
    private String fileName;
    private Long fileSize;
    private String fileType;
    private Long chunkSize;
}



