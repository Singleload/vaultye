import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hämta alla system
export const getSystems = async (req, res) => {
  const { showArchived } = req.query;
  const userId = req.user.id; // Från token

  try {
    const whereClause = {
      userId, // <--- ISOLERING
      ...(showArchived === 'true' ? {} : { isArchived: false })
    };

    const systems = await prisma.systemObject.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { points: { where: { status: { not: 'CLOSED' } } } } }
      }
    });
    res.json(systems);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta system' });
  }
};

// Hämta ett specifikt system med dess punkter
export const getSystemById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const system = await prisma.systemObject.findUnique({
      where: { id },
      include: {
        points: { 
          orderBy: { createdAt: 'desc' },
          include: { action: true }
        },
        meetings: { orderBy: { date: 'desc' } },
        upgrades: { orderBy: { plannedDate: 'desc' } }
      }
    });

    if (!system) return res.status(404).json({ error: 'Möte hittades ej' });

    // KONTROLL: Får jag se detta?
    if (system.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Ingen åtkomst till detta system' });
    }

    res.json(system);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta system' });
  }
};

// Skapa ett nytt system
export const createSystem = async (req, res) => {
  const {
    name, description,
    ownerName, ownerEmail, ownerUsername,
    managerName, managerUsername,
    resourceGroup
  } = req.body;

  const userId = req.user.id; // Från token

  try {
    const newSystem = await prisma.systemObject.create({
      data: {
        name,
        description,
        ownerName,
        ownerEmail,
        ownerUsername,
        managerName,
        managerUsername,
        resourceGroup,
        userId
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
  const userId = req.user.id;
  const userRole = req.user.role;

  // Hämta all data från body
  const {
    name, description,
    ownerName, ownerEmail, ownerUsername,
    managerName, managerUsername,
    resourceGroup, status
  } = req.body;

  try {
    // 1. Hämta systemet
    const system = await prisma.systemObject.findUnique({ where: { id } });

    if (!system) return res.status(404).json({ error: 'Systemet hittades inte' });

    // 2. KONTROLL
    if (system.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Ingen åtkomst' });
    }

    // 3. Uppdatera
    const updated = await prisma.systemObject.update({
      where: { id },
      data: {
        name, description,
        ownerName, ownerEmail, ownerUsername,
        managerName, managerUsername,
        resourceGroup, status
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte uppdatera systemet' });
  }
};

// Arkivera (Dölj) eller Avarkivera system
export const toggleArchiveSystem = async (req, res) => {
  const { id } = req.params;
  const { isArchived } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Hämta systemet
    const system = await prisma.systemObject.findUnique({ where: { id } });

    if (!system) return res.status(404).json({ error: 'Systemet hittades inte' });

    // 2. KONTROLL
    if (system.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Ingen åtkomst' });
    }

    // 3. Uppdatera
    const updated = await prisma.systemObject.update({
      where: { id },
      data: { isArchived }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte ändra arkiv-status' });
  }
};

// Radera system permanent (Cascade sköts av databasen nu)
export const deleteSystem = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Från din token (via middleware)
  const userRole = req.user.role;

  try {
    // 1. Hämta systemet först för att se vem som äger det
    const system = await prisma.systemObject.findUnique({
      where: { id }
    });

    if (!system) {
      return res.status(404).json({ error: 'Systemet hittades inte' });
    }

    // 2. KONTROLL: Är det du som äger det? Eller är du Admin?
    if (system.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Du har inte behörighet att radera detta system' });
    }

    // 3. Om godkänd, radera
    await prisma.systemObject.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte radera systemet' });
  }
};