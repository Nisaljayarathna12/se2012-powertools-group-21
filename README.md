# PowerTools - SE2012 Group 21

A full-stack web application for power tools management, built as part of the SE2012 Software Engineering course.

## Tech Stack

### Backend (`api/`)
- **Language:** Java 25
- **Framework:** Spring Boot 4.1.1
- **Build Tool:** Apache Maven (with Maven Wrapper)
- **Database:** MySQL with Spring Data JPA
- **Migrations:** Flyway
- **API Documentation:** SpringDoc OpenAPI (Swagger UI)

### Frontend (`web/`)
- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Package Manager:** pnpm

## Project Structure

```
se2012-powertools-group-21/
├── api/                          # Spring Boot backend
│   ├── src/main/java/            # Java source files
│   ├── src/main/resources/       # Configuration files
│   ├── src/test/                 # Test files
│   └── pom.xml                   # Maven dependencies
├── web/                          # Next.js frontend
│   ├── app/                      # Next.js app directory
│   ├── components/               # React components
│   ├── lib/                      # Utility functions
│   └── package.json              # Node.js dependencies
└── README.md
```

## Prerequisites

- **Java JDK 25**
- **Node.js** (v18 or later)
- **pnpm** (package manager)
- **MySQL Server**

## Getting Started

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd api
   ```

2. Configure database connection in `src/main/resources/application.yaml`

3. Build the project:
   ```bash
   ./mvnw clean install
   ```

4. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

The API will be available at `http://localhost:8080`
Swagger UI will be available at `http://localhost:8080/swagger-ui.html`

### Frontend Setup

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

The frontend will be available at `http://localhost:3000`

## Development

### Frontend Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |

### Backend Commands

| Command | Description |
|---------|-------------|
| `./mvnw spring-boot:run` | Run the application |
| `./mvnw clean package` | Build the project |
| `./mvnw test` | Run tests |

## Features

- RESTful API architecture
- MySQL database with Flyway migrations
- Swagger/OpenAPI documentation
- Modern React frontend with TypeScript
- Responsive UI with Tailwind CSS
- Dark/Light theme support (press `d` to toggle)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is for educational purposes as part of SE2012 course.
