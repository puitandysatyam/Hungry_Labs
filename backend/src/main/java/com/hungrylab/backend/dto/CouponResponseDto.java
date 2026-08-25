package com.hungrylab.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponseDto {
    private boolean valid;
    private String message;
    
    // Details needed for frontend to update UI
    private String discountType;
    private Double discountValue;
    private Double minOrderValue;
}
