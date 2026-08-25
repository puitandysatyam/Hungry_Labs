package com.hungrylab.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequestDto {
    private Long menuItemId;
    private Integer quantity;
    
    // Changed to Long IDs based on your instruction!
    private List<Long> selectedAddOnIds;
}
