import crypto from "crypto";
import { getRabbitChannel } from "../config/rabbitmq";

const EXCHANGE = "domain.events";

/**
 * Envelope do evento `UserDeactivated` conforme `async-docs.yaml`.
 */
interface UserDeactivatedPayload {
  userId: string;
  reason: string;
}

/**
 * Publica o evento `UserDeactivated` na exchange `domain.events` do RabbitMQ
 * com a routing key `users.deactivated`.
 *
 * A publicação ocorre após a persistência no banco. Falhas são logadas sem
 * reverter a operação de desativação.
 *
 * @param payload - Dados do evento a ser publicado.
 */
export async function publishUserDeactivated(
  payload: UserDeactivatedPayload
): Promise<void> {
  const event = {
    eventId: crypto.randomUUID(),
    eventType: "UserDeactivated",
    occurredAt: new Date().toISOString(),
    version: "1.0",
    payload,
  };

  try {
    const channel = await getRabbitChannel();
    channel.publish(
      EXCHANGE,
      "users.deactivated",
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: "application/json" }
    );
  } catch (err) {
    console.error("[publisher] Falha ao publicar evento UserDeactivated:", err);
  }
}
