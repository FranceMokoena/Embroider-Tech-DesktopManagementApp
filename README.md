# Embroidery Tech Desktop Management App

A desktop application built with React and Electron that serves as an admin dashboard for the Embroidery Tech mobile application. This desktop app fetches and displays data from the mobile backend, providing administrators with comprehensive oversight of technicians, scans, sessions, and system statistics.

## 🎯 Main Purpose

The primary function of this desktop application is to:
- **Fetch data from the mobile application** and display it in a comprehensive admin dashboard
- **Monitor technician activities** and scan history in real-time
- **Generate reports** from mobile data (CSV, Excel, PDF)
- **Manage users and sessions** across the mobile platform
- **Provide analytics and statistics** from mobile scan data

## 🏗️ Architecture

```
Mobile App → Mobile Backend → Desktop Backend → Desktop Frontend
```

1. **Mobile Application**: Collects scan data, user sessions, and technician activities
2. **Mobile Backend**: Stores and manages all mobile app data
3. **Desktop Backend**: Acts as a bridge, fetching data from mobile backend and serving it to desktop frontend
4. **Desktop Frontend**: Displays the data in an admin dashboard interface

## 🚀 Features

### Dashboard Overview
- **Real-time statistics** from mobile scan data
- **Scan status breakdown** (Reparable, Beyond Repair, Healthy)
- **Department-wise analytics**
- **Today's and weekly activity summaries**

### Technician Management
- **View all technicians** from mobile app
- **Filter by department**
- **Monitor technician performance**

### Scan History
- **Complete scan history** from mobile app
- **Filter by technician, department, status, and date range**
- **Group scans by technician**
- **Real-time scan status updates**

### Active Sessions
- **Monitor ongoing technician sessions**
- **Session duration and scan counts**
- **Department-wise session tracking**

### Report Generation
- **CSV Reports**: Export scan data, user data, and session data
- **Excel Reports**: Formatted reports with styling
- **PDF Reports**: Professional document generation

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Mobile backend running and accessible
- Mobile API credentials

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd embroidery-desktop
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `desktop-backend` directory:

```bash
cd desktop-backend
cp env.example .env
```

Edit the `.env` file with your mobile backend configuration:

```env
# Mobile API Configuration
MOBILE_API_URL=http://localhost:5000/api
MOBILE_API_KEY=your_mobile_api_key_here
MOBILE_ADMIN_TOKEN=your_mobile_admin_token_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 3. Start the Desktop Backend
```bash
cd desktop-backend
npm install
npm start
```

The desktop backend will start on `http://localhost:5001`

### 4. Start the Desktop Frontend
```bash
# In the root directory
npm start
```

The React app will start on `http://localhost:3000`

### 5. Run as Desktop App (Optional)
```bash
npm run dev
```

This will start both the React app and Electron desktop application.

## 📊 Data Flow

### Authentication Flow
1. Admin logs into desktop app
2. Desktop backend validates admin credentials
3. Desktop backend retrieves mobile API token
4. Frontend uses mobile token to fetch data

### Data Fetching Flow
1. Desktop frontend requests data from desktop backend
2. Desktop backend uses mobile token to fetch data from mobile API
3. Desktop backend processes and formats the data
4. Frontend receives and displays the data

### Real-time Updates
- Dashboard refreshes data every 30 seconds
- Scan history updates automatically
- Session status changes are reflected immediately

## 🔧 API Endpoints

### Desktop Backend Endpoints

#### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile
- `GET /api/auth/mobile-token` - Get mobile API token

#### Dashboard Data
- `GET /api/dashboard/overview` - Dashboard statistics
- `GET /api/dashboard/scan-history` - Scan history with filters
- `GET /api/dashboard/users` - All technicians
- `GET /api/dashboard/profile` - User profile
- `GET /api/dashboard/sessions` - Active sessions

#### Reports
- `GET /api/reports/csv` - Generate CSV reports
- `GET /api/reports/excel` - Generate Excel reports
- `GET /api/reports/pdf` - Generate PDF reports

## 📱 Mobile Integration

The desktop app integrates with the mobile application through:

1. **Mobile API Service** (`mobileApiService.js`): Handles all communication with mobile backend
2. **Data Synchronization**: Real-time data fetching and caching
3. **Error Handling**: Graceful handling of mobile backend connectivity issues
4. **Authentication**: Secure token-based authentication with mobile backend

## 🎨 UI Components

### Dashboard Sections
- **Overview**: Statistics cards and summary data
- **Technician Management**: User list and management
- **Scan History**: Filterable scan data with technician grouping
- **Active Sessions**: Real-time session monitoring
- **Notifications**: System alerts and updates

### Responsive Design
- **Desktop**: Full-featured dashboard with sidebar navigation
- **Tablet**: Adaptive layout with collapsible sidebar
- **Mobile**: Mobile-optimized interface

## 🔒 Security

- **JWT Authentication**: Secure admin authentication
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Rate Limiting**: API rate limiting to prevent abuse
- **Environment Variables**: Secure configuration management

## 🐛 Troubleshooting

### Common Issues

1. **Mobile Backend Connection Failed**
   - Check if mobile backend is running
   - Verify `MOBILE_API_URL` in environment variables
   - Ensure mobile API key is correct

2. **Authentication Errors**
   - Verify admin credentials
   - Check JWT token configuration
   - Ensure mobile admin token is set

3. **Data Not Loading**
   - Check browser console for errors
   - Verify mobile token is being retrieved
   - Check network connectivity

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in the environment variables.

## 📈 Future Enhancements

- **Real-time WebSocket updates** for live data streaming
- **Advanced analytics dashboard** with charts and graphs
- **Bulk operations** for user and scan management
- **Export scheduling** for automated report generation
- **Mobile app integration** for push notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This desktop application is designed to work in conjunction with the Embroidery Tech mobile application. Ensure the mobile backend is properly configured and running before using this desktop admin dashboard.
