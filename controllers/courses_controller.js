import { validationResult } from "express-validator";
import { coursesmodel } from "../schema/courses_schema.js";

export const getAllCourses = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  try {
    const courses = await coursesmodel
      .find({}, { __v: false })
      .limit(limit)
      .skip(skip);
    return res.json({ status: "success", data: { courses } });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await coursesmodel.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ status: "Failed", error: "course not found" });
    }
    return res.json({ status: "success", data: { course } });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

export const createCourse = async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ status: "Failed", error: err.array() });
  }
  try {
    const newcourse = new coursesmodel(req.body);
    await newcourse.save();
    return res.status(201).json({ status: "success", data: { newcourse } });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

export const updateCourse = async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ status: "Failed", error: err.array() });
  }
  try {
    const updatedcourse = await coursesmodel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedcourse) {
      return res
        .status(404)
        .json({ status: "Failed", error: "course not found" });
    }
    return res.status(200).json({ status: "success", data: { updatedcourse } });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const deletedcourse = await coursesmodel.findByIdAndDelete(req.params.id);
    if (!deletedcourse) {
      return res
        .status(404)
        .json({ status: "Failed", error: "course not found" });
    }
    return res.json({
      status: "success",
      data: `${deletedcourse.title} , deleted`,
    });
  } catch (err) {
    return res.status(400).json({ status: "error", error: err.message });
  }
};
