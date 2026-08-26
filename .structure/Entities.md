# Entities (Database Models)
* **User:** Stores credentials and roles. Has One-to-Many with Order.
* **MenuItem:** Stores food info, prices. Many-to-Many with Addon.
* **Addon:** Extras (Extra Cheese, etc.) Many-to-Many linked to MenuItems and OrderItems.
* **Order:** Cart state, customer details, totalAmount, status. Belongs to User. Has Many OrderItems. Has One Payment.
* **OrderItem:** Link between Order and MenuItem. Stores quantity and selected Addons.
* **Payment:** Stores Razorpay `order_id` and `payment_id`. Belongs to Order.
* **Coupon:** Discount rules (`code`, `discountType`, `minOrderValue`, `discountValue`, `validUntil`).
