# VisTrace - Real-Time Network Traceroute Visualization

A professional React-based visual network traceroute application that performs real network analysis using a Node.js backend service. VisTrace provides real-time hop-by-hop network path visualization with geographic location data and comprehensive packet analysis.

## 🚀 Features

### Frontend (React App)
- **Real-time visualization** with interactive network topology
- **ReactFlow-based** network path visualization
- **WebSocket integration** for live traceroute updates
- **Professional UI** with trace history and statistics
- **Responsive design** with sidebar controls
- **TypeScript** for type safety

### Backend (Node.js API)
- **Real traceroute execution** using system commands
- **WebSocket streaming** for real-time updates
- **Geolocation integration** with multiple IP location APIs
- **Cross-platform support** (Linux, macOS, Windows)
- **RESTful API** for trace management
- **Process management** with proper cleanup

## 📋 Prerequisites

### System Requirements
- **Node.js 16+**
- **npm or yarn**
- **System traceroute tools:**
  - Linux: `sudo apt install traceroute`
  - macOS: Built-in `traceroute`
  - Windows: Built-in `tracert`

### Network Requirements
- **Linux/macOS**: May require sudo for ICMP traceroute
- **Firewall**: Allow outbound traceroute traffic

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd vistrace

# Install frontend dependencies
cd vistrace-app
npm install

# Install backend dependencies
cd ../vistrace-backend
npm install
```

### 2. Configure Backend

```bash
# Copy environment template
cd vistrace-backend
cp .env.example .env

# Edit configuration (optional)
# Add API keys for enhanced geolocation
nano .env
```

### 3. Build Backend

```bash
cd vistrace-backend
npm run build
```

## 🚀 Quick Start

### Option 1: Single Command (Recommended)

**Development Mode:**
```bash
# Install all dependencies first
npm run install:all

# Start both backend and frontend
npm run dev
```

**Production Mode:**
```bash
# Build and start both services
npm run build
npm start
```

### Option 2: Manual Start (Individual Services)

**Terminal 1 - Backend:**
```bash
cd vistrace-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd vistrace-app
npm start
```

## 🌐 Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🎮 Usage

1. **Open the application** in your browser
2. **Enter a destination** (e.g., google.com, 8.8.8.8)
3. **Configure options** (max hops, packet size, timeout)
4. **Start traceroute** and watch real-time visualization
5. **View results** in both network map and hop details
6. **Browse trace history** in the sidebar

### Example Destinations
- `google.com` - Popular website
- `8.8.8.8` - Google DNS
- `1.1.1.1` - Cloudflare DNS
- `github.com` - Code repository
- `university.edu` - Educational network

## 📊 Features Overview

### Network Visualization
- **Interactive network graph** showing source → hops → destination
- **Color-coded latency** indicators (green < 50ms, yellow < 150ms, red > 150ms)
- **Hover tooltips** with detailed hop information
- **Animated packet flow** visualization

### Traceroute Analysis
- **Real packet timing** from system traceroute
- **Geographic location** data for each hop
- **Packet loss detection** and statistics
- **Multiple probe support** (3 probes per hop by default)
- **TTL analysis** and routing information

### Real-Time Features
- **Live hop discovery** as traceroute progresses
- **WebSocket updates** every second
- **Concurrent trace support** for multiple destinations
- **Trace history** with easy switching between results

## ⚙️ Configuration

### Backend Configuration (.env)
```bash
# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# Geolocation APIs (Optional)
IPSTACK_API_KEY=your_api_key
IPINFO_TOKEN=your_token
```

### Frontend Configuration
```bash
# Create .env in vistrace-app/
REACT_APP_BACKEND_URL=http://localhost:3001
```

### Traceroute Options
- **Max Hops**: 1-64 (default: 30)
- **Packet Size**: 32-1500 bytes (default: 64)
- **Timeout**: 1-30 seconds (default: 5)
- **Queries per Hop**: 1-10 (default: 3)
- **Protocol**: ICMP, UDP, TCP (default: ICMP)

## 🔧 API Reference

### WebSocket Events

**Start Traceroute:**
```javascript
socket.emit('message', {
  type: 'start_traceroute',
  destination: 'google.com',
  options: { maxHops: 30, queries: 3 }
});
```

**Receive Updates:**
```javascript
socket.on('traceroute_update', (data) => {
  console.log('New hop:', data.trace);
});
```

### REST Endpoints

- `GET /health` - Server status
- `GET /api/traces` - All traces
- `GET /api/traces/:id` - Specific trace
- `POST /api/traces/:id/stop` - Stop trace

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check if traceroute is installed
which traceroute  # Linux/macOS
where tracert     # Windows

# Check port availability
netstat -tulpn | grep :3001
```

**Permission denied:**
```bash
# Linux/macOS: Run with sudo or use UDP mode
sudo npm run dev

# Or configure for UDP traceroute (no root required)
```

**WebSocket connection failed:**
- Verify backend is running on port 3001
- Check firewall settings
- Ensure CORS configuration matches frontend URL

**No location data:**
- Get free API keys from ipstack.com or ipinfo.io
- Check network connectivity for geolocation APIs
- Verify API key configuration in .env

### Debug Mode

**Backend debugging:**
```bash
DEBUG=vistrace:* npm run dev
```

**Frontend debugging:**
- Open browser developer tools
- Check WebSocket connection in Network tab
- Monitor console for error messages

## 🏗️ Architecture

### System Architecture
```
Frontend (React)     Backend (Node.js)     System Commands
    ↓                      ↓                     ↓
WebSocket ←→ Express Server ←→ spawn('traceroute')
    ↓                      ↓                     ↓
Real-time UI ←→ Geolocation APIs ←→ Network Interface
```

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- ReactFlow for network visualization
- Socket.IO client for WebSocket
- Tailwind CSS for styling
- Lucide React for icons

**Backend:**
- Node.js with Express
- Socket.IO for WebSocket
- Child process for traceroute
- Axios for geolocation APIs
- TypeScript for type safety

## 🧪 Testing

### Backend Tests
```bash
cd vistrace-backend
npm test
```

### Frontend Tests
```bash
cd vistrace-app
npm test
```

### Manual Testing
1. Start both services
2. Test with known destinations (google.com, 8.8.8.8)
3. Verify real-time updates
4. Check hop details and geolocation
5. Test stop/start functionality

## 📈 Performance

### Optimization Tips
- **Limit concurrent traces** to avoid system overload
- **Use API keys** for geolocation to avoid rate limits
- **Monitor memory usage** with trace history cleanup
- **Consider caching** geolocation results

### Scaling Considerations
- **Database integration** for trace persistence
- **Load balancing** for multiple backend instances
- **Rate limiting** for API protection
- **Process pooling** for high-volume usage

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review backend and frontend READMEs
3. Verify system traceroute functionality
4. Open an issue with detailed information

## 🎯 Roadmap

- [ ] Database persistence for trace history
- [ ] User authentication and trace sharing
- [ ] Enhanced network topology visualization
- [ ] Custom traceroute protocols
- [ ] Performance monitoring and alerting
- [ ] Mobile-responsive design improvements
