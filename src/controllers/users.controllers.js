import { pool } from "../db.js";

export const getAllUsers = async (req, res) => {
    const { rows} = await pool.query('SELECT u.id AS "ID", u.username AS "Usuario", u.nombre_completo AS "Nombre", dep.nombre AS "Departamento", r.nombre AS "Tipo de Usuario" FROM usuarios u INNER JOIN departamentos dep ON u.departamento_id = dep.id INNER JOIN roles r ON u.rol_id = r.id ORDER BY u.id ASC;');
    res.json(rows);
}

export const getUserById = async (req, res) => {
    const userId = req.params.id;
    const { rows } = await pool.query('SELECT u.username AS "Usuario", u.nombre_completo AS "Nombre Completo", dep.nombre AS "Departamento", r.nombre AS "Tipo de Usuario" FROM usuarios u INNER JOIN departamentos dep ON u.departamento_id = dep.id INNER JOIN roles r ON u.rol_id = r.id WHERE u.id = $1;', [userId]);
    
    if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
}

export const createUser = async (req, res) => {
    try {
        const data = req.body;
        console.log(data);
        const { rows } = await pool.query('INSERT INTO usuarios (rol_id, departamento_id, password_hash, username, nombre_completo) VALUES ($1, $2, $3, $4, $5) RETURNING *;', 
        [data.rol_id, data.departamento_id, data.password_hash, data.username, data.nombre_completo]);

        console.log(rows);
        return res.json(rows[0]);
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const {  rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *;', [userId]);

    if (rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    res.sendStatus(204);
}

export const updateUser = async (req, res) => {
    const userId = req.params.id;
    const data = req.body;

    const {rows} = await pool.query('UPDATE usuarios SET username = $1, nombre_completo = $2, password_hash = $3, departamento_id = $4, rol_id = $5 WHERE id = $6 RETURNING *;', 
    [data.username, data.nombre_completo, data.password_hash, data.departamento_id, data.rol_id ,userId]);
    
    res.json({ message: "User updated successfully", user: rows[0] });
}

export const updateUserPassword = async (req, res) => {
    const userId = req.params.id;
    const { password_hash } = req.body;

    const { rows } = await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING *;', [password_hash, userId]);

    res.json({ message: "Password updated successfully", user: rows[0] });
}