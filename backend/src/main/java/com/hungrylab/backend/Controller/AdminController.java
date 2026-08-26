package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Entity.Addon;
import com.hungrylab.backend.Entity.Coupon;
import com.hungrylab.backend.Entity.MenuItem;
import com.hungrylab.backend.Entity.Order;
import com.hungrylab.backend.Repository.AddonRepository;
import com.hungrylab.backend.Repository.CouponRepository;
import com.hungrylab.backend.Repository.MenuRepository;
import com.hungrylab.backend.Repository.OrderRepository;
import com.hungrylab.backend.Service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MenuRepository menuRepository;
    private final AddonRepository addonRepository;
    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final StorageService storageService;

    @Value("${B2_ENDPOINT}")
    private String b2Endpoint;

    @Value("${BUCKET_NAME}")
    private String bucketName;

    public AdminController(MenuRepository menuRepository, AddonRepository addonRepository, CouponRepository couponRepository, OrderRepository orderRepository, StorageService storageService) {
        this.menuRepository = menuRepository;
        this.addonRepository = addonRepository;
        this.couponRepository = couponRepository;
        this.orderRepository = orderRepository;
        this.storageService = storageService;
    }

    // 1. Cloud Storage Presigned URL Endpoint
    @GetMapping("/upload-url")
    public ResponseEntity<Map<String, String>> getUploadUrl(@RequestParam String filename, @RequestParam String contentType) {
        String secureFilename = UUID.randomUUID().toString() + "-" + filename;
        String url = storageService.generatePresignedUploadUrl(secureFilename, contentType);
        String cleanEndpoint = b2Endpoint.endsWith("/") ? b2Endpoint : b2Endpoint + "/";
        String finalUrl = cleanEndpoint + bucketName + "/menu-images/" + secureFilename;
        return ResponseEntity.ok(Map.of("uploadUrl", url, "finalUrl", finalUrl));
    }

    // 2. Menu Item CRUD
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
        existing.setVeg(updatedItem.isVeg()); // Fixed
        existing.setAddonList(updatedItem.getAddonList()); // Fixed
        return ResponseEntity.ok(menuRepository.save(existing));
    }

    // 3. Addon CRUD
    @GetMapping("/addons")
    public ResponseEntity<List<Addon>> getAllAddons() {
        return ResponseEntity.ok(addonRepository.findAll());
    }

    @PostMapping("/addons")
    public ResponseEntity<Addon> addAddon(@RequestBody Addon addon) {
        return ResponseEntity.ok(addonRepository.save(addon));
    }
    
    @PutMapping("/addons/{id}")
    public ResponseEntity<Addon> updateAddon(@PathVariable Long id, @RequestBody Addon updatedAddon) {
        Addon existing = addonRepository.findById(id).orElseThrow();
        existing.setName(updatedAddon.getName());
        existing.setPrice(updatedAddon.getPrice());
        return ResponseEntity.ok(addonRepository.save(existing));
    }

    // 4. Coupon CRUD
    @PostMapping("/coupons")
    public ResponseEntity<Coupon> addCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    // 5. Orders & Live Queue (Short Polling Endpoints)
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @GetMapping("/orders/active")
    public ResponseEntity<List<Order>> getActiveOrders() {
        List<Order> allOrders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        // Filter out completed/cancelled/pending-payment orders to only show actionable ones
        List<Order> activeOrders = allOrders.stream()
            .filter(o -> "CONFIRMED".equals(o.getStatus()) || "PREPARING".equals(o.getStatus()) || "OUT_FOR_DELIVERY".equals(o.getStatus()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(activeOrders);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        Order order = orderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        return ResponseEntity.ok(orderRepository.save(order));
    }
}
