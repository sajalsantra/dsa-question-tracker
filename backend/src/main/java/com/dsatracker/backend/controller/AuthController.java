package com.dsatracker.backend.controller;

import com.dsatracker.backend.dto.AuthRequest;
import com.dsatracker.backend.dto.AuthResponse;
import com.dsatracker.backend.dto.RefreshTokenRequest;
import com.dsatracker.backend.dto.TokenRefreshResponse;
import com.dsatracker.backend.dto.UserDto;
import com.dsatracker.backend.entity.RefreshTokenEntity;
import com.dsatracker.backend.entity.UserEntity;
import com.dsatracker.backend.repository.UserRepository;
import com.dsatracker.backend.security.JwtTokenProvider;
import com.dsatracker.backend.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already registered");
        }

        String userId = UUID.randomUUID().toString();
        UserEntity user = UserEntity.builder()
                .id(userId)
                .name(request.getName() != null ? request.getName() : request.getEmail().split("@")[0])
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        RefreshTokenEntity refreshToken = refreshTokenService.createRefreshToken(user.getId());

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();

        return ResponseEntity.ok(AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .token(accessToken)
                .user(userDto)
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        RefreshTokenEntity refreshToken = refreshTokenService.createRefreshToken(user.getId());

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();

        return ResponseEntity.ok(AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .token(accessToken)
                .user(userDto)
                .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        if (requestRefreshToken == null || requestRefreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Refresh token is required");
        }

        try {
            RefreshTokenEntity tokenEntity = refreshTokenService.findByToken(requestRefreshToken)
                    .orElse(null);

            if (tokenEntity == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Refresh token is not found in database");
            }

            tokenEntity = refreshTokenService.verifyExpiration(tokenEntity);
            UserEntity user = tokenEntity.getUser();

            String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());

            TokenRefreshResponse response = TokenRefreshResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(requestRefreshToken)
                    .tokenType("Bearer")
                    .build();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() != null) {
            String userId = (String) authentication.getPrincipal();
            refreshTokenService.deleteByUserId(userId);
        }
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = (String) authentication.getPrincipal();
        UserEntity user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();

        return ResponseEntity.ok(userDto);
    }
}
