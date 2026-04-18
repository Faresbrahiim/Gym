FROM rust:alpine AS builder

RUN apk add --no-cache musl-dev openssl-dev pkgconfig

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM alpine:3.21

RUN apk add --no-cache openssl libgcc

WORKDIR /app
COPY --from=builder /app/target/release/presence-service .

EXPOSE 8080

CMD ["./presence-service"]
