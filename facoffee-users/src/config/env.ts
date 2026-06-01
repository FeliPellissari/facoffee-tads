import "dotenv/config";

/**
 * Carrega e valida as variáveis de ambiente obrigatórias.
 * Lança um erro em tempo de inicialização se alguma estiver ausente.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env["PORT"] ?? "3001", 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  keycloakIssuer: requireEnv("KEYCLOAK_ISSUER"),
  keycloakJwksUri: requireEnv("KEYCLOAK_JWKS_URI"),
  keycloakClientId: requireEnv("KEYCLOAK_CLIENT_ID"),
  keycloakClientSecret: requireEnv("KEYCLOAK_CLIENT_SECRET"),
  keycloakAdminUrl: requireEnv("KEYCLOAK_ADMIN_URL"),
  rabbitmqUrl: requireEnv("RABBITMQ_URL"),
} as const;
