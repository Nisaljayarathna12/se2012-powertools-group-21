package com.jayarathna.powertools.repository;

import com.jayarathna.powertools.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(String role);

    long countByRole(String role);
}