# Membership Service — Changes Made for Payment Integration

This document explains what I added and modified in the membership-service to support
the payment flow introduced by the payment-service. I did not build this service —
I only extended it to react to payment events.

---

## Context

The payment-service publishes two Kafka events after processing a Stripe webhook:
- `payment.completed` — Stripe confirmed the charge succeeded
- `payment.failed` — Stripe reported a failure

The membership-service needs to listen to these events and transition the subscription
status accordingly.

---

## What I Changed

### `application/enums/SubscriptionStatus.java`

Added two new values:

```java
PENDING_PAYMENT   // subscription created, waiting for Stripe to confirm payment
PAYMENT_FAILED    // Stripe rejected the payment
```

These sit alongside the existing statuses (ACTIVE, CANCELLED, PAUSED, etc.) and do
not affect any existing logic.

---

### `application/service/subscription/SubscriptionServiceImpl.java`

Two changes in `createSubscription`:

**1 — Conflict check now also blocks PENDING_PAYMENT:**

Before, a user with a pending payment could initiate another subscription. Now both
`ACTIVE` and `PENDING_PAYMENT` block new subscription creation.

**2 — Free vs paid plan distinction:**

Before, all subscriptions were created with `ACTIVE` status immediately.
Now:
- Free plans (price == 0) → status stays `ACTIVE` immediately
- Paid plans (price > 0) → status set to `PENDING_PAYMENT`, waits for Kafka event

The plan duration and dates are set the same way regardless — the subscription record
is fully populated, it just isn't active until the payment confirms.

---

## What I Added

### `application/dto/kafka/PaymentCompletedMessage.java`
### `application/dto/kafka/PaymentFailedMessage.java`

Plain Java classes (not records — Jackson needs a no-arg constructor) matching the
message structure published by payment-service. All fields are `String` — UUIDs and
timestamps are sent as strings and parsed where needed.

---

### `infrastructure/kafka/PaymentCompletedMessageDeserializer.java`
### `infrastructure/kafka/PaymentFailedMessageDeserializer.java`

Custom Kafka deserializers using Jackson `ObjectMapper`. Follow the exact same
pattern as the existing `UserRegisteredEventDeserializer`.

---

### `infrastructure/config/KafkaConfig.java` — additions only

Added two new consumer factory pairs (consumer factory + listener container factory):
- `paymentCompletedConsumerFactory` + `paymentCompletedKafkaListenerFactory`
- `paymentFailedConsumerFactory` + `paymentFailedKafkaListenerFactory`

Both use consumer group `membership-service-payment` — separate from the existing
`membership-service-json` group used for user registration events.

---

### `application/port/kafka/PaymentEventHandler.java`

New port interface with two methods:
- `handlePaymentCompleted(PaymentCompletedMessage)`
- `handlePaymentFailed(PaymentFailedMessage)`

Follows the same pattern as the existing `UserRegistrationHandler` port.

---

### `application/service/kafka/PaymentEventListenerImpl.java`

New `@Service` implementing `PaymentEventHandler`. Two `@KafkaListener` methods.

Both follow the same defensive pattern as `UserRegistrationListenerImpl`:
- Catch all exceptions internally, log errors, never propagate
- Idempotency guard — if subscription is not in `PENDING_PAYMENT`, skip silently

On `payment.completed` → subscription transitions to `ACTIVE`

On `payment.failed` → subscription transitions to `PAYMENT_FAILED`

---

## What I Did NOT Touch

- No existing subscription endpoints were changed
- No existing Kafka listeners were modified
- No existing statuses were removed or renamed
- No database migrations needed — `ddl-auto: update` handles the new enum values

---

## Second Round of Changes — Notification Service Integration

A second change was made later to support the notification-service. The goal was simple:
notification-service needs to know when a subscription is created so it can notify the user.
Membership-service was consumer-only before — it had no Kafka producer at all. No business
logic was changed.

### `application/dto/kafka/SubscriptionCreatedEvent.java` — new file

New DTO with three fields: `subscriptionId`, `userId`, `planName`. This is the message
published to the `subscription.created` topic so notification-service can consume it.

### `infrastructure/config/KafkaConfig.java` — producer added

Added a `ProducerFactory<String, Object>` bean and a `KafkaTemplate<String, Object>` bean.
Membership-service was consumer-only before this change. The producer uses `JsonSerializer`
for values, same pattern as payment-service.

### `application/service/subscription/SubscriptionServiceImpl.java` — one addition

After saving the new subscription, one call is added:

```java
kafkaTemplate.send("subscription.created", new SubscriptionCreatedEvent(
        saved.getId().toString(),
        userId.toString(),
        plan.getName()
));
```

This fires on every new subscription regardless of status (ACTIVE or PENDING_PAYMENT).
No existing logic was modified — the publish happens after the save, as a side effect only.
