import express from "express";
import mysql from "mysql2/promise";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import jwt from "jsonwebtoken";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "admin",
  database: "joyeria",
};

app.use(express.json());

// Crear una conexión a la base de datos
const pool = mysql.createPool(dbConfig);

// Configuración de multer para la subida de imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/hola", (req, res) => {
  res.send("hola")
});

app.post("/login", (req, res) => {
  const id = req.body.id;
  console.log(id)
  jwt.sign(id, "secret_key", (err, token) => {
    if (err) {
      res.status(400).send({ msg: "Error" });
    } else {
      res.send({ msg: "success", token: token });
    }
  });
});

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(403);
  jwt.verify(token, "secret_key", (err, user) => {
    if (err) return res.sendStatus(404);
    req.user = user;
    next();
  });
}


// Ruta para subir una imagen a una joya
app.post("/jewel/images/:id", upload.single("image"), verifyToken, async (req, res) => {
  const jewelId = req.params.id;

  if (
    !req.file ||
    req.file.mimetype !== "image/png" ||
    req.file.size > 5 * 1024 * 1024
  ) {
    return res
      .status(400)
      .json({ error: "Formato o tamaño de imagen inválido" });
  }

  try {
    const imageBuffer = req.file.buffer;

    // Generar nombres únicos para las imágenes
    const imageName = `jewel_${jewelId}_${Date.now()}`;
    const imagePathColor = path.join(
      __dirname,
      "public",
      "images",
      `${imageName}_color.png`
    );
    const imagePathBW = path.join(
      __dirname,
      "public",
      "images",
      `${imageName}_bnw.png`
    );

    // Crear versiones en color y blanco y negro de la imagen
    await sharp(imageBuffer).resize(400).toFile(imagePathColor);
    await sharp(imageBuffer).resize(400).greyscale().toFile(imagePathBW);

    // Insertar URLs de las imágenes en la base de datos
    const conn = await pool.getConnection();
    const [colorResult] = await conn.query(
      "INSERT INTO imagenes (url, joya_id, tipo) VALUES (?, ?, ?)",
      [imagePathColor, jewelId, "color"]
    );
    const [bwResult] = await conn.query(
      "INSERT INTO imagenes (url, joya_id, tipo) VALUES (?, ?, ?)",
      [imagePathBW, jewelId, "bnw"]
    );
    conn.release();

    res.json({
      message: "Imagen subida exitosamente",
      colorUrl: imagePathColor,
      bwUrl: imagePathBW,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
});

app.put("/jewel/images/:id", upload.single("image"), async (req, res) => {
  const jewelId = req.params.id;

  if (
    !req.file ||
    req.file.mimetype !== "image/png" ||
    req.file.size > 5 * 1024 * 1024
  ) {
    return res
      .status(400)
      .json({ error: "Formato o tamaño de imagen inválido" });
  }

  try {
    const imageBuffer = req.file.buffer;

    // Generar un nuevo nombre único para la imagen
    const newImageName = `jewel_${jewelId}_${Date.now()}`;
    const newImagePathColor = path.join(
      __dirname,
      "public",
      "images",
      `${newImageName}_color.png`
    );
    const newImagePathBW = path.join(
      __dirname,
      "public",
      "images",
      `${newImageName}_bnw.png`
    );

    // Crear versiones en color y blanco y negro de la nueva imagen
    await sharp(imageBuffer).resize(400).toFile(newImagePathColor);
    await sharp(imageBuffer).resize(400).greyscale().toFile(newImagePathBW);

    // Actualizar las URLs de las imágenes en la base de datos
    const conn = await pool.getConnection();
    // Aquí deberías implementar la lógica para actualizar las URLs de las imágenes
    // asociadas a la joya en la base de datos.
    conn.release();

    res.json({
      message: "Imagen de la joya actualizada exitosamente",
      colorUrl: newImagePathColor,
      bwUrl: newImagePathBW,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la imagen de la joya" });
  }
});


app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
