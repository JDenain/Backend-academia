import { pool } from "../db.js";
import bcrypt from 'bcrypt';

export const getAllUsers = async (req, res) => {
    const { rows} = await pool.query(`
        SELECT u.id AS "id", u.username AS "username", u.nombre_completo AS "nombre_completo", 
               u.departamento_id, u.rol_id, u.activo,
               dep.nombre AS "departamento", r.nombre AS "rol"
        FROM usuarios u 
        INNER JOIN departamentos dep ON u.departamento_id = dep.id 
        INNER JOIN roles r ON u.rol_id = r.id 
        ORDER BY u.id ASC;
    `);
    res.json(rows);
}

export const getUserById = async (req, res) => {
    const userId = req.params.id;
    
    // Auth check: solo admin o el propio usuario
    if (req.user.rol !== 1 && req.user.rol !== 4 && req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    const { rows } = await pool.query(`
        SELECT u.id AS "id", u.username AS "username", u.nombre_completo AS "nombre_completo", 
               u.departamento_id, u.rol_id, u.activo,
               dep.nombre AS "departamento", r.nombre AS "rol"
        FROM usuarios u 
        INNER JOIN departamentos dep ON u.departamento_id = dep.id 
        INNER JOIN roles r ON u.rol_id = r.id 
        WHERE u.id = $1;
    `, [userId]);
    
    if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
}

export const createUser = async (req, res) => {
    try {
        const data = req.body;
        const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const { rows } = await pool.query(
            'INSERT INTO usuarios (rol_id, departamento_id, password_hash, username, nombre_completo, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, nombre_completo, rol_id, departamento_id, activo;', 
            [data.rol_id, data.departamento_id, passwordHash, data.username, data.nombre_completo, data.activo !== undefined ? data.activo : true]
        );

        return res.json(rows[0]);
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Eliminar registros relacionados en biometric_tokens para evitar error de foreign key
        await pool.query('DELETE FROM biometric_tokens WHERE user_id = $1;', [userId]);
        
        const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *;', [userId]);

        if (rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.sendStatus(204);
    } catch (error) {
        console.error("Error deleting user:", error);
        if (error.code === '23503') { // PostgreSQL foreign_key_violation code
            return res.status(409).json({ error: "El usuario no puede ser eliminado debido a que tiene documentos o registros asociados. Por favor, edite su perfil y márquelo como 'No Activo' para restringir su acceso." });
        }
        res.status(500).json({ error: "Error al eliminar usuario. Puede que tenga registros asociados que impiden su eliminación." });
    }
}

export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const data = req.body;
        const currentUser = req.user;

        if (currentUser.rol !== 1 && currentUser.rol !== 4 && currentUser.id !== parseInt(userId)) {
            return res.status(403).json({ error: "No tienes permiso para modificar este usuario" });
        }

        const { rows: currentRows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
        if (currentRows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const doc = currentRows[0];

        let rol_id = doc.rol_id;
        let departamento_id = doc.departamento_id;
        let activo = doc.activo;
        // Solo admins pueden cambiar rol, departamento o estado activo
        if (currentUser.rol === 1 || currentUser.rol === 4) {
            rol_id = data.rol_id || doc.rol_id;
            departamento_id = data.departamento_id || doc.departamento_id;
            activo = data.activo !== undefined ? data.activo : doc.activo;
        }

        let password_hash = doc.password_hash;
        if (data.password && data.password.trim() !== '') {
            const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 12;
            password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
        }

        const username = data.username || doc.username;
        const nombre_completo = data.nombre_completo || doc.nombre_completo;

        const {rows} = await pool.query(
            'UPDATE usuarios SET username = $1, nombre_completo = $2, password_hash = $3, departamento_id = $4, rol_id = $5, activo = $6 WHERE id = $7 RETURNING id, username, nombre_completo, rol_id, departamento_id, activo;', 
            [username, nombre_completo, password_hash, departamento_id, rol_id, activo, userId]
        );
        
        res.json({ message: "Usuario actualizado", user: rows[0] });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
}

export const updateUserPassword = async (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;

    const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id, username;', [passwordHash, userId]);

    res.json({ message: "Password updated successfully", user: rows[0] });
}