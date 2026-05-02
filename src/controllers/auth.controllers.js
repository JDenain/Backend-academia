import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 12;

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

