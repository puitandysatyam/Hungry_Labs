package com.hungrylab.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemResponseDto {
    private Long id;
    private String category;
    private String name;
    private String description;
    private Double price;
    private Boolean isVeg;
    private String imageUrl;
    private List<AddOnDto> addOns;
}
