import express from "express";
import { roles } from "../utils/roles.js";
import { verify_token } from "../Middlewares/jwt.js";
import { upload } from "../utils/upload_image.js";
import { allowed_to } from "../Middlewares/handlers.js";
import { validationSchemaUsers } from "../schema/users_schema.js";
import {
  getAllUsers,
  deleteUsers,
  register,
  login,
} from "../controllers/users_controller.js";

export const usersRouter = express.Router();

usersRouter
  .route("/")
  .get(verify_token, allowed_to(roles.ADMIN, roles.MANAGER), getAllUsers);

usersRouter
  .route("/register")
  .post(upload.single("avatar"), validationSchemaUsers(), register);

usersRouter
  .route("/:id")
  .delete(verify_token, allowed_to(roles.MANAGER), deleteUsers);

usersRouter.route("/login").post(login);
