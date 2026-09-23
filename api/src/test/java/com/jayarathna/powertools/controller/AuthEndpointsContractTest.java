package com.jayarathna.powertools.controller;

import com.jayarathna.powertools.dto.LoginResponse;
import com.jayarathna.powertools.model.User;
import com.jayarathna.powertools.service.AuthService;
import com.jayarathna.powertools.repository.UserRepository;
import com.jayarathna.powertools.service.JwtService;
import com.jayarathna.powertools.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Validates the login/register contract shared with the frontend
 * ({@code web/lib/api.ts}: loginUser/registerUser).
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthEndpointsContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AuthService authService;

    private static User admin() {
        User user = new User("Site Administrator", "admin@powertools.com", "pw", "ADMIN");
        user.setUserId(1);
        return user;
    }

    @Test
    void loginReturnsTokenPayloadMatchingFrontendLoginResponse() throws Exception {
        when(userService.login(any()))
                .thenReturn(new LoginResponse("jwt-token", 1790178041000L, admin()));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@powertools.com\",\"password\":\"Admin@1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.expiresAt").value(1790178041000L))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.name").value("Site Administrator"))
                .andExpect(jsonPath("$.email").value("admin@powertools.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void registerRejectsInvalidPayloadWithMessage() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"A\",\"email\":\"not-an-email\",\"password\":\"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void registerAcceptsValidPayload() throws Exception {
        when(userService.register(any())).thenReturn(admin());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Site Administrator\",\"email\":\"admin@powertools.com\",\"password\":\"Admin@1234\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("admin@powertools.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void malformedJsonBodyReturns400WithMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}