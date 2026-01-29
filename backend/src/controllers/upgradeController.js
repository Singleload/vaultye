import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createUpgrade = async (req, res) => {
  const { version, title, description, plannedDate, downtime, systemId } = req.body;
  try {
    const upgrade = await prisma.upgrade.create({
      data: {
        version,
        title,
        description,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        downtime: Boolean(downtime),
        systemId,
        status: 'PLANNED'
      }
    });
    res.status(201).json(upgrade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte skapa uppgradering' });
  }
};

export const updateUpgrade = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.upgrade.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte uppdatera uppgradering' });
  }
};

export const deleteUpgrade = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.upgrade.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte radera uppgradering' });
  }
};