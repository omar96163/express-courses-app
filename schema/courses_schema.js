import mongoose from "mongoose";
import { body } from "express-validator";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

export const coursesmodel = mongoose.model("course", courseSchema);

export const validationSchemaCourses = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("title is required")
      .isLength({ min: 5 })
      .withMessage("min length is 5 digits"),
    body("price")
      .notEmpty()
      .withMessage("price is required")
      .isFloat({ min: 3 })
      .withMessage("min price is 100 $"),
  ];
};
