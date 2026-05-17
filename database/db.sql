CREATE TABLE roles(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) UNIQUE NOT NULL
);

INSERT INTO roles (nombre) VALUES
('Administrador'), ('Editor'), ('Lector'), ('root');

CREATE TABLE tipos_de_documentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO tipos_de_documentos (nombre) VALUES
('OFICIO'), ('MEMORANDUM'), ('ORGANIGRAMA'), ('OTRO');

CREATE TABLE estados_documentos(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO estados_documentos (nombre) VALUES
('Recibido'), ('En Revision'), ('Firmado'), ('Rechazado'), ('Archivado'), ('Sin Estado');

CREATE TABLE departamentos(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO departamentos (nombre) VALUES
('DIRECCION'), ('SUBDIRECCION'), ('OFICINA DE CONTROL DE GESTION'), ('OFICINA DE SOPORTE TECNICO'),
('CONSULTORIA JURIDICA'), ('OFICINA DE GESTIÓN COMUNICACIONAL'), ('COORDINACIÓN DE GESTION HUMANA'),
('COORDINACIÓN DE SEGURIDAD INTEGRAL'), ('COORDINACIÓN DE ADMINISTRACION Y LOGISTICA'),
('COORDINACIÓN ACADEMICA'), ('COORDINACIÓN DE INVESTIGACIONES'), ('COORDINACIÓN DE EXTENSION'),
('COORDINACIÓN DE CONTROL ESTUDIANTIL'), ('COMANDO DE CUERPO DE CADETES'),
('2DO COMANDANTE DEL CCC'), ('BATAYON DE APOYO Y SERVICIO'), ('2DO COMANDANTE DEL BAPS'), ('MESA DE PARTE');

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre_completo VARCHAR(100),
    rol_id INTEGER REFERENCES roles(id),
    departamento_id INTEGER REFERENCES departamentos(id),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refresh_token TEXT
);

INSERT INTO usuarios (rol_id, departamento_id, password_hash, username, nombre_completo) VALUES
(1, 1, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'G/B.CASTILLO.L', 'G/    B. LANSFORD JOSE CASTILLO LOPEZ'),
(1, 2, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'CNEL.GODOY.B', 'CNEL. GUSTAVO GREGORIO GODOY BRICEÑO'),
(1, 3, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'MAY.AGUIRRE.S', 'MAY. JESUS FRANCISCO AGUIRRE SALAZAR'),
(3, 4, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'CAP.DIAZ.R', 'CAP. WALTER ALEJANDRO DIAZ RON'),
(3, 5, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'PTTE.VALLES.R', 'PTTE. MIGUEL LEONARDO VALLES RIVERO'),
(3, 6, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'CAP.RICO.Q', 'CAP. MIRIAN DE JESUS RICO QUERALES'),
(3, 7, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'MAY.MORALES.S', 'MAY. DANIEL EDUARDO MORALES SUAREZ'),
(3, 8, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'TCNL.AGUILAR.R', 'TCNL. EDGAR ALEXANDER AGUILAR RAMONEZ'),
(3, 9, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'CAP.LINARES.B', 'CAP. JHON ALEXANDER LINARES BECERRA'),
(3, 10, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'CNEL.ALAYÓN.P', 'CNEL. JOEL ANTONIO ALAYÓN POVEDA'),
(3, 11, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'MAY.ORAÁ.H', 'MAY. LISSET JAMILET ORAÁ HERNANDEZ'),
(3, 12, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'MAY.JIMENEZ.C', 'MAY. MIGUEL EDUARDO JIMENEZ CERDEÑO'),
(3, 13, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'TCNL.TORES.H', 'TCNL. ZULVIC ELISA TORES HERNANDEZ'),
(3, 14, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'CNEL.LIZARDO.A', 'CNEL. EDICSON HELY LIZARDO ARRIETA'),
(3, 15, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'TCNL.RODRIGUEZ.V', 'TCNL. JOSE RAMON RODRIGUEZ VILLANUEVA'),
(3, 16, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'TCNL.FUENTES.U', 'TCNL. LUIS ANTONIO FUENTES USECHE'),
(3, 17, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'MAY.MORALES.M', 'MAY. SIMON ALBERTO MORALES MOSQUERA'),
(2, 18, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'S2.SALAZAR', 'SALAZAR'),
(2, 18, '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm', 'S2.SUAREZ', 'SUAREZ');

  
--instucciones
-- CREATE TABLE instrucciones_documentos(
--     id SERIAL PRIMARY KEY,
--     nombre VARCHAR(40) UNIQUE NOT NULL
-- );

-- INSERT INTO instrucciones_documentos (nombre) VALUES
-- ('Revisar'), ('Firmar'), ('Entregar'), ('Pasar por el Libro') , ('Archivar'), ('Proceder segun P.A.V'),
-- ('Preparar Exposicion'), ('Informar al personal Interesado');

CREATE TABLE documentos(
    id SERIAL PRIMARY KEY,
    serial_registro VARCHAR(50) UNIQUE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remitente VARCHAR(150) NOT NULL,
    descripcion TEXT,
    departamento_id INTEGER REFERENCES departamentos(id),
    tipo_doc_id INTEGER REFERENCES tipos_de_documentos(id),
    estado_id INTEGER REFERENCES estados_documentos(id),
    urgencia VARCHAR CHECK (urgencia IN ('Bajo', 'Medio', 'Alto')),
    direccion VARCHAR(10) NOT NULL DEFAULT 'entrada' CHECK (direccion IN ('entrada', 'salida')),
    destino VARCHAR(200),
    s3_key TEXT NOT NULL,
    s3_url_bucket TEXT,
    creado_por INTEGER REFERENCES usuarios(id),
    asignado_a INTEGER REFERENCES usuarios(id),
    ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO documentos (serial_registro, remitente, descripcion, departamento_id, tipo_doc_id, estado_id, urgencia, s3_key, creado_por, asignado_a) VALUES 
(1454, 'Jesus Martinez', 'Carta de Postulacion', 2, 1, 1, 'Bajo', 'link.ejm/35244', 3, 2),
(1455, 'MAY. Daniel Morales', 'Solicitud de Personal', 2, 1, 1, 'Medio', 'link.ejm/35255', 3, 2);

CREATE TABLE biometric_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES usuarios(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

