package com.jayarathna.powertools.config;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.testcontainers.containers.MySQLContainer;

/**
 * Testcontainers-backed MySQL for CI. Activated with profile
 * {@code it-testcontainers} (e.g. {@code -Dit.type=testcontainers});
 * local integration runs default to the dedicated Aiven {@code powertools_it}
 * database via profile {@code it}.
 */
@Configuration(proxyBeanMethods = false)
@Profile("it-testcontainers")
public class ItTestcontainerMySql {

    @Bean
    @ServiceConnection
    MySQLContainer<?> mysql() {
        return new MySQLContainer<>("mysql:8.4");
    }
}