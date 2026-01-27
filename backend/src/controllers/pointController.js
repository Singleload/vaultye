// backend/src/controllers/pointController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPoint = async (req, res) => {
  const { title, description, origin, priority, systemId, meetingId } = req.body;
  try {
    const newPoint = await prisma.point.create({
      data: {
        title,
        description,
        origin,
        priority,
        systemId,
        status: 'NEW',
        meetingId
      }
    });
    res.status(201).json(newPoint);
  } catch (error) {
    console.error('Error creating point:', error);
    res.status(500).json({ error: 'Kunde inte skapa punkten' });
  }
};

// Uppdatera hela punkten (Analys, Status, Detaljer)
export const updatePoint = async (req, res) => {
  const { id } = req.params;
  const data = req.body; // Vi tar emot allt som skickas

  // Om relevans skickas som sträng, gör om till int
  if (data.relevance) {
    data.relevance = parseInt(data.relevance);
  }

  try {
    const updatedPoint = await prisma.point.update({
      where: { id },
      data: data // Prisma uppdaterar bara de fält som finns i objektet
    });
    res.json(updatedPoint);
  } catch (error) {
    console.error('Error updating point:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera punkten' });
  }
};

export const deletePoint = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.point.delete({
      where: { id }
    });
    res.status(204).send(); // 204 = No Content (Lyckades, men skickar inget tillbaka)
  } catch (error) {
    console.error('Error deleting point:', error);
    res.status(500).json({ error: 'Kunde inte radera punkten' });
  }
};