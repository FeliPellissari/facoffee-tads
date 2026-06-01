import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwksClient } from "../config/keycloak";
import { env } from "../config/env";
import { UnauthorizedError } from "../domain/user.errors";

/**
 * Payload decodificado do JWT emitido pelo Keycloak.
 */
interface KeycloakTokenPayload {
  sub: string;
  iss: string;
  roles?: string[];
  realm_access?: { roles: string[] };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { sub: string; roles: string[] };
    }
  }
}

/**
 * Middleware que valida o JWT presente no header `Authorization: Bearer <token>`.
 * Injeta `req.user` com `sub` e `roles` em caso de token válido.
 * Retorna `401` em caso de token ausente ou inválido.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Token ausente"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
      throw new UnauthorizedError("Token inválido");
    }

    const key = await jwksClient.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const payload = jwt.verify(token, publicKey, {
      issuer: env.keycloakIssuer,
      algorithms: ["RS256"],
    }) as KeycloakTokenPayload;

    const roles =
      payload.roles ??
      payload.realm_access?.roles ??
      [];

    req.user = { sub: payload.sub, roles };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError("Token inválido ou expirado"));
    }
  }
}
