import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as userService from "../services/user.service";
import { UserRole } from "../domain/user.entity";

const userRoleSchema = z.enum(["MANAGER", "PARTICIPANT"]);

const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  roles: z.array(userRoleSchema).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(3),
});

const deactivateUserSchema = z.object({
  reason: z.string().min(3),
});

const replaceRolesSchema = z.object({
  roles: z.array(userRoleSchema).min(1),
});

/**
 * `POST /users` — Criar usuário (público).
 */
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createUserSchema.parse(req.body);
    const user = await userService.createUser({
      name: body.name,
      email: body.email,
      roles: body.roles as UserRole[] | undefined,
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * `GET /users` — Listar usuários (somente MANAGER).
 */
export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(String(req.query["page"] ?? "0"), 10);
    const size = Math.min(parseInt(String(req.query["size"] ?? "20"), 10), 100);
    const status = req.query["status"] as "ACTIVE" | "INACTIVE" | undefined;
    const role = req.query["role"] as UserRole | undefined;

    const result = await userService.listUsers({ page, size, status, role });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * `GET /users/:userId` — Obter usuário por ID (MANAGER ou próprio).
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.getUserById(req.params["userId"] as string);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * `PATCH /users/:userId` — Atualizar dados básicos (MANAGER ou próprio).
 */
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params["userId"] as string, name);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * `DELETE /users/:userId` — Desativar usuário (MANAGER ou próprio).
 */
export async function deactivateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { reason } = deactivateUserSchema.parse(req.body);
    const user = await userService.deactivateUser(
      req.params["userId"] as string,
      reason
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * `PUT /users/:userId/roles` — Substituir papéis (somente MANAGER).
 */
export async function replaceUserRoles(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roles } = replaceRolesSchema.parse(req.body);
    const user = await userService.replaceUserRoles(
      req.params["userId"] as string,
      roles as UserRole[]
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
}
