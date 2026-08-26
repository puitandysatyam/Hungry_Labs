# PaymentService
**Architecture:** Service Class.
**Use:** Verifies webhook signature locally (without Razorpay SDK validation hit) and updates Order Status.
**Inputs:** Webhook Payload, Signature header.
**Outputs:** Boolean (Success or Failure).
**Dependencies:** `PaymentRepository`, `OrderRepository`, HMAC-SHA256 crypto logic.
