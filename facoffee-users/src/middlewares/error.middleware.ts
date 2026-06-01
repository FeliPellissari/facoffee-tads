import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  EmailConflictError,
  ForbiddenError,
  UnauthorizedError,
  UserNotFoundError,
} from "../domain/user.errors";

/**
 * Formato padronizado de resposta de erro conforme `api-docs.yaml`.
 */
interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

/**
 * Handler global de erros do Express.
 * Mapeia erros de domínio e de validação para respostas HTTP padronizadas.
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const path = req.originalUrl;
  const timestamp = new Date().toISOString();

  let status = 500;
  let error = "Internal Server Error";
  let message = "Erro interno inesperado";

  if (err instanceof ZodError) {
    status = 400;
    error = "Bad Request";
    message = err.issues.map((e: { message: string }) => e.message).join("; ");
  } else if (err instanceof UnauthorizedError) {
    status = 401;
    error = "Unauthorized";
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    status = 403;
    error = "Forbidden";
    message = err.message;
  } else if (err instanceof UserNotFoundError) {
    status = 404;
    error = "Not Found";
    message = err.message;
  } else if (err instanceof EmailConflictError) {
    status = 409;
    error = "Conflict";
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const body: ErrorResponse = { timestamp, status, error, message, path };

  res.status(status).json(body);
}
