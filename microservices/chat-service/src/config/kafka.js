import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BOOTSTRAP_SERVERS ?? "kafka:9092")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: "chat-service",
  brokers,
});

const producer = kafka.producer();
let connectPromise = null;

const ensureConnected = async () => {
  if (!connectPromise) {
    connectPromise = producer.connect().catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  return connectPromise;
};

export const publishKafkaMessages = async (topic, messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return;

  await ensureConnected();
  await producer.send({ topic, messages });
};

const disconnectProducer = async () => {
  if (!connectPromise) return;
  try {
    await producer.disconnect();
  } catch {}
};

process.once("SIGINT", () => {
  disconnectProducer().finally(() => process.exit(0));
});

process.once("SIGTERM", () => {
  disconnectProducer().finally(() => process.exit(0));
});
