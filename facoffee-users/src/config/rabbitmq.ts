// @ts-nocheck
import amqplib, { Channel, Connection } from "amqplib";
import { env } from "./env";

let connection: Connection | null = null;
let channel: Channel | null = null;

/**
 * Retorna o canal RabbitMQ, criando a conexão e o canal se necessário.
 * A exchange `domain.events` é assegurada como durável do tipo `topic`.
 */
export async function getRabbitChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  connection = await amqplib.connect(env.rabbitmqUrl);
  channel = await connection.createChannel();

  await channel.assertExchange("domain.events", "topic", { durable: true });

  return channel;
}

/**
 * Fecha a conexão com o RabbitMQ de forma graciosa.
 */
export async function closeRabbitConnection(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}
