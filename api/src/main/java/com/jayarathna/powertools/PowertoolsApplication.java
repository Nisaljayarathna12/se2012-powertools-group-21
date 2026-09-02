package com.jayarathna.powertools;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.MapPropertySource;

@SpringBootApplication
public class PowertoolsApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(PowertoolsApplication.class);
		loadEnvFile(app);
		app.run(args);
	}

	private static void loadEnvFile(SpringApplication app) {
		try {
			Path envFile = Path.of(".env").toAbsolutePath();
			if (!Files.exists(envFile)) {
				return;
			}
			Map<String, Object> env = Files.readAllLines(envFile).stream()
					.map(String::trim)
					.filter(line -> !line.isBlank() && !line.startsWith("#") && line.contains("="))
					.map(line -> line.split("=", 2))
					.collect(java.util.stream.Collectors.toMap(parts -> parts[0], parts -> parts[1], (a, b) -> b));
			app.addInitializers(ctx -> ctx.getEnvironment().getPropertySources()
					.addFirst(new MapPropertySource("dotenv", env)));
		} catch (Exception e) {
			// .env is optional; ignore failures so startup continues with defaults
		}
	}

}
