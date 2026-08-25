package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Entity.Addon;
import com.hungrylab.backend.Entity.Coupon;
import com.hungrylab.backend.Entity.MenuItem;
import com.hungrylab.backend.Repository.AddonRepository;
import com.hungrylab.backend.Repository.CouponRepository;
import com.hungrylab.backend.Repository.MenuRepository;
import com.hungrylab.backend.Service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") 
public class AdminController {

    private final MenuRepository menuRepository;
    private final AddonRepository addonRepository;
    private final CouponRepository couponRepository;
    private final StorageService storageService;

    public AdminController(MenuRepository menuRepository, AddonRepository addonRepository, CouponRepository couponRepository, StorageService storageService) {
        this.menuRepository = menuRepository;
        this.addonRepository = addonRepository;
        this.couponRepository = couponRepository;
        this.storageService = storageService;
    }

    // 1. Cloud Storage Presigned URL Endpoint
    @GetMapping("/upload-url")
    public ResponseEntity<Map<String, String>> getUploadUrl(@RequestParam String filename, @RequestParam String contentType) {
        // Generate a random UUID so we don't accidentally overwrite files with the same name
        String secureFilename = UUID.randomUUID().toString() + "-" + filename;
        String url = storageService.generatePresignedUploadUrl(secureFilename, contentType);
        
        // Return both the URL to upload to, and the final URL it WILL be at so the frontend can save it to the DB!
        return ResponseEntity.ok(Map.of(
            "uploadUrl", url,
            "finalUrl", "https://YOUR_BUCKET_NAME.s3.us-west-002.backblazeb2.com/menu-images/" + secureFilename
        ));
    }

    // 2. Menu Item CRUD (Category C Boilerplate)
    @PostMapping("/menu")
    public ResponseEntity<MenuItem> addMenuItem(@RequestBody MenuItem menuItem) {
        return ResponseEntity.ok(menuRepository.save(menuItem));
    }
    
    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem updatedItem) {
        MenuItem existing = menuRepository.findById(id).orElseThrow();
        existing.setName(updatedItem.getName());
        existing.setDesc(updatedItem.getDesc());
        existing.setPrice(updatedItem.getPrice());
        existing.setCategory(updatedItem.getCategory());
        existing.setImageUrl(updatedItem.getImageUrl());
        return ResponseEntity.ok(menuRepository.save(existing));
    }

    // 3. Addon CRUD
    @PostMapping("/addons")
    public ResponseEntity<Addon> addAddon(@RequestBody Addon addon) {
        return ResponseEntity.ok(addonRepository.save(addon));
    }

    // 4. Coupon CRUD
    @PostMapping("/coupons")
    public ResponseEntity<Coupon> addCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponRepository.save(coupon));
    }
}
