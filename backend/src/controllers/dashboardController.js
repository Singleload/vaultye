import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
  try {
    // Gemensamt filter för att exkludera arkiverade system
    // Vi kollar att systemet INTE är arkiverat
    const activeSystemFilter = { system: { isArchived: false } };

    const [
      systemCount,
      pendingPoints,
      pendingUpgrades, // <--- NY: Hämta uppgraderingar som väntar
      activePoints,
      completedPoints,
      upcomingMeetings,
      recentActivity
    ] = await Promise.all([
      // 1. Antal system (Endast aktiva och icke-arkiverade)
      prisma.systemObject.count({ 
        where: { 
          status: 'ACTIVE', 
          isArchived: false 
        } 
      }),
      
      // 2a. Punkter som väntar på beslut
      prisma.point.count({ 
        where: { 
          status: { in: ['RECOMMENDED', 'PENDING_APPROVAL'] },
          ...activeSystemFilter
        } 
      }),

      // 2b. Uppgraderingar som väntar på beslut (NY)
      prisma.upgrade.count({
        where: {
          status: 'PENDING_APPROVAL',
          ...activeSystemFilter
        }
      }),
      
      // 3. Pågående åtgärder (Godkända punkter + Pågående)
      prisma.point.count({ 
        where: { 
          status: { in: ['APPROVED', 'IN_PROGRESS'] },
          ...activeSystemFilter
        } 
      }),

      // 4. Avslutade i år
      prisma.point.count({ 
        where: { 
          status: 'DONE',
          createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
          ...activeSystemFilter
        } 
      }),

      // 5. Kommande möten (Närmaste 5 för icke-arkiverade system)
      prisma.meeting.findMany({
        where: { 
          date: { gte: new Date() },
          ...activeSystemFilter
        },
        orderBy: { date: 'asc' },
        take: 5,
        include: { system: { select: { name: true } } }
      }),

      // 6. Senaste aktivitet
      prisma.point.findMany({
        where: { ...activeSystemFilter },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { system: { select: { name: true } } }
      })
    ]);

    // Summera punkter och uppgraderingar för "Väntar på beslut"
    const totalPendingDecisions = pendingPoints + pendingUpgrades;

    res.json({
      systemCount,
      pendingDecisions: totalPendingDecisions, // Skicka summan
      activePoints,
      completedPoints,
      upcomingMeetings,
      recentActivity
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kunde inte hämta dashboard-data' });
  }
};