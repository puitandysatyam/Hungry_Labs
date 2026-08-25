package com.hungrylab.backend.Service;

import com.hungrylab.backend.Entity.User;
import com.hungrylab.backend.Repository.UserRepository;
import com.hungrylab.backend.Security.JwtService;
import com.hungrylab.backend.dto.AuthResponseDto;
import com.hungrylab.backend.dto.LoginRequestDto;
import com.hungrylab.backend.dto.RegisterRequestDto;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponseDto register(RegisterRequestDto request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword())); 
        
        // Auto-grant ADMIN if it's the master test account, otherwise USER
        if (request.getEmail().equalsIgnoreCase("admin@hungrylabs.com")) {
            user.setRole("ADMIN");
        } else {
            user.setRole("USER"); 
        }

        userRepository.save(user); 

        String jwtToken = jwtService.generateToken(user);
        
        return AuthResponseDto.builder()
                .token(jwtToken)
                .userId(user.getId())
                .name(user.getName())
                .role(user.getRole()) // Passing role to frontend
                .build();
    }

    public AuthResponseDto authenticate(LoginRequestDto request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        String jwtToken = jwtService.generateToken(user);
        
        return AuthResponseDto.builder()
                .token(jwtToken)
                .userId(user.getId())
                .name(user.getName())
                .role(user.getRole()) // Passing role to frontend
                .build();
    }

    public String upgradeToAdmin(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole("ADMIN");
            userRepository.save(user);
            return "Success: " + email + " is now an ADMIN! Please Log out and Log back in on the frontend to refresh your token.";
        }
        return "Fail: User not found in database!";
    }
}
