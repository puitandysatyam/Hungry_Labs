package com.hungrylab.backend.Service;

import com.hungrylab.backend.Entity.Order;
import com.hungrylab.backend.Entity.Payment;
import com.hungrylab.backend.Repository.OrderRepository;
import com.hungrylab.backend.Repository.PaymentRepository;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.transaction.Transactional;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;

    // Secure webhook verification using Webhook Secret!
    @Value("${RAZORPAY_KEY_SECRET}")
    private String webhookSecret; // In prod this should be a webhook-specific secret! Using key secret for test compatibility depending on webhook config.

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository, EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.emailService = emailService;
    }

    @Transactional
    public boolean processWebhook(String payload, String signature) {
        try {
            if (!Utils.verifyWebhookSignature(payload, signature, webhookSecret)) {
                return false;
            }

            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("event");

            if (eventType.equalsIgnoreCase("payment.captured") || eventType.equalsIgnoreCase("order.paid")) {
                
                JSONObject paymentEntity = event.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");

                String orderID = paymentEntity.getString("order_id");
                String paymentID = paymentEntity.getString("id");

                Payment myPayment = paymentRepository.findByRazorpayOrderId(orderID).orElse(null);
                
                if (myPayment == null) {
                    return false;
                }

                if ("SUCCESS".equalsIgnoreCase(myPayment.getStatus())) {
                    return true;
                }

                myPayment.setRazorpayPaymentId(paymentID);
                myPayment.setStatus("SUCCESS");

                Order myOrder = myPayment.getOrder();
                myOrder.setStatus("CONFIRMED");

                orderRepository.save(myOrder); 
                paymentRepository.save(myPayment);

                if (myOrder.getCustomerEmail() != null && !myOrder.getCustomerEmail().isEmpty()) {
                    emailService.sendOrderConfirmation(myOrder.getCustomerEmail(), myOrder.getCustomerName(), myOrder.getId(), paymentID, myOrder.getTotalAmount());
                }
                
                return true;
            }

            return true;

        } catch (RazorpayException e) {
            System.err.println("Razorpay Error: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("JSON Parsing Error: " + e.getMessage());
            return false;
        }
    }
}
