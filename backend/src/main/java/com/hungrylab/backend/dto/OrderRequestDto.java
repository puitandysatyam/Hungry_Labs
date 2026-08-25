package com.hungrylab.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDto {
    private Long userId; 
    
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String deliveryAddress;
    
    private List<OrderItemRequestDto> items;
    
    private Double expectedTotalAmount; 
    private String couponCode;
    
    private String paymentStatus;
}
