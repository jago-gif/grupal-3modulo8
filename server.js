import express from "express";
import mysql from "mysql2/promise";
import multer from "multer";
import sharp from "sharp";
import path from "path";

const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "admin",
  database: "joyeria",
};

// Crear una conexión a la base de datos
const pool = mysql.createPool(dbConfig);

// Configuración de multer para la subida de imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ruta para subir una imagen a una joya
app.post("/jewel/images/:id", upload.single("image"), async (req, res) => {
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
