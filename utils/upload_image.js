import multer from "multer";
import { imagesPath } from "../index.js";

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesPath);
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
export const upload = multer({
  storage: diskStorage,
  fileFilter: filter,
  limits: { fileSize: 1024 * 1024 * 5 },
});
