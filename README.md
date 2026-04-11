# Smart Gym Platform

## Overview

Smart Gym is a distributed system built using a microservices architecture to provide intelligent fitness services, including AI-based coaching, real-time communication, and membership management.

The platform is designed to be scalable, secure, and modular, allowing independent development and deployment of services.

---

## Architecture

The system follows a microservices architecture where each service is responsible for a specific business domain.

### Main Components

* Frontend: Angular application
* API Gateway: Kong
* Backend services:

  * User Service (.NET)
  * Membership Service (Spring Boot)
  * Chat Service (Node.js)
  * Additional services (Symfony, AI, etc.)
* Messaging system: Kafka
* Containerization: Docker & Docker Compose

---

## Project Structure

```
.
├── Frontend/
├── Infrastructure/
├── microservices/
│   ├── api-gateway/
│   ├── user-service/
│   ├── membership-service/
│   ├── coach-service/
│   ├── chat-service/
│   ├── ai-service/
│   ├── payment-service/
│   ├── stats-service/
│   └── interaction-service/
```

---

## Core Features

### Authentication & User Management

* JWT-based authentication using asymmetric keys (RSA)
* Login / Registration
* Google OAuth login
* Email verification
* Password reset
* Two-Factor Authentication (2FA)
* Session management:

  * Logout current session
  * Logout all sessions
  * Token revocation (blacklisting)

---

### AI Coach

* Personalized workout recommendations
* Meal suggestions based on user profile and available ingredients
* Extensible to support image-based analysis

---

### Chat System

* Real-time communication between users and coaches
* Enables continuous interaction and feedback

---

### Appointment Management

* Booking sessions with coaches
* Managing availability and schedules

---

### Membership System

* Subscription plans management
* Membership lifecycle tracking
* Subscription history

---

### Administration

* User and role management
* Invitation system
* Dashboard and monitoring

---

## Security

### Authentication

* JWT signed with private key and verified using public key
* Stateless authentication across services

### Authorization

* Role-Based Access Control (RBAC)
* Permission-based access enforcement

### Token Management

* Access and refresh tokens
* Token revocation using blacklist
* Session tracking

### Data Security

* Password hashing (Argon2)
* Secure handling of sensitive data

### API Gateway Security

* Centralized entry point using Kong
* Routing, filtering, and request validation
* Rate limiting and access control

---

## Communication

* REST APIs via API Gateway
* Event-driven architecture using Kafka

  * Example: UserRegisteredEvent triggers actions in other services

---

## Deployment

The system is containerized using Docker.

### Run all services

```bash
docker-compose up --build
```

---

## Development

### Frontend

```bash
cd Frontend/gym-web
npm install
ng serve
```
or : 
```bash
make backend
make frontend
```

### Example Backend (Spring)

```bash
cd microservices/membership-service
./mvnw spring-boot:run
```

---

## Technical Justification

### Why Microservices Architecture

* Separation of concerns: each service handles a single domain (auth, membership, chat, etc.)
* Scalability: services can be scaled independently
* Flexibility: different technologies can be used where they fit best
* Fault isolation: failure in one service does not affect the entire system

---

### Why Multiple Technologies (.NET, Spring, Node, Symfony)

This is a deliberate architectural decision, not random usage:

* .NET (User Service)

  * Strong security ecosystem
  * Well-suited for authentication
  * Efficient handling of JWT and cryptography

* Spring Boot (Membership Service)

  * Robust for business logic and complex domain modeling
  * Mature ecosystem for transactional systems

* Node.js (Chat Service)

  * Ideal for real-time communication (WebSockets)
  * Non-blocking I/O for handling many concurrent users

* Symfony (Commerc Service)

  * Lightweight and fast for smaller services or APIs
  * Rapid development and flexibility

Conclusion: Each technology is used based on its strengths, following a “right tool for the right job” approach.

---

### Why API Gateway (Kong)

* Centralized routing for all services
* Simplifies frontend communication
* Adds security layer (authentication, rate limiting)
* Reduces direct exposure of microservices

---

### Why JWT with Asymmetric Keys

* Services only need the public key to verify tokens
* Private key remains secure in auth service
* Suitable for distributed systems
* Avoids shared secrets across services

---

### Why Kafka (Event-Driven Architecture)

* Decouples services
* Improves scalability and reliability
* Enables asynchronous workflows
* Example:

  * User registers → event published → membership service reacts

---

### Why Docker

* Ensures consistent environments
* Simplifies deployment
* Easy to scale and manage services

---

## Future Improvements

* AI image-based posture correction
* Mobile application
* Payment gateway integration
* Notification system (email/SMS)
* Advanced analytics dashboard

---

## Notes

* Each service is independently deployable
* System follows clean architecture principles
* Designed for real-world scalability and maintainability
