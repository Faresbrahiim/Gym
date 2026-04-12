# =========================
# Build stage
# =========================
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first — dependencies cached as a separate layer
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests --no-transfer-progress

# Extract layered JAR — splits into 4 layers ordered by change frequency
RUN java -Djarmode=layertools \
    -jar target/payment-service-0.0.1-SNAPSHOT.jar \
    extract --destination target/extracted

# =========================
# Runtime stage
# =========================
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -S payment && adduser -S payment -G payment

# Copy layers in order: least-changed → most-changed
# Docker invalidates from the first changed layer downward
COPY --from=build /app/target/extracted/dependencies/ ./
COPY --from=build /app/target/extracted/spring-boot-loader/ ./
COPY --from=build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /app/target/extracted/application/ ./

USER payment

EXPOSE 8080

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
