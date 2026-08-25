package com.hungrylab.backend.Repository;

import com.hungrylab.backend.Entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    // We will need this to look up a payment when the webhook arrives!
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}
