package com.hungrylab.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDto {
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private List<OrderItemRequestDto> items;
    private Double totalAmount;
    private String couponCode;
    private String paymentStatus;
}
