package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> processPayment(@RequestBody String payload, @RequestHeader("x-razorpay-signature") String signature) {
        
        boolean isProcessed = paymentService.processWebhook(payload, signature);

        if (isProcessed) {
            // Always return HTTP 200 OK so Razorpay knows we got it and doesn't retry!
            return ResponseEntity.ok().build();
        } else {
            // Only return an error if the signature failed or an exception occurred
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook processing failed.");
        }
    }
}
