import "dotenv/config";
import cors from "cors";
import path from "path";
import multer from "multer";
import bcrypt from "bcryptjs";
import express from "express";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { roles, allowed_to } from "./roles.js";
import { generate_token, verify_token } from "./jwt.js";
import { body, validationResult } from "express-validator";

mongoose
  .connect(process.env.MONGO_URl)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
  });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const file_name = `user_${Date.now()}.${ext}`;
    cb(null, file_name);
  },
});
const filter = (req, file, cb) => {
  const fileuploadtype = file.mimetype.split("/")[0];
  if (fileuploadtype == "image") {
    return cb(null, true);
  } else {
    return cb({ status: "error", error: "you can upload only image" }, false);
  }
};
const upload = multer({
  storage: diskStorage,
  fileFilter: filter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});
const app = express();
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
const coursesmodel = mongoose.model("course", courseSchema);
const usersmodel = mongoose.model("users", userSchema);

app.use(cors());

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/thecourses", async (req, res) => {
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
});

app.get(
  "/api/theusers",
  verify_token,
  allowed_to(roles.ADMIN, roles.MANAGER),
  async (req, res) => {
    try {
      const users = await usersmodel.find({}, { password: false, __v: false });
      return res.json({ status: "success", data: { users } });
    } catch (err) {
      return res.status(500).json({ status: "error", error: err.message });
    }
  }
);

app.get("/api/thecourses/:id", async (req, res) => {
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
});

app.post(
  "/api/thecourses",
  verify_token,
  allowed_to(roles.MANAGER),
  [
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
  ],
  async (req, res) => {
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
  }
);

app.post(
  "/api/theusers/register",
  upload.single("avatar"),
  [
    body("firstname")
      .notEmpty()
      .withMessage("firstname is required")
      .isLength({ min: 5 })
      .withMessage("min length is 5 characters"),
    body("lastname")
      .notEmpty()
      .withMessage("lastname is required")
      .isLength({ min: 5 })
      .withMessage("min length is 5 digits"),
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
  ],
  async (req, res) => {
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
      return res.status(201).json({ status: "success", data: { user } });
    } catch (err) {
      return res.status(500).json({ status: "error", error: err.message });
    }
  }
);

app.post("/api/theusers/login", async (req, res) => {
  const user_email = req.body.email;
  const user_password = req.body.password;
  if (!user_email || !user_password) {
    return res.status(400).json({
      status: "Failed",
      data: "email & password are required",
    });
  } else {
    const matched_user = await usersmodel.findOne({ email: user_email });
    if (!matched_user) {
      return res.json({
        status: "Failed",
        data: "this email not exist",
      });
    } else {
      const matched_password = await bcrypt.compare(
        user_password,
        matched_user.password
      );
      if (!matched_password) {
        return res.json({
          status: "Failed",
          data: "this password is wrong",
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
          data: "logged in successfully",
          user: matched_user,
        });
      }
    }
  }
});

app.patch(
  "/api/theusers/:id",
  verify_token,
  allowed_to(roles.ADMIN, roles.MANAGER),
  async (req, res) => {
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
      return res.json({ status: "success", data: { updatedcourse } });
    } catch (err) {
      return res.status(400).json({ status: "error", error: err.message });
    }
  }
);

app.delete(
  "/api/thecourses/:id",
  verify_token,
  allowed_to(roles.MANAGER),
  async (req, res) => {
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
  }
);

app.use((req, res) => {
  return res.status(404).json({
    status: "Failed",
    error: "this route not found",
  });
});

app.listen(process.env.port || 3000, () => {
  console.log("listening on port", process.env.port);
});
