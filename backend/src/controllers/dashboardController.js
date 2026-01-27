import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
  try {
    // Vi kör flera frågor parallellt för prestanda
    const [systemCount, pendingDecisions, activePoints, completedPoints, upcomingMeetings, recentActivity] = await Promise.all([
      // 1. Antal system
      prisma.systemObject.count({ where: { status: 'ACTIVE' } }),
      
      // 2. Väntar på beslut (Punkter med status 'RECOMMENDED' eller 'PENDING_APPROVAL')
      prisma.point.count({ 
        where: { status: { in: ['RECOMMENDED', 'PENDING_APPROVAL'] } } 
      }),
      
      // 3. Pågående åtgärder (Godkända punkter)
      prisma.point.count({ 
        where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } 
      }),

      // 4. Avslutade i år
      prisma.point.count({ 
        where: { 
          status: 'DONE',
          createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) }
        } 
      }),

      // 5. Kommande möten (Närmaste 5)
      prisma.meeting.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 5,
        include: { system: { select: { name: true } } }
      }),

      // 6. Senaste aktivitet (Nyligen skapade punkter)
      prisma.point.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { system: { select: { name: true } } }
      })
    ]);

    res.json({
      systemCount,
      pendingDecisions,
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