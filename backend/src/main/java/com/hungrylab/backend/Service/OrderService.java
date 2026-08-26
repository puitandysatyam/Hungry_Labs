package com.hungrylab.backend.Service;

import com.hungrylab.backend.Entity.*;
import com.hungrylab.backend.Repository.*;
import com.hungrylab.backend.dto.OrderItemRequestDto;
import com.hungrylab.backend.dto.OrderRequestDto;
import com.hungrylab.backend.dto.OrderResponseDto;
import com.hungrylab.backend.dto.CouponResponseDto;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.transaction.Transactional;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final UserRepository userRepository;
    private final MenuRepository menuRepository;
    private final AddonRepository addonRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository; 

    @Value("${RAZORPAY_KEY_ID}")
    private String razorpayKeyId;

    @Value("${RAZORPAY_KEY_SECRET}")
    private String razorpayKeySecret;

    public OrderService(UserRepository userRepository, MenuRepository menuRepository, AddonRepository addonRepository, OrderRepository orderRepository, PaymentRepository paymentRepository, CouponRepository couponRepository) {
        this.userRepository = userRepository;
        this.menuRepository = menuRepository;
        this.addonRepository = addonRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.couponRepository = couponRepository;
    }

    public CouponResponseDto applyCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code).orElse(null);
        if (coupon == null) {
            return new CouponResponseDto(false, "Coupon does not exist", null, 0.0, 0.0);
        }
        if (!coupon.isActive()) {
            return new CouponResponseDto(false, "Coupon is no longer active", null, 0.0, 0.0);
        }
        return new CouponResponseDto(true, "Coupon applied successfully!", coupon.getDiscountType(), coupon.getDiscountValue(), coupon.getMinOrderValue());
    }

    @Transactional
    public OrderResponseDto placeOrder(OrderRequestDto orderRequestDto) throws RazorpayException {

        double totalAmount = 0;
        double itemAmount = 0;

        List<OrderItem> orderItemList = new ArrayList<>();
        Order newOrder = new Order();

        newOrder.setUser(userRepository.findById(orderRequestDto.getUserId() != null ? orderRequestDto.getUserId() : 0L).orElse(null));
        newOrder.setCustomerName(orderRequestDto.getCustomerName());
        newOrder.setCustomerEmail(orderRequestDto.getCustomerEmail()); 
        newOrder.setCustomerPhone(orderRequestDto.getCustomerPhone());
        newOrder.setDeliveryAddress(orderRequestDto.getDeliveryAddress());

        for(OrderItemRequestDto orderItemRequestDto : orderRequestDto.getItems()) {
            itemAmount = 0;
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(newOrder);
            MenuItem menuItem = menuRepository.findById(orderItemRequestDto.getMenuItemId()).orElse(null);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(orderItemRequestDto.getQuantity());
            
            List<Addon> addonList = new ArrayList<>();
            if (orderItemRequestDto.getSelectedAddOnIds() != null && !orderItemRequestDto.getSelectedAddOnIds().isEmpty()) {
                addonList = addonRepository.findByIdIn(orderItemRequestDto.getSelectedAddOnIds());
            }
            orderItem.setAddonList(addonList);

            for (Addon addon : addonList) {
                itemAmount += addon.getPrice();
            }

            assert menuItem != null;
            itemAmount = (menuItem.getPrice() + itemAmount) * orderItemRequestDto.getQuantity();
            totalAmount += itemAmount;

            orderItemList.add(orderItem);
        }

        newOrder.setOrderItemList(orderItemList);

        if (orderRequestDto.getCouponCode() != null && !orderRequestDto.getCouponCode().trim().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(orderRequestDto.getCouponCode()).orElse(null);
            if (coupon != null && coupon.isActive() && totalAmount >= coupon.getMinOrderValue()) {
                if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
                    totalAmount -= coupon.getDiscountValue();
                } else if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                    totalAmount -= (totalAmount * (coupon.getDiscountValue() / 100.0));
                }
            }
        }

        // Fix Razorpay Crash: Razorpay API requires a minimum 1.00 INR charge (100 paise).
        totalAmount = Math.max(1.0, totalAmount);
        newOrder.setTotalAmount(totalAmount);
        newOrder.setStatus("PAYMENT PENDING");

        orderRepository.save(newOrder);

        Payment payment = new Payment();
        payment.setOrder(newOrder);

        RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        
        JSONObject paymentRequest = new JSONObject();
        // Fix Math bug: Math.round prevents missing pence due to floating point imprecise representations.
        paymentRequest.put("amount", Math.round(totalAmount * 100)); // paise
        paymentRequest.put("currency", "INR");
        paymentRequest.put("receipt", "txn_" + System.currentTimeMillis()); 
        
        com.razorpay.Order rzpOrder = razorpayClient.orders.create(paymentRequest);
        payment.setRazorpayOrderId(rzpOrder.get("id").toString());
        payment.setStatus("PENDING");

        paymentRepository.save(payment);

        return new OrderResponseDto(newOrder.getId(), newOrder.getStatus(), 60, payment.getRazorpayOrderId());
    }
}
