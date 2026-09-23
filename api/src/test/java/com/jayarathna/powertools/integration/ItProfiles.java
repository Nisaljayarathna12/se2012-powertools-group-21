package com.jayarathna.powertools.integration;

import org.springframework.test.context.ActiveProfilesResolver;

/**
 * Chooses the integration test datasource:
 * <ul>
 *   <li>{@code -Dit.type=testcontainers} -> profile {@code it-testcontainers}
 *       (spin up a throwaway MySQL via Testcontainers, used in CI).</li>
 *   <li>anything else (default) -> profile {@code it} (dedicated Aiven
 *       {@code powertools_it} database).</li>
 * </ul>
 */
public class ItProfiles implements ActiveProfilesResolver {

    @Override
    public String[] resolve(Class<?> testClass) {
        String type = System.getProperty("it.type", "aiven");
        if ("testcontainers".equalsIgnoreCase(type)) {
            return new String[]{"it-testcontainers"};
        }
        return new String[]{"it"};
    }
}