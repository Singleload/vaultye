import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Skapa en åtgärd (När man konverterar en godkänd punkt)
export const createAction = async (req, res) => {
  const { pointId, title, assignedTo, startDate, dueDate } = req.body;

  try {
    const action = await prisma.action.create({
      data: {
        pointId,
        title,
        assignedTo,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING' // Startar som "Väntande"
      }
    });

    // Uppdatera även punkten för att visa att den har en åtgärd
    // (Valfritt, men bra för tydlighet)
    await prisma.point.update({
      where: { id: pointId },
      data: { status: 'IN_PROGRESS' } 
    });

    res.status(201).json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte skapa åtgärd' });
  }
};

// Uppdatera status/noteringar på en åtgärd (t.ex. under mötet)
export const updateAction = async (req, res) => {
  const { id } = req.params;
  const { status, notes, assignedTo, dueDate } = req.body;

  try {
    const updated = await prisma.action.update({
      where: { id },
      data: {
        status,
        notes,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte uppdatera åtgärd' });
  }
};

// Hämta alla öppna åtgärder för ett system (För mötesrummet)
export const getSystemActions = async (req, res) => {
  const { systemId } = req.params;
  try {
    // Hitta actions där punkten tillhör systemet och status inte är 'DONE'
    const actions = await prisma.action.findMany({
      where: {
        point: { systemId },
        status: { not: 'DONE' }
      },
      include: {
        point: true // Inkludera ursprungspunkten
      },
      orderBy: { dueDate: 'asc' } // Sortera på deadline
    });
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta åtgärder' });
  }
};