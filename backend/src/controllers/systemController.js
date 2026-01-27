import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hämta alla system
export const getSystems = async (req, res) => {
  try {
    const systems = await prisma.systemObject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        // Vi vill räkna hur många öppna åtgärder som finns
        _count: {
          select: { points: { where: { status: { not: 'CLOSED' } } } }
        }
      }
    });
    res.json(systems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte hämta system' });
  }
};

// Hämta ett specifikt system med dess punkter
export const getSystemById = async (req, res) => {
  const { id } = req.params;
  try {
    const system = await prisma.systemObject.findUnique({
      where: { id },
      include: {
        points: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { date: 'desc' } },
        upgrades: { orderBy: { plannedDate: 'desc' } }
      }
    });

    if (!system) return res.status(404).json({ error: 'Systemet hittades inte' });

    res.json(system);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte hämta systemet' });
  }
};

// Skapa ett nytt system
export const createSystem = async (req, res) => {
  const { name, description, ownerName, ownerEmail, resourceGroup } = req.body;

  try {
    const newSystem = await prisma.systemObject.create({
      data: {
        name,
        description,
        ownerName,
        ownerEmail,
        resourceGroup
      }
    });
    res.status(201).json(newSystem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte skapa system' });
  }
};

export const updateSystem = async (req, res) => {
  const { id } = req.params;
  const { name, description, ownerName, ownerEmail, resourceGroup, status } = req.body;

  try {
    const updated = await prisma.systemObject.update({
      where: { id },
      data: { name, description, ownerName, ownerEmail, resourceGroup, status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte uppdatera systemet' });
  }
};