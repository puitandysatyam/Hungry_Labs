package com.hungrylab.backend.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Coupon")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code; // e.g. "WELCOME50"
    
    // "FLAT" for fixed amount (e.g., ₹50 off), "PERCENTAGE" for ratio (e.g., 20% off)
    private String discountType; 
    
    private Double discountValue;
    
    private Double minOrderValue;
    
    private boolean active = true;

}
