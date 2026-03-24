# =========================
# Build stage
# =========================
FROM maven:3.9.3-eclipse-temurin-17 AS build
WORKDIR /app

# Copy mvnw and wrapper folder
COPY mvnw .
COPY .mvn .mvn

# Copy pom and source
COPY pom.xml .
COPY src ./src

# Make wrapper executable
RUN chmod +x mvnw

# Build the project
RUN ./mvnw clean package -DskipTests

# =========================
# Runtime stage
# =========================
FROM eclipse-temurin:17-jdk-alpine AS runtime
WORKDIR /app

COPY --from=build /app/target/membership-service-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]