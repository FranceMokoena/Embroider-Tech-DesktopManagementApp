# Desktop Admin Backend for EmbroideryTech

A separate backend service for the desktop admin application that connects to the existing mobile backend API.

## Features

- **Dashboard Overview**: Real-time statistics and activity monitoring
- **User Management**: Create, edit, delete, and manage technician accounts
- **Scan Management**: View, edit, delete, and archive barcode/QR scans
- **Session Management**: Monitor technician work sessions
- **Messaging System**: Send messages and notifications to technicians
- **Report Generation**: Export data in CSV, Excel, and PDF formats
- **Search & Filtering**: Advanced search capabilities across all data
- **Real-time Notifications**: Admin notifications and message tracking

## Architecture

This desktop backend acts as a proxy/aggregator that:
1. Authenticates admin users
2. Forwards requests to the mobile backend API
3. Aggregates and processes data for admin views
4. Provides additional admin-specific functionality

## Setup Instructions

### 1. Install Dependencies

```bash
cd desktop-backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Desktop Backend Configuration
PORT=5001
NODE_ENV=development

# Mobile Backend API Configuration
MOBILE_API_URL=http://localhost:5000/api
MOBILE_API_KEY=your_mobile_backend_api_key_here

# JWT Configuration
JWT_SECRET=your_desktop_jwt_secret_here
JWT_EXPIRES_IN=24h

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@embroiderytech.com

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5001`

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Admin login endpoint.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "username": "admin",
    "email": "admin@embroiderytech.com",
    "role": "admin"
  }
}
```

#### GET `/api/auth/profile`
Get admin profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Dashboard

#### GET `/api/admin/dashboard`
Get dashboard statistics and overview.

**Headers:**
```
Authorization: Bearer <jwt_token>
mobile-token: <mobile_backend_token>
```

**Response:**
```json
{
  "overview": {
    "totalScans": 1250,
    "totalUsers": 15,
    "totalSessions": 89,
    "todayScans": 45,
    "weeklyScans": 234
  },
  "statusBreakdown": {
    "Reparable": 450,
    "Beyond Repair": 200,
    "Healthy": 600
  },
  "departmentStats": {
    "Production": {
      "users": 8,
      "scans": 750
    },
    "Quality": {
      "users": 7,
      "scans": 500
    }
  },
  "recentActivity": {
    "lastScans": [...],
    "lastSessions": [...]
  }
}
```

### User Management

#### GET `/api/admin/users`
Get all users with pagination and filtering.

**Query Parameters:**
- `department`: Filter by department
- `q`: Search query
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

#### POST `/api/admin/users`
Create a new user.

**Request Body:**
```json
{
  "username": "tech1",
  "password": "password123",
  "department": "Production",
  "email": "tech1@company.com",
  "role": "technician"
}
```

#### PUT `/api/admin/users/:id`
Update user information.

#### DELETE `/api/admin/users/:id`
Deactivate a user.

### Scan Management

#### GET `/api/admin/scans`
Get all scans with filtering.

**Query Parameters:**
- `status`: Filter by status (Reparable, Beyond Repair, Healthy)
- `department`: Filter by department
- `dateFrom`: Start date filter
- `dateTo`: End date filter
- `page`: Page number
- `limit`: Items per page

#### GET `/api/admin/scans/:id`
Get specific scan details.

#### PUT `/api/admin/scans/:id`
Update scan information.

#### DELETE `/api/admin/scans/:id`
Delete a scan.

#### POST `/api/admin/scans/:id/archive`
Archive a scan.

### Session Management

#### GET `/api/admin/sessions`
Get all sessions with filtering.

#### GET `/api/admin/sessions/:id`
Get specific session details.

### Search and Filter

#### GET `/api/admin/search/scans`
Advanced scan search.

#### GET `/api/admin/search/users`
Advanced user search.

### Reports

#### GET `/api/reports/csv`
Generate CSV report.

**Query Parameters:**
- `type`: Report type (scans, users, sessions)
- `dateFrom`: Start date
- `dateTo`: End date
- `department`: Department filter
- `status`: Status filter

#### GET `/api/reports/excel`
Generate Excel report.

#### GET `/api/reports/pdf`
Generate PDF report.

### Messaging

#### POST `/api/messaging/send`
Send message to specific technicians.

**Request Body:**
```json
{
  "recipients": ["user_id_1", "user_id_2"],
  "subject": "Important Update",
  "message": "Please check the new procedures.",
  "priority": "high"
}
```

#### POST `/api/messaging/broadcast`
Send broadcast message to all technicians.

#### GET `/api/messaging/messages`
Get all messages.

#### GET `/api/messaging/notifications`
Get admin notifications.

#### GET `/api/messaging/unread-count`
Get unread message and notification counts.

## Authentication Flow

1. **Desktop Admin Login**: Admin logs into desktop backend
2. **Mobile Backend Token**: Desktop backend needs a valid token from mobile backend
3. **Request Forwarding**: Desktop backend forwards requests to mobile backend with the mobile token
4. **Response Processing**: Desktop backend processes and formats responses for admin consumption

## Security Features

- JWT-based authentication
- Role-based access control (admin only)
- Rate limiting
- CORS protection
- Input validation
- Error handling

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (in development)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Development

### Project Structure

```
desktop-backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── middleware/      # Authentication & authorization
│   ├── routes/          # API route definitions
│   ├── services/        # External API communication
│   └── server.js        # Main server file
├── package.json
├── env.example
└── README.md
```

### Adding New Features

1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Update mobile API service if needed
4. Test with appropriate authentication headers

## Deployment

### Production Considerations

1. Use environment variables for all sensitive data
2. Set up proper logging
3. Configure CORS for production domains
4. Use HTTPS in production
5. Set up monitoring and health checks
6. Consider using a database for persistent storage (messages, notifications)

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Mobile Backend Connection**: Ensure mobile backend is running and accessible
2. **CORS Errors**: Check `ALLOWED_ORIGINS` configuration
3. **Authentication**: Verify JWT tokens and mobile backend tokens
4. **Rate Limiting**: Check rate limit configuration if getting 429 errors

### Logs

The server provides detailed logging for debugging:
- Request/response logging
- Error tracking
- Mobile API communication logs

## Support

For issues and questions:
1. Check the logs for error details
2. Verify environment configuration
3. Ensure mobile backend is accessible
4. Test with Postman or similar tool
