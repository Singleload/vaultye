import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Hämta inloggad användares ID från token (sattes i authMiddleware)
    const userId = req.user.id;

    // 2. Skapa ett återanvändbart filter för relationer (Points, Meetings, Upgrades)
    // Detta säger: "Hämta bara om systemet INTE är arkiverat OCH tillhör denna userId"
    const activeSystemFilter = { 
      system: { 
        isArchived: false, 
        userId: userId // <--- HÄR ÄR ISOLERINGEN FÖR RELATIONER
      } 
    };

    const [
      systemCount,
      pendingPoints,
      pendingUpgrades,
      activePoints,
      completedPoints,
      upcomingMeetings,
      recentActivity
    ] = await Promise.all([
      // 1. Antal system (Här lägger du koden du frågade om)
      prisma.systemObject.count({ 
        where: { 
          status: 'ACTIVE', 
          isArchived: false, 
          userId: userId // <--- HÄR ÄR ISOLERINGEN FÖR SYSTEM
        } 
      }),
      
      // 2a. Punkter som väntar på beslut
      prisma.point.count({ 
        where: { 
          status: { in: ['RECOMMENDED', 'PENDING_APPROVAL'] },
          ...activeSystemFilter // Använder filtret vi skapade ovan
        } 
      }),

      // 2b. Uppgraderingar som väntar på beslut
      prisma.upgrade.count({
        where: {
          status: 'PENDING_APPROVAL',
          ...activeSystemFilter
        }
      }),
      
      // 3. Pågående åtgärder
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

      // 5. Kommande möten
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

    // Summera
    const totalPendingDecisions = pendingPoints + pendingUpgrades;

    // Skicka svaret
    res.json({
      systemCount,
      pendingDecisions: totalPendingDecisions,
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