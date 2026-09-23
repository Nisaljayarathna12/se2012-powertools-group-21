package com.jayarathna.powertools.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class OpenApiConfigTest {

    @Test
    void definesAppInfoAndBearerSecurityScheme() {
        OpenAPI api = new OpenApiConfig().powertoolsOpenAPI();

        assertEquals("PowerTools API", api.getInfo().getTitle());
        assertEquals("0.0.1-SNAPSHOT", api.getInfo().getVersion());
        assertNotNull(api.getInfo().getDescription());

        SecurityScheme scheme = api.getComponents().getSecuritySchemes().get("bearerAuth");
        assertNotNull(scheme);
        assertEquals(SecurityScheme.Type.HTTP, scheme.getType());
        assertEquals("bearer", scheme.getScheme());
        assertEquals("JWT", scheme.getBearerFormat());
    }
}