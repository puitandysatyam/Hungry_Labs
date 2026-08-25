package com.hungrylab.backend.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;

@Service
public class StorageService {

    @Value("${BUCKET_NAME}")
    private String b2Bucket;

    @Value("${keyID}")
    private String b2KeyId;

    @Value("${applicationKey}")
    private String b2AppKey;
    
    @Value("${B2_ENDPOINT}")
    private String b2Endpoint; 
    
    private S3Presigner getPresigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create(b2Endpoint))
                .region(Region.US_WEST_2) // Backblaze requires a region, even if fake, S3 SDK gets mad without it.
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(b2KeyId, b2AppKey)))
                .build();
    }

    public String generatePresignedUploadUrl(String fileName, String contentType) {
        S3Presigner presigner = getPresigner();

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(b2Bucket)
                .key("menu-images/" + fileName)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15)) // URL expires in 15 mins
                .putObjectRequest(objectRequest)
                .build();

        String url = presigner.presignPutObject(presignRequest).url().toString();
        presigner.close();
        
        return url;
    }
}
