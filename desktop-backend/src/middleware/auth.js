import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Get JWT_SECRET from environment, but don't exit immediately if not found
// This allows the server to start and the error will be caught when auth is actually used
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('requireAuth init: JWT_SECRET is not defined');
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

// In-memory admin users (in production, use a database)
let ADMIN_USERS = [
  {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    email: process.env.ADMIN_EMAIL || 'admin@embroiderytech.com',
    role: 'admin'
  }
];

// Hash passwords for all admin users
let hashedPasswords = {};
ADMIN_USERS.forEach(user => {
  bcrypt.hash(user.password, 10).then(hash => {
    hashedPasswords[user.username] = hash;
    console.log(`ƒo. Admin password hashed for ${user.username}`);
  }).catch(err => {
    console.error(`ƒ?O Failed to hash admin password for ${user.username}:`, err);
  });
});

export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      console.warn('requireAuth missing/invalid Authorization header', { authorization: auth });
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = auth.split(' ')[1];
    console.log('requireAuth verifying token snippet', { tokenSnippet: token?.slice(0, 10) });
    const payload = jwt.verify(token, getJwtSecret());
    
    if (!payload || typeof payload.username !== 'string') {
      throw new Error('Invalid token payload');
    }

    req.user = payload;
    return next();
  } catch (err) {
    console.error('requireAuth middleware failed', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    return next();
  } catch (err) {
    console.error('ƒ?O requireAdmin error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt', { username });

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const adminUser = ADMIN_USERS.find(user => user.username === username);
    if (!adminUser || !hashedPasswords[username]) {
      console.warn('Login failed: invalid credentials', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, hashedPasswords[username]);
    
    if (isValidPassword) {
      const token = jwt.sign(
        { 
          username: adminUser.username, 
          email: adminUser.email, 
          role: adminUser.role 
        },
        getJwtSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      console.log('Login successful, issuing token', { username: adminUser.username });

      return res.json({
        message: 'Login successful',
        token,
        user: {
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role
        }
      });
    }

    console.warn('Login failed: bad password', { username });
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('ƒ?O Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getProfile = (req, res) => {
  try {
    return res.json({
      user: {
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('ƒ?O Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, email, name, surname, department } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    const existingUser = ADMIN_USERS.find(user => user.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingEmail = ADMIN_USERS.find(user => user.email === email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const newAdminUser = {
      username,
      password,
      email,
      name: name || '',
      surname: surname || '',
      department: department || 'Admin',
      role: 'admin'
    };

    const hashedPassword = await bcrypt.hash(password, 10);
    hashedPasswords[username] = hashedPassword;

    ADMIN_USERS.push(newAdminUser);

    console.log(`ƒo. New admin user registered: ${username}`);

    return res.status(201).json({
      message: 'Admin user registered successfully',
      user: {
        username: newAdminUser.username,
        email: newAdminUser.email,
        name: newAdminUser.name,
        surname: newAdminUser.surname,
        department: newAdminUser.department,
        role: newAdminUser.role
      }
    });

  } catch (err) {
    console.error('ƒ?O Register admin error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
