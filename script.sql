create schema joyeria

CREATE TABLE imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(255),
  joya_id INT,
  tipo VARCHAR(10)
);
CREATE TABLE joyas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255),
  descripcion TEXT,
  imagen_id INT
);
ALTER TABLE joyas
ADD CONSTRAINT fk_imagen
FOREIGN KEY (imagen_id) REFERENCES imagenes(id);

INSERT INTO
    joyas (nombre, descripcion, imagen_id)
VALUES (
        'Joya 1',
        'Descripción de Joya 1',
        1
    ), (
        'Joya 2',
        'Descripción de Joya 2',
        2
    );
INSERT INTO imagenes (url, joya_id, tipo) VALUES
  ('public/images/image1_color.png', 1, 'color'),
  ('public/images/image1_bnw.png', 1, 'bnw'),
  ('public/images/image2_color.png', 2, 'color'),
  ('public/images/image2_bnw.png', 2, 'bnw');

