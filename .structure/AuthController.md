# AuthController
**Architecture:** REST Controller connected to AuthService.
**Use:** Handles user registration, login, and temporary admin role assignment.
**Inputs:** `RegisterRequestDto`, `LoginRequestDto`, email string for make-admin.
**Outputs:** `AuthResponseDto` (contains token, userId, name, role) or error strings.
**Dependencies:** `AuthService`, `RegisterRequestDto`, `LoginRequestDto`, `AuthResponseDto`.
