import "dotenv/config";
import cors from "cors";
import path from "path";
import express from "express";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { usersRouter } from "./routes/users_routes.js";
import { courseRouter } from "./routes/courses_routes.js";
import { notFound, listening, homeRouter } from "./Middlewares/handlers.js";

const app = express();

mongoose
  .connect(process.env.mongo_url)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err);
  });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const imagesPath = path.join(__dirname, "uploads");

app.use(cors());
app.use(express.json());
app.use("/", homeRouter);
app.use("/uploads", express.static(imagesPath));
app.use("/api/thecourses", courseRouter);
app.use("/api/theusers", usersRouter);
app.use(notFound);
app.listen(process.env.port || 3000, listening);
