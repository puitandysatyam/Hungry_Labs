# Migration Log: Spring Boot -> Express.js

- Started Phase 3: Implementing Business Logic Services and mapping DTOs.
- Writing authService.ts: Mapping AuthResponseDto, implementing bcrypt hashing, and JWT signing.
- Created authService.ts with full JWT mappings.
- Created menuService.ts mapping entity relations to exact MenuItemResponseDto.
- Writing orderService.ts: Mapped 'placeOrder' and 'applyCoupon', integrated Razorpay instance.
- Mapped cart calculations natively linking addons and preventing frontend price override.
- Writing paymentService.ts: Implemented cryptographic webhook signature verification and DB status updating.
- Created controllers: authController.ts, menuController.ts, orderController.ts, adminController.ts, paymentController.ts
- Updated api/index.ts to map newly generated routes cleanly (e.g. /api/auth -> authRoutes).
- Completed exact response and DTO matching according to Java specifications.
