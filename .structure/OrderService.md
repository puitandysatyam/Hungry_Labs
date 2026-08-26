# OrderService
**Architecture:** Service Class.
**Use:** Core logic to validate coupons, compile order items, create Razorpay orders, and save to DB.
**Inputs:** `OrderRequestDto`, `couponCode`.
**Outputs:** `OrderResponseDto`, `CouponResponseDto`.
**Dependencies:** `OrderRepository`, `OrderItemRepository`, `PaymentRepository`, `UserRepository`, `MenuRepository`, `AddonRepository`, `CouponRepository`, Entities... RazorpayClient.
