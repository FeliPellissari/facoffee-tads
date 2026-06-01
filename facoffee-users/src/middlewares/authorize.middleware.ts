import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../domain/user.errors";

/**
 * Middleware de autorização por papel (role).
 * Retorna `403` se o usuário autenticado não possuir o papel exigido.
 *
 * @param role - Papel necessário para acessar o recurso.
 */
export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRoles = req.user?.roles ?? [];
    if (!userRoles.includes(role)) {
      next(new ForbiddenError(`Papel '${role}' necessário`));
      return;
    }
    next();
  };
}

/**
 * Middleware de autorização por papel ou pelo próprio recurso.
 * Permite acesso se o usuário for `MANAGER` ou se o `userId` do parâmetro
 * de rota corresponder ao `sub` do token.
 * Retorna `403` caso nenhuma das condições seja satisfeita.
 */
export function requireManagerOrSelf(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const userRoles = req.user?.roles ?? [];
  const userSub = req.user?.sub;
  const paramUserId = req.params["userId"];

  const isManager = userRoles.includes("MANAGER");
  const isSelf = !!userSub && userSub === paramUserId;

  if (!isManager && !isSelf) {
    next(new ForbiddenError("Acesso permitido apenas ao próprio usuário ou a gestores"));
    return;
  }

  next();
}
