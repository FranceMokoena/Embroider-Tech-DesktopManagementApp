#!/bin/bash

echo "🚀 Setting up EmbroideryTech Desktop App with Mobile Integration"
echo "================================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed"

# Create .env file for desktop backend
echo "📝 Creating environment configuration..."
cd desktop-backend

if [ ! -f .env ]; then
    cat > .env << EOF
# Desktop Backend Environment Configuration

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Mobile API Configuration
MOBILE_API_URL=https://embroider-scann-app.onrender.com/api
MOBILE_API_KEY=your_mobile_api_key_here
MOBILE_ADMIN_TOKEN=your_mobile_admin_token_here

# JWT Configuration (if needed for desktop auth)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
EOF
    echo "✅ Created .env file in desktop-backend/"
else
    echo "⚠️  .env file already exists in desktop-backend/"
fi

# Install dependencies
echo "📦 Installing desktop backend dependencies..."
npm install

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit desktop-backend/.env and add your mobile API credentials"
echo "2. Start the desktop backend: cd desktop-backend && npm start"
echo "3. Start the frontend: npm start"
echo "4. Login to the admin dashboard"
echo ""
echo "The desktop app will now fetch data from your mobile app at:"
echo "https://embroider-scann-app.onrender.com"
echo ""
echo "📊 Dashboard will show:"
echo "   - Scan history with status (Reparable/Beyond Repair/Healthy)"
echo "   - Technician sessions and activities"
echo "   - Department-wise analytics"
echo "   - Real-time notifications"
echo "   - Export capabilities (CSV, Excel, PDF)"
