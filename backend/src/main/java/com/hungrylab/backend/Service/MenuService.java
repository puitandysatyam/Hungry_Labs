package com.hungrylab.backend.Service;


import com.hungrylab.backend.Entity.Addon;
import com.hungrylab.backend.Entity.MenuItem;
import com.hungrylab.backend.Repository.MenuRepository;
import com.hungrylab.backend.dto.AddOnDto;
import com.hungrylab.backend.dto.MenuItemResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class MenuService {

    @Autowired
    private MenuRepository menuRepository;
    
    @Autowired
    private StorageService storageService;

    @Value("${B2_ENDPOINT}")
    private String b2Endpoint;

    @Value("${BUCKET_NAME}")
    private String bucketName;

    public List<MenuItemResponseDto> getMenu(){

        List<MenuItemResponseDto> menuItemResponseDtoList = new ArrayList<>();
        List<MenuItem> menuItemList = menuRepository.findAll();

        String baseStorageUrl = (b2Endpoint.endsWith("/") ? b2Endpoint : b2Endpoint + "/") + bucketName + "/";

        for( MenuItem menuItem : menuItemList){

            List<AddOnDto> addOnDtoList = new ArrayList<>();
            // Fix: The array variable in MenuItem is called addonList, not addons
            if (menuItem.getAddonList() != null) {
                for(Addon addon : menuItem.getAddonList()){
                    addOnDtoList.add(new AddOnDto(addon.getId(), addon.getName(), addon.getPrice()));
                }
            }
            
            String finalImageUrl = menuItem.getImageUrl();
            // Auto-generate Pre-signed GET URL for private B2 endpoints on the fly!
            if (finalImageUrl != null && finalImageUrl.startsWith(baseStorageUrl)) {
                try {
                    String objectKey = finalImageUrl.substring(baseStorageUrl.length());
                    // Decode URL-encoded characters (like %20 -> space) otherwise S3 presigner fails with NoSuchKey
                    objectKey = URLDecoder.decode(objectKey, StandardCharsets.UTF_8.name());
                    finalImageUrl = storageService.generatePresignedGetUrl(objectKey);
                } catch (Exception e) {
                    System.err.println("Failed to presign URL for " + finalImageUrl);
                }
            }
            
            menuItemResponseDtoList.add(new MenuItemResponseDto(
                    menuItem.getId(),
                    menuItem.getCategory(),
                    menuItem.getName(),
                    menuItem.getDesc(),
                    menuItem.getPrice(),
                    menuItem.isVeg(),
                    finalImageUrl,
                    addOnDtoList
            ));

        }

        return menuItemResponseDtoList;

    }
}
