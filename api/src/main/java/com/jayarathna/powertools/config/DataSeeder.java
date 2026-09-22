package com.jayarathna.powertools.config;

import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String ROLE_ADMIN = "ADMIN";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.admin.email:admin@powertools.com}") String adminEmail,
                      @Value("${app.admin.password:Admin@1234}") String adminPassword,
                      @Value("${app.admin.name:Site Administrator}") String adminName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByRole(ROLE_ADMIN)) {
            return;
        }

        User admin = new User(adminName, adminEmail.trim().toLowerCase(),
                passwordEncoder.encode(adminPassword), ROLE_ADMIN);
        userRepository.save(admin);
        log.info("Seeded default admin account {}", adminEmail);
    }
}