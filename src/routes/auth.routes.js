import { Router } from "express";
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, lg } from "../controllers/auth.controllers.js";
import { pool } from "../db.js";
import { validateRegister, validateLogin } from "../controllers/auth.validator.js";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const router = Router();

router.post("/register", validateRegister, async (req, res) => {
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
});

// POST /login
router.post('/login', validateLogin, async (req, res) => {
  console.log('Headers:', req.headers);
  console.log(req.body)
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
});


// router.get("/lg", lg);

router.post('/refresh-token', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    // Verificar que el usuario aún existe y que el refreshToken sea válido (puedes comparar con BD)
    const user = await pool.query('SELECT id, username, rol_id FROM usuarios WHERE id = $1 AND refresh_token = $2', [decoded.id, token]);
    if (!user.rows[0]) return res.sendStatus(403);
    const accessToken = generateAccessToken(user.rows[0]);
    res.json({ accessToken });
  } catch {
    res.sendStatus(403);
  }
});

router.post('/login/biometric', async (req, res) => {
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
});

export default router;