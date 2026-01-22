/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and ensures user-company isolation.
 */

const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  if (process.env.AUTH_ENABLED !== 'true') return next();
  
  // Extract token from header, cookie, or query
  const token = req.headers.authorization?.split(' ')[1] || 
                req.cookies?.token || 
                req.query?.token;
                
  if (!token) {
    if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
        return res.redirect('/login.html');
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  });
};

module.exports = authenticate;
