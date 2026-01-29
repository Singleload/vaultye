import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hämta alla användare (Endast Admin)
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta användare' });
  }
};

// Skapa användare (Endast Admin)
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'MANAGER' }
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte skapa användare (email kanske upptagen?)' });
  }
};

// Uppdatera användare (Lösenord, Roll, Status)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive, password } = req.body;
  
  try {
    const data = { name, email, role, isActive };
    if (password && password.length > 0) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte uppdatera användare' });
  }
};

// Radera användare (Cascade tar bort system)
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte radera användare' });
  }
};