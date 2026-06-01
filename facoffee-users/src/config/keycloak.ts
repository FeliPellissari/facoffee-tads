import jwksRsa from "jwks-rsa";
import { env } from "./env";

/**
 * Cliente JWKS para buscar as chaves públicas do Keycloak e validar JWTs.
 */
export const jwksClient = jwksRsa({
  jwksUri: env.keycloakJwksUri,
  cache: true,
  rateLimit: true,
});
