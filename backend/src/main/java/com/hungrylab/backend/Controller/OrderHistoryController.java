package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Entity.Order;
import com.hungrylab.backend.Entity.User;
import com.hungrylab.backend.Repository.OrderRepository;
import com.hungrylab.backend.Repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders/user")
public class OrderHistoryController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderHistoryController(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }


    @GetMapping("/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Long userId) {

        try {
            String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(currentUser).orElseThrow();
            
            // Fix: Getting the ID scalar rather than the User object for comparison
            Long currentUserId = user.getId();

            if (!currentUserId.equals(userId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            List<Order> orderList = orderRepository.findByUserId(userId);

            return ResponseEntity.ok(orderList);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

    }
}
