import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from "../db.js";
import crypto from 'crypto';
import { ref } from "process";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 12;

export const register = async (req, res) => {
    const { user, password } = req.body;
    try {
        const existingUser = await pool.query('SELECT id FROM usuarios WHERE username = $1', [user]);
        if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'El usuario ya existe' });
        }

        const passwordHash = await hashPassword(password);
        const result = await pool.query(
        'INSERT INTO usuarios (username, password_hash) VALUES ($1, $2) RETURNING id, username',
        [user, passwordHash]
        );
        const user = result.rows[0];

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        await pool.query('UPDATE usuarios SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        });

        res.status(201).json({ accessToken, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

export const userLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
    const result = await pool.query('SELECT id, username, password_hash, rol_id FROM usuarios WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    console.log(user)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log(refreshToken)
    await pool.query('UPDATE usuarios SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const biometricToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(biometricToken, 10);
    await pool.query(
        'INSERT INTO biometric_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, new Date(Date.now() + 30*24*60*60*1000)] // 30 días
    );
    res.status(201).json({ biometricToken, accessToken, success:true ,user: { id: user.id, username: user.username, rol: user.rol_id } });
    } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
    }
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    console.log(decoded)
    console.log(decoded.id)
    // Verificar que el usuario aún existe y que el refreshToken sea válido (puedes comparar con BD)
    const user = await pool.query('SELECT id, username, rol_id FROM usuarios WHERE id = $1 AND refresh_token = $2', [decoded.id, token]);
    if (!user.rows[0]) return res.sendStatus(403);
    const accessToken = generateAccessToken(user.rows[0]);
    res.json({ accessToken });
  } catch {
    res.sendStatus(403);
  }
};

export const biometricLogin = async (req, res) => {
  const { biometricToken, userId } = req.body; // userId lo puedes guardar junto al token
  // Buscar token activo para ese usuario
  const result = await pool.query('SELECT * FROM biometric_tokens WHERE user_id = $1 AND expires_at > NOW()', [userId]);
  for (const row of result.rows) {
    if (await bcrypt.compare(biometricToken, row.token_hash)) {
      // Token válido, generar access/refresh token y devolverlos
      const user = await pool.query('SELECT id, username, rol_id FROM usuarios WHERE id = $1', [userId]);
      const accessToken = generateAccessToken(user.rows[0]);
      const refreshToken = generateRefreshToken(user.rows[0]);
      // ... guardar refresh token en BD, etc.
      return res.json({ accessToken, refreshToken });
    }
  }
  res.status(401).json({ error: 'Token biométrico inválido o expirado' });
};

export const hashPassword = async (plainPassword) => {
    try {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  } catch (error) {
    console.error('Error al hashear la contraseña:', error);
    throw new Error('Error al procesar la contraseña');
  }
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
    try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
    throw new Error('Error al verificar la contraseña');
  }
};

export const generateAccessToken = (user) => {
    return jwt.sign(
    { id: user.id, username: user.username, rol: user.rol_id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' } // Corta duración para acceso a API
  );
}

export const generateRefreshToken = (user) => {
    return jwt.sign(
    { id: user.id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export const verifyAccessToken = (token, secret) => {
    try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

export const login = async (req, res) => {
    const { email , password } = req.body
    try{
        const user = await UserActivation.findOne({ where: {email } });
        if(!user) return res.status(404).json({ message: "Usuario no Encontrado"});

        const validPass = await bcrypt.compare(password, user.password)
        if(!validPass) return res.status(401).json({ message:"Credenciales Invalidas"});

        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role
            },
            ProcessingInstruction.env.JWT_SECRET, { expiresIn: '8h'}
        );

        res.json({ token, user: { name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
};


//---------------------------------------
//Logica exclusiva para el Administrador
//---------------------------------------

export const createUser = async(req, res) => {
    try {
        const { name, email , password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS);

        const newUser = await User.create({ name, email, password: hashedPassword, role });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message:"Error al crear usuario" });
    }
};

export const updateUser = async(req, res) => {
    const { id } = req.params;
    const { name, password, role } = req.body;
    try {
        let updateData = { name, role };
        if (password) updateData.password = await bcrypt.hash(password, process.env.SALT_ROUNDS);

        await User.update(updateData, { where: { id } });
        res.json({ message: "Usuario actualizado Correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
};

