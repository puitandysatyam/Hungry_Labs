package com.hungrylab.backend.Controller;

import com.hungrylab.backend.Service.AuthService;
import com.hungrylab.backend.dto.AuthResponseDto;
import com.hungrylab.backend.dto.LoginRequestDto;
import com.hungrylab.backend.dto.RegisterRequestDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") 
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    // TEMPORARY UTILITY: Hit this in your browser to upgrade an account without pgAdmin!
    @GetMapping("/make-admin")
    public ResponseEntity<String> makeAdmin(@RequestParam String email) {
        return ResponseEntity.ok(authService.upgradeToAdmin(email));
    }
}
