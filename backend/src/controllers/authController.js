import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'xasda47521531454131xaeTareat1234Xasd1231asSDii4312s';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Hitta användare
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Felaktiga uppgifter' });

    // Kolla om inaktiv
    if (!user.isActive) return res.status(403).json({ error: 'Kontot är inaktiverat' });

    // Kolla lösenord
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Felaktiga uppgifter' });

    // Skapa token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Login misslyckades' });
  }
};

// Seed-funktion för att skapa första admin (om ingen finns)
export const createFirstAdmin = async () => {
  const count = await prisma.user.count();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'dennis.enstrom@borlange.se',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN'
      }
    });
    console.log('👑 Admin-konto skapat: dennis.enstrom@borlange.se / admin123');
  }
};