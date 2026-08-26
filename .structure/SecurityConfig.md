# SecurityConfig & JWT
**Architecture:** Spring Security Interceptors.
**Use:** CORS settings, Route protections (public /api/auth, /api/menu... protected /api/orders/user, ADMIN /api/admin).
**Details:** Uses `JwtAuthenticationFilter` to validate Bearer tokens.
