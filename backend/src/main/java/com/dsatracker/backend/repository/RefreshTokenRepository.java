package com.dsatracker.backend.repository;

import com.dsatracker.backend.entity.RefreshTokenEntity;
import com.dsatracker.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {

    Optional<RefreshTokenEntity> findByToken(String token);

    Optional<RefreshTokenEntity> findByUser(UserEntity user);

    @Modifying
    void deleteByUser(UserEntity user);

    @Modifying
    void deleteByToken(String token);
}
