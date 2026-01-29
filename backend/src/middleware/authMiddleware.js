import jwt from 'jsonwebtoken';

const JWT_SECRET = 'xasda47521531454131xaeTareat1234Xasd1231asSDii4312s'; // I produktion ska detta ligga i .env

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Ingen åtkomst' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Ogiltig token' });
    req.user = user; // Nu har vi användarens ID och Role i req.user
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Kräver administratörsbehörighet' });
  }
  next();
};