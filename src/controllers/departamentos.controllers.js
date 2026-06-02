import { pool } from '../db.js';

export const getDepartamentos = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM departamentos ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error in getDepartamentos:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const createDepartamento = async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del departamento es requerido' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO departamentos (nombre) VALUES ($1) RETURNING *',
            [nombre.toUpperCase()]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error in createDepartamento:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Ya existe un departamento con ese nombre' });
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const updateDepartamento = async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del departamento es requerido' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE departamentos SET nombre = $1 WHERE id = $2 RETURNING *',
            [nombre.toUpperCase(), id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error in updateDepartamento:', error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Ya existe un departamento con ese nombre' });
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const deleteDepartamento = async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await pool.query('DELETE FROM departamentos WHERE id = $1', [id]);
        
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error in deleteDepartamento:', error);
        // Error code for foreign key violation (e.g. users or documents are assigned to this department)
        if (error.code === '23503') {
            return res.status(409).json({ message: 'No se puede eliminar el departamento porque está siendo utilizado por usuarios o documentos' });
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
