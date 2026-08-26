package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Service.AuthService;
import com.hungrylab.backend.dto.AuthResponseDto;
import com.hungrylab.backend.dto.LoginRequestDto;
import com.hungrylab.backend.dto.RegisterRequestDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDto request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request) {
        try {
            return ResponseEntity.ok(authService.authenticate(request));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    // TEMPORARY UTILITY: Hit this in your browser to upgrade an account without pgAdmin!
    @GetMapping("/make-admin")
    public ResponseEntity<String> makeAdmin(@RequestParam String email) {
        return ResponseEntity.ok(authService.upgradeToAdmin(email));
    }
}
