import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  requireManagerOrSelf,
  requireRole,
} from "../middlewares/authorize.middleware";
import * as controller from "../controllers/user.controller";

const router = Router();

router.post("/", controller.createUser);

router.get("/", authMiddleware, requireRole("MANAGER"), controller.listUsers);

router.get(
  "/:userId",
  authMiddleware,
  requireManagerOrSelf,
  controller.getUserById
);

router.patch(
  "/:userId",
  authMiddleware,
  requireManagerOrSelf,
  controller.updateUser
);

router.delete(
  "/:userId",
  authMiddleware,
  requireManagerOrSelf,
  controller.deactivateUser
);

router.put(
  "/:userId/roles",
  authMiddleware,
  requireRole("MANAGER"),
  controller.replaceUserRoles
);

export default router;
