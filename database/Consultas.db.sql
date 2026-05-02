--Crear Usuario
INSERT INTO usuarios (rol_id, departamento_id, password_hash, username, nombre_completo) VALUES ($1, $2, $3, $4, $5) RETURNING *;

--Actualizar Usuario
UPDATE usuarios SET username = $1, nombre_completo = $2, password_hash = $3, departamento_id = $4, rol_id = $5 WHERE id = $6 RETURNING *;

--Eliminar Usuario
DELETE FROM usuarios WHERE id = $1 RETURNING *;

--Obtener Usuario
SELECT u.username AS "Usuario", u.nombre_completo AS "Nombre", dep.nombre AS "Departamento", r.nombre AS "Tipo de Usuario" FROM usuarios u INNER JOIN departamentos dep ON u.departamento_id = dep.id INNER JOIN roles r ON u.rol_id = r.id WHERE u.id = $1;

--Obtener Todos los Usuarios
SELECT u.username AS "Usuario", u.nombre_completo AS "Nombre", dep.nombre AS "Departamento", r.nombre AS "Tipo de Usuario" FROM usuarios u INNER JOIN departamentos dep ON u.departamento_id = dep.id INNER JOIN roles r ON u.rol_id = r.id ORDER BY u.id ASC;

--Crear Documentos
INSERT INTO documentos (serial_registro, remitente, descripcion, departamento_id, tipo_doc_id, estado_id, urgencia, s3_key, creado_por, asignado_a) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;

--Actializar Documento Completo
UPDATE documentos SET serial_registro = $1, remitente = $2, descripcion = $3, departamento_id = $4, tipo_doc_id = $5, estado_id = $6, urgencia = $7, s3_key = $8, creado_por = $9, asignado_a = $10 WHERE id = $11 RETURNING *;

--Actualizar Estado de Documento
UPDATE documentos SET estado_id = $1 WHERE id = $2 RETURNING *;

--Actualizar Asignacion de Documento
UPDATE documentos SET departamento_id = $1, asignado_a = $2 WHERE id = $3;

--obtener documetos por id
SELECT d.serial_registro AS "Nro. Registro", d.fecha_registro AS "Fecha", d.remitente AS "Remitente", d.descripcion AS "Descripcion", dep.nombre AS "Depeartamento", td.nombre AS "Tipo de Documento", ed.nombre AS "Estado", d.urgencia AS "Urgencia", u_creador.username AS "Creado por", u_asignado.username AS "Asignado a" FROM documentos d INNER JOIN departamentos dep ON d.departamento_id = dep.id INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id INNER JOIN estados_documentos ed ON d.estado_id = ed.id INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id WHERE d.id = $1; 

--obtener documentos por departamento
SELECT d.serial_registro AS "Nro. Registro", d.fecha_registro AS "Fecha", d.remitente AS "Remitente", d.descripcion AS "Descripcion", dep.nombre AS "Depeartamento", td.nombre AS "Tipo de Documento", ed.nombre AS "Estado", d.urgencia AS "Urgencia", u_creador.username AS "Creado por", u_asignado.username AS "Asignado a" FROM documentos d INNER JOIN departamentos dep ON d.departamento_id = dep.id INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id INNER JOIN estados_documentos ed ON d.estado_id = ed.id INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id WHERE d.departamento_id = $1; 

--Obtener todos los Documentos
SELECT d.id AS "Id_Unico", d.serial_registro AS "Nro. Registro", d.fecha_registro AS "Fecha", d.remitente AS "Remitente", d.descripcion AS "Descripcion", dep.nombre AS "Depeartamento", td.nombre AS "Tipo de Documento", ed.nombre AS "Estado", d.urgencia AS "Urgencia", u_creador.username AS "Creado por", u_asignado.username AS "Asignado a" FROM documentos d INNER JOIN departamentos dep ON d.departamento_id = dep.id INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id INNER JOIN estados_documentos ed ON d.estado_id = ed.id INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id ORDER BY d.fecha_registro DESC; 

