import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const createFolderIfNotExists = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    if (file.fieldname === "video") folder = "uploads/videos";
    if (file.fieldname === "image") folder = "uploads/images";
    if (file.fieldname === "images") folder = "uploads/images"; // Support plural manually for our route
    if (file.fieldname === "file") folder = "uploads/files";

    folder = "/app/" + folder;
    createFolderIfNotExists(folder);

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const randomString = crypto.randomBytes(15).toString("hex");
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();

    let filename = `${file.mimetype.split("/")[0]}_${
      file.mimetype.split("/")[1]
    }_${timestamp}_${randomString}${fileExtension}`;

    cb(null, filename);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image!"), false);
    }
  },
});
