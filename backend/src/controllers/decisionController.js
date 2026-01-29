import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

// 1. Skapa förfrågan (Generisk för både Point och Upgrade)
export const createDecisionRequest = async (req, res) => {
  const { id, type } = req.body; // type = 'POINT' eller 'UPGRADE'

  try {
    const token = uuidv4();
    const contextType = type === 'UPGRADE' ? 'UPGRADE_DECISION' : 'POINT_DECISION';
    
    // Hämta info för att veta vilken status vi ska sätta
    if (type === 'UPGRADE') {
      await prisma.upgrade.update({ where: { id }, data: { status: 'PENDING_APPROVAL' } });
    } else {
      await prisma.point.update({ where: { id }, data: { status: 'PENDING_APPROVAL' } });
    }
    
    await prisma.magicLink.create({
      data: {
        token,
        email: "owner@example.com", 
        contextType,
        contextId: id,
        expiresAt: addDays(new Date(), 7),
      }
    });

    const magicLinkUrl = `http://localhost/decision/${token}`;
    console.log(`📧 MOCK EMAIL: Decision Link (${type}): ${magicLinkUrl}`);
    
    res.json({ message: 'Förfrågan skapad', link: magicLinkUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte skapa beslutsunderlag' });
  }
};

// 2. Hämta underlag
export const getDecisionData = async (req, res) => {
  const { token } = req.params;

  try {
    const magicLink = await prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink || magicLink.used) return res.status(400).json({ error: 'Länk ogiltig' });

    let data;
    if (magicLink.contextType === 'UPGRADE_DECISION') {
      data = await prisma.upgrade.findUnique({ 
        where: { id: magicLink.contextId },
        include: { system: true }
      });
      data.dataType = 'UPGRADE'; // Flagga för frontend
    } else {
      data = await prisma.point.findUnique({ 
        where: { id: magicLink.contextId },
        include: { system: true }
      });
      data.dataType = 'POINT';
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta data' });
  }
};

// 3. Ta beslut
export const submitDecision = async (req, res) => {
  const { token } = req.params;
  const { decision, comment } = req.body;

  try {
    const magicLink = await prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink || magicLink.used) return res.status(400).json({ error: 'Ogiltig' });

    const status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'; // Eller PLANNED -> REJECTED

    if (magicLink.contextType === 'UPGRADE_DECISION') {
      await prisma.upgrade.update({
        where: { id: magicLink.contextId },
        data: { status: decision, decisionDate: new Date() } // Uppgraderingar har enklare statusflöde än
      });
    } else {
      await prisma.point.update({
        where: { id: magicLink.contextId },
        data: { status, decisionDate: new Date(), managerComment: comment }
      });
    }

    await prisma.magicLink.update({ where: { id: magicLink.id }, data: { used: true } });
    res.json({ message: 'Beslut registrerat' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte spara beslut' });
  }
};