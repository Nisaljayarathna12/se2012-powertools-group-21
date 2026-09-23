package com.jayarathna.powertools.config;

import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.repository.UserRepository;
import com.jayarathna.powertools.service.JwtService;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.impl.DefaultClaims;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private FilterChain chain() {
        return (request, response) -> {
            // no-op
        };
    }

    private User admin() {
        User user = new User("Admin", "admin@powertools.com", "pw", "ADMIN");
        user.setUserId(1);
        return user;
    }

    @Test
    void authenticatesUserFromValidToken() throws Exception {
        when(jwtService.parseToken("good.token"))
                .thenReturn(new DefaultClaims(Map.of("userId", 1)));
        when(userRepository.findById(1)).thenReturn(Optional.of(admin()));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer good.token");

        filter.doFilter(request, new MockHttpServletResponse(), chain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertEquals("admin@powertools.com",
                ((User) authentication.getPrincipal()).getEmail());
        assertEquals("ROLE_ADMIN", authentication.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void passesThroughWhenNoAuthHeader() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
    }

    @Test
    void invalidTokenClearsContextAndContinues() throws Exception {
        when(jwtService.parseToken("bad.token")).thenThrow(new JwtException("expired") {
        });

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer bad.token");

        filter.doFilter(request, new MockHttpServletResponse(), chain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void unknownUserDoesNotSetAuthentication() throws Exception {
        when(jwtService.parseToken("ghost.token"))
                .thenReturn(new DefaultClaims(Map.of("userId", 999)));
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer ghost.token");

        filter.doFilter(request, new MockHttpServletResponse(), chain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}