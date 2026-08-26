package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Service.OrderService;
import com.hungrylab.backend.dto.CouponRequestDto;
import com.hungrylab.backend.dto.CouponResponseDto;
import com.hungrylab.backend.dto.OrderRequestDto;
import com.hungrylab.backend.dto.OrderResponseDto;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    OrderService orderService;

    @Value("${RAZORPAY_KEY_ID}")
    private String razorpayKeyId;

    // Send only the PUBLIC Key ID to the frontend so we don't have to hardcode it in Vue!
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getRazorpayConfig() {
        return ResponseEntity.ok(Map.of("keyId", razorpayKeyId));
    }

    @PostMapping("/")
    public ResponseEntity<?> handleOrder(@RequestBody OrderRequestDto orderRequest) {
        try {
            OrderResponseDto orderResponseDto = orderService.placeOrder(orderRequest);
            return ResponseEntity.ok(orderResponseDto);
        } catch (RazorpayException e) {
            logger.error("Razorpay exception: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to initialize payment gateway: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Order processing failed: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to process order: " + e.getMessage());
        }
    }

    // New Endpoint for UI Coupon Application
    @PostMapping("/applycoupon")
    public ResponseEntity<CouponResponseDto> applyCoupon(@RequestBody CouponRequestDto requestDto) {
        CouponResponseDto response = orderService.applyCoupon(requestDto.getCouponCode());
        return ResponseEntity.ok(response);
    }
}
