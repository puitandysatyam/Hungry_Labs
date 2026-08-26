package com.hungrylab.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "orders") // "order" is a reserved keyword in SQL (ORDER BY)
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long Id;

    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String deliveryAddress;

    @ManyToOne
    @JoinColumn(name = "UserID")
    @JsonIgnore // Prevents infinite recursion and hides sensitive user data
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItemList;

    private double totalAmount;
    private String status;

}
