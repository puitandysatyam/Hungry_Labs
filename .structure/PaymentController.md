# PaymentController
**Architecture:** REST Controller for Webhooks.
**Use:** To handle Razorpay webhook callbacks and verify signatures.
**Inputs:** JSON payload text and `x-razorpay-signature` header.
**Outputs:** HTTP 200 OK or 400 Bad Request.
**Dependencies:** `PaymentService`.
