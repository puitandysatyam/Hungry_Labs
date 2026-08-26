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
            
            // Extract the payment object nested deep inside the payload json
            JSONObject paymentEntity = event.has("payload") && event.getJSONObject("payload").has("payment") ?
                    event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity") : null;
                    
            if (paymentEntity == null) {
                // If it's an order or refund event that doesn't embed the payment entity directly,
                // we attempt to parse it from order or refund objects directly.
                if (event.has("payload") && event.getJSONObject("payload").has("refund")) {
                    paymentEntity = event.getJSONObject("payload").getJSONObject("refund").getJSONObject("entity");
                } else if (event.has("payload") && event.getJSONObject("payload").has("order")) {
                    paymentEntity = event.getJSONObject("payload").getJSONObject("order").getJSONObject("entity");
                }
                
                if (paymentEntity == null) {
                    return true; 
                }
            }
            
            // Razorpay uses "order_id" inside payment entity, or "id" if the entity itself is an order
            String rzpOrderId = paymentEntity.optString("order_id", paymentEntity.optString("id"));
            String rzpPaymentId = paymentEntity.has("payment_id") ? paymentEntity.optString("payment_id") : paymentEntity.optString("id");
            
            Payment myPayment = paymentRepository.findByRazorpayOrderId(rzpOrderId).orElse(null);
            if (myPayment == null) {
                return true; // We don't track this order (maybe corrupted?), ack it so Razorpay stops retrying
            }
            Order myOrder = myPayment.getOrder();

            System.out.println("Processing Razorpay Webhook Event: " + eventType);
            
            switch (eventType) {
                // SUCCESS CASES
                case "payment.captured":
                case "order.paid":
                    if (!"SUCCESS".equalsIgnoreCase(myPayment.getStatus())) {
                        myPayment.setRazorpayPaymentId(rzpPaymentId);
                        myPayment.setStatus("SUCCESS");
                        myOrder.setStatus("CONFIRMED");
    
                        if (myOrder.getCustomerEmail() != null && !myOrder.getCustomerEmail().isEmpty()) {
                            emailService.sendOrderConfirmation(myOrder.getCustomerEmail(), myOrder.getCustomerName(), myOrder.getId(), rzpPaymentId, myOrder.getTotalAmount());
                        }
                    }
                    break;
                    
                // FAILURE CASES
                case "payment.failed":
                    myPayment.setStatus("FAILED");
                    myOrder.setStatus("PAYMENT_FAILED");
                    break;
                    
                // REFUND CASES
                case "refund.created":
                    // Refund initiated by admin on dashbaord, but bank hasn't resolved it yet
                    myPayment.setStatus("REFUND_PENDING");
                    myOrder.setStatus("CANCEL_PENDING");
                    break;
                    
                case "refund.processed":
                    // Bank has successfully credited user
                    myPayment.setStatus("REFUNDED");
                    myOrder.setStatus("CANCELLED");
                    break;
                    
                case "refund.failed":
                    // Bank rejected the refund! Alert admin required ideally.
                    myPayment.setStatus("REFUND_FAILED");
                    myOrder.setStatus("MANUAL_REVIEW_REQUIRED");
                    break;
                    
                // DISPUTE CASES (Chargebacks)
                case "payment.dispute.created":
                    myPayment.setStatus("DISPUTED");
                    myOrder.setStatus("ON_HOLD");
                    break;
                case "payment.dispute.won":
                    myPayment.setStatus("DISPUTE_WON_SUCCESS");
                    myOrder.setStatus("CONFIRMED");
                    break;
                case "payment.dispute.lost":
                    myPayment.setStatus("DISPUTE_LOST_REFUNDED");
                    myOrder.setStatus("CANCELLED");
                    break;
                    
                default:
                    // Acknowledge (return true) for events we don't care about
                    break;
            }

            orderRepository.save(myOrder); 
            paymentRepository.save(myPayment);
            
            return true;

        } catch (RazorpayException e) {
            System.err.println("Razorpay Signature Error: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("Webhook JSON Parsing Error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
