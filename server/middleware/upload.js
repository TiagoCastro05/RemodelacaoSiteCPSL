const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Detectar se devemos usar Cloudinary (produção) ou disco (dev/self-hosted)
const useCloudinary =
  !!process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);

let storage;

if (useCloudinary) {
  // Config via CLOUDINARY_URL (recomendado) ou pelos componentes individuais
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
  }

  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const allowed = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "mpeg", "pdf"];
      const ext = (file.originalname.split(".").pop() || "").toLowerCase();
      const folder = file.mimetype.startsWith("image/")
        ? "imagens"
        : file.mimetype.startsWith("video/")
        ? "videos"
        : file.mimetype === "application/pdf"
        ? "pdfs"
        : "outros";

      return {
        folder: process.env.CLOUDINARY_FOLDER || "cpsl/uploads/" + folder,
        resource_type: "auto",
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        format: allowed.includes(ext) ? ext : undefined,
      };
    },
  });
} else {
  // Fallback para disco local (dev)
  const uploadDir = "./uploads";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = "outros";

      if (file.mimetype.startsWith("image/")) {
        folder = "imagens";
      } else if (file.mimetype.startsWith("video/")) {
        folder = "videos";
      } else if (file.mimetype === "application/pdf") {
        folder = "pdfs";
      }

      const destPath = path.join(uploadDir, folder);
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }

      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

// Filtro de ficheiros (aplicado só no disco; Cloudinary valida tipos pelo resource_type auto)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de ficheiro não permitido. Apenas imagens, vídeos e PDFs são aceites."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter: useCloudinary ? undefined : fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB por defeito
  },
});

module.exports = upload;
