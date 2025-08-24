import bcrypt from "bcryptjs";
import { generate_token } from "../Middlewares/jwt.js";
import { validationResult } from "express-validator";
import { usersmodel } from "../schema/users_schema.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await usersmodel.find({}, { password: false, __v: false });
    return res.json({ status: "success", data: { users } });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

export const register = async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(400).json({ status: "Failed", error: err.array() });
  }
  const olduser = await usersmodel.findOne({ email: req.body.email });
  if (olduser) {
    return res
      .status(400)
      .json({ status: "Failed", error: "email already exists" });
  }
  try {
    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedpassword;
    const user = new usersmodel(req.body);
    const token = generate_token(user.email, user._id, user.role);
    user.token = token;
    user.avatar = req.file?.filename || "profile.jpg";
    await user.save();
    return res
      .status(201)
      .json({ status: "success", data: { user }, msg: "sign up successfully" });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};

export const login = async (req, res) => {
  const user_email = req.body.email;
  const user_password = req.body.password;
  if (!user_email & !user_password) {
    return res.status(400).json({
      status: "Failed",
      error: "email & password are required",
    });
  }
  if (!user_email) {
    return res.status(400).json({
      status: "Failed",
      error: "email is required",
    });
  }
  if (!user_password) {
    return res.status(400).json({
      status: "Failed",
      error: "password is required",
    });
  } else {
    try {
      const matched_user = await usersmodel.findOne({ email: user_email });
      if (!matched_user) {
        return res.status(404).json({
          status: "Failed",
          error: "this email not exist",
        });
      } else {
        const matched_password = await bcrypt.compare(
          user_password,
          matched_user.password
        );
        if (!matched_password) {
          return res.status(401).json({
            status: "Failed",
            error: "this password is wrong",
          });
        } else {
          const token = generate_token(
            matched_user.email,
            matched_user._id,
            matched_user.role
          );
          matched_user.token = token;
          return res.json({
            status: "success",
            msg: "logged in successfully",
            user: matched_user,
          });
        }
      }
    } catch (err) {
      return res.status(500).json({ status: "error", error: err.message });
    }
  }
};

export const deleteUsers = async (req, res) => {
  try {
    const deleteduser = await usersmodel.findByIdAndDelete(req.params.id);
    if (!deleteduser) {
      return res
        .status(404)
        .json({ status: "Failed", error: "user not found" });
    }
    return res.status(200).json({
      status: "success",
      data: `${deleteduser.firstname} , deleted`,
    });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
};
