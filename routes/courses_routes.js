import express from "express";
import { verify_token } from "../Middlewares/jwt.js";
import { roles } from "../utils/roles.js";
import { allowed_to } from "../Middlewares/handlers.js";
import { validationSchemaCourses } from "../schema/courses_schema.js";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courses_controller.js";

export const courseRouter = express.Router();

courseRouter
  .route("/")
  .get(getAllCourses)
  .post(
    verify_token,
    allowed_to(roles.MANAGER),
    validationSchemaCourses(),
    createCourse
  );

courseRouter
  .route("/:id")
  .get(getCourseById)
  .patch(verify_token, allowed_to(roles.ADMIN, roles.MANAGER), updateCourse)
  .delete(verify_token, allowed_to(roles.MANAGER), deleteCourse);
