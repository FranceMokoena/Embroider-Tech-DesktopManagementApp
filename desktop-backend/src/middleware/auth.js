import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined');
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

let ADMIN_USERS = [
  {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    email: process.env.ADMIN_EMAIL || 'admin@embroiderytech.com',
    role: 'admin'
  }
];

let hashedPasswords = {};
ADMIN_USERS.forEach(user => {
  bcrypt.hash(user.password, 10).then(hash => {
    hashedPasswords[user.username] = hash;
    console.log(`Admin password hashed for ${user.username}`);
  }).catch(err => {
    console.error(`Failed to hash admin password for ${user.username}:`, err);
  });
});

function publicUser(user) {
  return {
    username: user.username || user.userId,
    email: user.email || null,
    role: user.role || (user.isAdmin ? 'admin' : 'user')
  };
}

function normalizeJwtPayload(payload) {
  const username = payload?.username || payload?.userId || payload?.sub;
  if (!username || typeof username !== 'string') {
    throw new Error('Invalid token payload');
  }

  return {
    ...payload,
    username,
    role: payload.role || (payload.isAdmin ? 'admin' : 'user')
  };
}

function signAccessToken(user) {
  return jwt.sign(
    {
      username: user.username || user.userId,
      email: user.email || null,
      role: user.role || (user.isAdmin ? 'admin' : 'user'),
      type: 'access'
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      username: user.username || user.userId,
      email: user.email || null,
      role: user.role || (user.isAdmin ? 'admin' : 'user'),
      type: 'refresh'
    },
    getJwtSecret(),
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = auth.split(' ')[1];
    req.user = normalizeJwtPayload(jwt.verify(token, getJwtSecret()));
    return next();
  } catch (err) {
    console.error('Auth token rejected:', {
      name: err.name,
      message: err.message,
      path: req.originalUrl
    });
    return res.status(401).json({ error: 'Invalid or expired token' });
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
    console.error('requireAdmin error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const adminUser = ADMIN_USERS.find(user => user.username === username);
    if (!adminUser || !hashedPasswords[username]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, hashedPasswords[username]);

    if (isValidPassword) {
      const accessToken = signAccessToken(adminUser);
      const refreshToken = signRefreshToken(adminUser);

      return res.json({
        message: 'Login successful',
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_TTL,
        user: publicUser(adminUser)
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const refreshToken = (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const payload = normalizeJwtPayload(jwt.verify(token, getJwtSecret()));
    if (payload.type && payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = {
      username: payload.username,
      email: payload.email,
      role: payload.role
    };
    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
      token: accessToken,
      refreshToken: token,
      expiresIn: ACCESS_TOKEN_TTL,
      user: publicUser(user)
    });
  } catch (err) {
    console.error('Refresh token rejected:', {
      name: err.name,
      message: err.message
    });
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
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
    console.error('Get profile error:', err);
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

    console.log(`New admin user registered: ${username}`);

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
    console.error('Register admin error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