--WHERE d.asignado_a = ID_DEL_USUARIO_ACTUAL;
--WHERE d.departamento_id = ID_DEP_DEL_ADMIN;

UPDATE roles SET nombre = 'departamento' WHERE id = 1 RETURNING *;


UPDATE usuarios SET password_hash = '$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm' RETURNING *;

$2b$12$cibBTNHOhcFB0ZLfuItFUOvg7YzJBslECjtFGfAdygktk/V4OgRQm

INSERT INTO documentos (serial_registro, remitente, descripcion, departamento_id, tipo_doc_id, estado_id, urgencia, s3_key, creado_por, asignado_a) VALUES
(1456, 'Estado Mayor de la Defensa', 'Informe mensual de actividades operacionales', 14, 2, 2, 'Bajo', 'documentos/2026/02/1456_98696.pdf', 18, 3),
(1457, 'CAP. Ana Beatriz Fernández Morales', 'Informe de inspección de seguridad integral', 4, 1, 5, 'Bajo', 'documentos/2026/11/1457_81426.pdf', 14, 8),
(1458, 'G/B. Carlos Andrés Pérez Guzmán', 'Solicitud de equipos de protección personal', 15, 4, 3, 'Bajo', 'documentos/2026/04/1458_54118.pdf', 4, 3),
(1459, 'G/B. Antonio José Ramírez Silva', 'Orden de investigación administrativa disciplinaria', 5, 1, 6, 'Medio', 'documentos/2026/02/1459_59615.pdf', 3, 18),
(1460, 'MAY. Roberto Carlos Díaz Peña', 'Solicitud de asignación de vivienda militar', 3, 1, 1, 'Medio', 'documentos/2026/05/1460_20458.pdf', 8, 4),
(1461, 'MAY. Roberto Carlos Díaz Peña', 'Memorándum de instrucciones operativas urgentes', 7, 2, 6, 'Bajo', 'documentos/2026/11/1461_94939.pdf', 3, 7),
(1462, 'TCNL. Gabriela Andrea Mendoza Vega', 'Orden de servicio especial de guardia', 7, 2, 6, 'Bajo', 'documentos/2026/01/1462_40021.pdf', 2, 12),
(1463, 'Ministerio del Poder Popular para la Defensa', 'Solicitud de asignación de vivienda militar', 17, 3, 2, 'Medio', 'documentos/2026/07/1463_94259.pdf', 15, 5),
(1464, 'C/2. Rosa María Blanco Duarte', 'Informe de control disciplinario del cuerpo de cadetes', 14, 4, 5, 'Bajo', 'documentos/2026/04/1464_28131.pdf', 17, 16),
(1465, 'Estado Mayor de la Defensa', 'Informe de evaluación de desempeño del personal', 12, 4, 5, 'Bajo', 'documentos/2026/07/1465_88104.pdf', 15, 18),
(1466, 'CNEL. María Elena Rodríguez Silva', 'Informe de control de gestión comunicacional', 14, 3, 6, 'Bajo', 'documentos/2026/05/1466_66985.pdf', 6, 16),
(1467, 'CAP. Elena Cristina Bravo Fuentes', 'Memorándum de coordinación con fuerzas aliadas', 14, 1, 6, 'Bajo', 'documentos/2026/11/1467_76540.pdf', 7, 5),
(1468, 'C/1. Miguel Ángel León Herrera', 'Solicitud de permiso de ausencia para personal militar', 11, 4, 1, 'Bajo', 'documentos/2026/06/1468_50306.pdf', 8, 2),
(1469, 'Ministerio de Defensa', 'Informe de inspección sanitaria de instalaciones', 9, 1, 5, 'Medio', 'documentos/2026/03/1469_96474.pdf', 16, 18),
(1470, 'Comando de Ingeniería', 'Orden de movilización de recursos logísticos', 18, 2, 6, 'Bajo', 'documentos/2026/11/1470_95180.pdf', 12, 16),
(1471, 'CNEL. Rosa María Blanco Duarte', 'Propuesta de reforma del reglamento interno', 1, 1, 5, 'Medio', 'documentos/2026/10/1471_38864.pdf', 1, 4),
(1472, 'C/1. Jorge Enrique Salas Núñez', 'Orden de traslado de personal entre unidades', 16, 1, 5, 'Bajo', 'documentos/2026/11/1472_73624.pdf', 7, 18),
(1473, 'CNEL. Sofía Margarita Castro Peña', 'Solicitud de viáticos para comisión de servicio', 15, 4, 2, 'Bajo', 'documentos/2026/11/1473_66498.pdf', 12, 15),
(1474, 'S/1. Roberto Carlos Méndez Ávila', 'Informe de control de gestión comunicacional', 12, 1, 1, 'Medio', 'documentos/2026/06/1474_24322.pdf', 8, 7),
(1475, 'MAY. Diego Alejandro Ruiz Campos', 'Solicitud de reconocimiento al mérito militar', 3, 4, 2, 'Alto', 'documentos/2026/02/1475_68082.pdf', 18, 4),
(1476, 'CNEL. María Elena Rodríguez Silva', 'Informe de inspección de seguridad integral', 18, 2, 2, 'Medio', 'documentos/2026/08/1476_38016.pdf', 13, 2),
(1477, 'TCNL. Ana Patricia Méndez Bravo', 'Informe de control disciplinario del cuerpo de cadetes', 18, 4, 3, 'Medio', 'documentos/2026/12/1477_82845.pdf', 16, 5),
(1478, 'S/2. Diana Patricia Castro León', 'Informe de evaluación de riesgos operacionales', 14, 1, 6, 'Bajo', 'documentos/2026/01/1478_86569.pdf', 16, 18),
(1479, 'S/1. Sebastián Tomás Díaz Bravo', 'Informe de inspección de seguridad integral', 16, 1, 5, 'Bajo', 'documentos/2026/04/1479_62923.pdf', 4, 9),
(1480, 'Ministerio de Defensa', 'Propuesta de convenio con institución educativa', 12, 3, 3, 'Bajo', 'documentos/2026/12/1480_51180.pdf', 8, 10),
(1481, 'C/1. Daniel Alejandro Peña Bravo', 'Orden de servicio especial de guardia', 6, 1, 1, 'Medio', 'documentos/2026/10/1481_23104.pdf', 3, 18),
(1482, 'CNEL. Patricia Isabel León Herrera', 'Informe de auditoría de gestión humana', 17, 2, 3, 'Bajo', 'documentos/2026/08/1482_81200.pdf', 10, 18),
(1483, 'Dirección de Planificación Estratégica', 'Informe de estado de fuerza actualizado', 18, 1, 2, 'Bajo', 'documentos/2026/02/1483_82512.pdf', 5, 10),
(1484, 'Comando de Educación y Doctrina', 'Orden de movilización de recursos logísticos', 13, 3, 5, 'Medio', 'documentos/2026/01/1484_22097.pdf', 14, 9),
(1485, 'CNEL. Patricia Isabel León Herrera', 'Informe de actividades de investigación científica', 18, 2, 6, 'Medio', 'documentos/2026/12/1485_66057.pdf', 18, 1),
(1486, 'PTTE. Fernando Antonio Silva Bravo', 'Informe de control de estudios académicos', 1, 3, 5, 'Medio', 'documentos/2026/07/1486_26704.pdf', 2, 11),
(1487, 'CNEL. Laura Patricia Fernández Luna', 'Orden de movilización de recursos logísticos', 13, 1, 3, 'Medio', 'documentos/2026/07/1487_91351.pdf', 5, 9),
(1488, 'C/1. Luis Alberto Peña Vargas', 'Informe mensual de actividades operacionales', 3, 3, 4, 'Medio', 'documentos/2026/12/1488_42527.pdf', 9, 6),
(1489, 'PTTE. Luis Alberto Martínez Díaz', 'Solicitud de ampliación de presupuesto operativo', 4, 4, 3, 'Bajo', 'documentos/2026/04/1489_39219.pdf', 1, 8),
(1490, 'C/1. Jorge Enrique Salas Núñez', 'Informe de resultados de ejercicios tácticos', 5, 4, 6, 'Alto', 'documentos/2026/09/1490_53404.pdf', 1, 5),
(1491, 'CAP. Elena Cristina Bravo Fuentes', 'Orden de traslado de personal entre unidades', 2, 4, 3, 'Medio', 'documentos/2026/06/1491_67199.pdf', 17, 4),
(1492, 'MAY. Juan Pablo Castillo Mendoza', 'Orden de traslado de personal entre unidades', 13, 1, 5, 'Alto', 'documentos/2026/09/1492_97900.pdf', 7, 13),
(1493, 'Dirección de Justicia Militar', 'Solicitud de implementación de sistema tecnológico', 6, 1, 6, 'Alto', 'documentos/2026/09/1493_50538.pdf', 14, 11),
(1494, 'Dirección de Planificación Estratégica', 'Solicitud de capacitación especializada para cadetes', 3, 4, 6, 'Medio', 'documentos/2026/03/1494_90676.pdf', 18, 10),
(1495, 'G/B. Carlos Andrés Pérez Guzmán', 'Informe de estado de fuerza actualizado', 5, 4, 5, 'Medio', 'documentos/2026/06/1495_70946.pdf', 15, 16),
(1496, 'CNEL. Sofía Margarita Castro Peña', 'Memorándum de directrices para nuevo personal', 17, 2, 6, 'Bajo', 'documentos/2026/09/1496_97012.pdf', 11, 3),
(1497, 'Comandancia Naval', 'Solicitud de intervención de consultoría jurídica', 3, 1, 1, 'Bajo', 'documentos/2026/08/1497_90120.pdf', 3, 16),
(1498, 'C/2. Camila Daniela Vargas Peña', 'Solicitud de autorización para evento ceremonial', 13, 4, 4, 'Bajo', 'documentos/2026/11/1498_10726.pdf', 4, 15),
(1499, 'S/2. Camila Daniela Peña Luna', 'Orden de servicio especial de guardia', 1, 2, 1, 'Medio', 'documentos/2026/08/1499_97500.pdf', 17, 18),
(1500, 'Dirección de Sanidad Militar', 'Solicitud de implementación de sistema tecnológico', 15, 4, 5, 'Medio', 'documentos/2026/03/1500_72216.pdf', 15, 9),
(1501, 'S/2. Camila Daniela Peña Luna', 'Informe de actividades de extensión comunitaria', 12, 3, 4, 'Bajo', 'documentos/2026/05/1501_40735.pdf', 9, 12),
(1502, 'MAY. Diego Alejandro Ruiz Campos', 'Informe de evaluación de desempeño del personal', 4, 2, 6, 'Bajo', 'documentos/2026/07/1502_63424.pdf', 11, 18),
(1503, 'Vicepresidencia Ejecutiva', 'Propuesta de convenio con institución educativa', 7, 1, 5, 'Bajo', 'documentos/2026/01/1503_56105.pdf', 10, 14),
(1504, 'Comando de Operaciones Especiales', 'Solicitud de intervención de consultoría jurídica', 11, 2, 4, 'Bajo', 'documentos/2026/07/1504_73654.pdf', 1, 14),
(1505, 'S/2. Diana Victoria León Gil', 'Informe de inspección sanitaria de instalaciones', 3, 4, 2, 'Alto', 'documentos/2026/09/1505_13534.pdf', 13, 1);

