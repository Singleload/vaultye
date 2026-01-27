import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Skapa ett nytt möte
export const createMeeting = async (req, res) => {
  const { title, date, systemId } = req.body;
  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: new Date(date), // Konvertera sträng till Datum
        systemId,
        agenda: "1. Mötets öppnande\n2. Föregående protokoll\n3. Inkomna punkter\n4. Övriga frågor"
      }
    });
    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte skapa möte' });
  }
};

// Hämta ett specifikt möte (inklusive punkter som skapades under mötet)
export const getMeetingById = async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        points: true, // Hämta punkter kopplade till detta möte
        system: true  // Hämta info om systemet också
      }
    });
    if (!meeting) return res.status(404).json({ error: 'Möte hittades ej' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta möte' });
  }
};

// Uppdatera anteckningar/agenda
export const updateMeeting = async (req, res) => {
  const { id } = req.params;
  const { summary, agenda, attendees } = req.body;
  try {
    const updated = await prisma.meeting.update({
      where: { id },
      data: { summary, agenda, attendees }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte uppdatera möte' });
  }
};

export const deleteMeeting = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.meeting.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Kunde inte radera mötet' });
  }
};