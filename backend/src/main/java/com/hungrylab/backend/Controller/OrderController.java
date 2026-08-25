package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Service.OrderService;
import com.hungrylab.backend.dto.CouponRequestDto;
import com.hungrylab.backend.dto.CouponResponseDto;
import com.hungrylab.backend.dto.OrderRequestDto;
import com.hungrylab.backend.dto.OrderResponseDto;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*") 
public class OrderController {

    @Autowired
    OrderService orderService;

    @PostMapping("/")
    public ResponseEntity<?> handleOrder(@RequestBody OrderRequestDto orderRequest) {
        try {
            OrderResponseDto orderResponseDto = orderService.placeOrder(orderRequest);
            return ResponseEntity.ok(orderResponseDto);
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to initialize payment gateway: " + e.getMessage());
        } catch (Exception e) {
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
