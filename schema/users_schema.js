import mongoose from "mongoose";
import { roles } from "../utils/roles.js";
import { body } from "express-validator";

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  role: {
    type: String,
    enum: [roles.ADMIN, roles.MANAGER, roles.USER],
    default: roles.USER,
  },
  avatar: {
    type: String,
  },
});

export const usersmodel = mongoose.model("users", userSchema);

export const validationSchemaUsers = () => {
  return [
    body("firstname")
      .notEmpty()
      .withMessage("firstname is required")
      .isLength({ min: 4 })
      .withMessage("min length is 4 characters"),
    body("lastname")
      .notEmpty()
      .withMessage("lastname is required")
      .isLength({ min: 4 })
      .withMessage("min length is 4 characters"),
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("invalid email"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 8 })
      .withMessage("min length is 8 digits"),
  ];
};
