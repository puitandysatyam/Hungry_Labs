# AuthService
**Architecture:** Service Class.
**Use:** Business logic for JWT authentication, registration and granting roles.
**Inputs:** DTOs from Controllers.
**Outputs:** `AuthResponseDto`.
**Dependencies:** `UserRepository`, `PasswordEncoder`, `AuthenticationManager`, `JwtService`, `User` entity.
