package com.hungrylab.backend.Service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // @Async tells Spring to run this on a separate background thread!
    @Async
    public void sendOrderConfirmation(String toEmail, String customerName, Long orderId, String paymentId, double amount) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("hello@hungrylabs.com"); // Usually replaced by your actual authenticated email
            message.setTo(toEmail);
            message.setSubject("Hungry Labs: Order #" + orderId + " Confirmed!");
            
            String text = "Hi " + customerName + ",\n\n" +
                          "Your order has been confirmed!\n" +
                          "Total Amount Paid: ₹" + amount + "\n" +
                          "Payment ID: " + paymentId + "\n\n" +
                          "The kitchen is preparing your food now. Enjoy!";
                          
            message.setText(text);
            mailSender.send(message);
            
            System.out.println("Email sent asynchronously to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
