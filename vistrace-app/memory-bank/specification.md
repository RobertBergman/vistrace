# VisTrace Application Specification - Updated 2025

## Project Overview
VisTrace is a **full-stack real-time network traceroute visualization application** consisting of a React frontend and Node.js backend. The application performs **actual network traceroute commands** and provides real-time visualization of network paths with geographic location data. This is **NOT a simulation** - it executes real system traceroute commands and streams results via WebSocket.

## Architecture Overview
```
Frontend (React)     Backend (Node.js)     System Level
     ↓                       ↓                  ↓
WebSocket Client ←→ Express + Socket.IO ←→ spawn('traceroute')
     ↓                       ↓                  ↓
ReactFlow UI    ←→    Geolocation APIs    ←→ Network Interface
```

## Core Components

### Backend Service (vistrace-backend)
**Real network traceroute execution service**

#### Key Features:
- **Real traceroute execution** via child_process spawn
- **WebSocket streaming** with Socket.IO server
- **Cross-platform support** (Linux traceroute, macOS traceroute, Windows tracert)
- **Geolocation integration** with multiple IP location APIs
- **RESTful API** for trace management
- **Process management** with proper cleanup and termination
- **Real-time data streaming** to connected clients

#### Technologies:
- **Express.js** - HTTP server and API endpoints
- **Socket.IO** - WebSocket server for real-time communication
- **Child Process** - System traceroute command execution
- **Axios** - HTTP client for geolocation API calls
- **PostgreSQL** - Optional database for trace persistence
- **TypeScript** - Type safety and development experience

### Frontend Application (vistrace-app)
**Real-time visualization interface**

#### Key Features:
- **WebSocket client** with Socket.IO for live updates
- **ReactFlow network graphs** showing real network topology
- **Real-time hop discovery** as traceroute progresses
- **Interactive network visualization** with hover details
- **Trace history management** with multiple concurrent traces
- **Professional UI** with comprehensive controls
- **Responsive design** with sidebar and main visualization area

#### Technologies:
- **React 19** - Modern UI framework with hooks
- **ReactFlow 11** - Interactive network graph visualization
- **Socket.IO Client** - WebSocket client for real-time updates
- **TypeScript** - Type safety and component interfaces
- **Tailwind CSS** - Utility-first styling framework
- **Lucide React** - Icon system

## Core Requirements

### Functional Requirements

#### 1. Real Network Traceroute Execution
- **System command execution** using native traceroute/tracert
- **Cross-platform compatibility** with Windows, macOS, and Linux
- **Real packet timing** and network path discovery
- **Process management** with start/stop/cleanup capabilities
- **Multiple concurrent traces** with unique session management

#### 2. Real-Time Data Streaming
- **WebSocket communication** between frontend and backend
- **Live hop discovery** as traceroute progresses
- **Real-time latency updates** for each network hop
- **Progressive visualization** showing network path building
- **Error handling** for network timeouts and failures

#### 3. Geographic Location Integration
- **Real IP geolocation** using multiple API providers:
  - IPStack API integration
  - IPInfo API integration
  - Fallback geolocation services
- **Location caching** to avoid API rate limits
- **Geographic visualization** on network topology

#### 4. Interactive Network Visualization
- **ReactFlow-based graphs** showing source → hops → destination
- **Color-coded latency indicators**:
  - Green: < 50ms (good)
  - Yellow: 50-150ms (moderate) 
  - Red: > 150ms (high)
- **Hover tooltips** with detailed hop information
- **Animated packet flow** visualization
- **Auto-layout** with Dagre algorithm

#### 5. Trace Management
- **Multiple concurrent traces** to different destinations
- **Trace history** with easy switching between results
- **Session persistence** during browser session
- **Trace stopping** with proper process termination
- **Memory management** with automatic cleanup

#### 6. Advanced Configuration
- **Traceroute parameters**:
  - Maximum hops (1-64, default: 30)
  - Packet size (32-1500 bytes, default: 64)
  - Timeout (1-30 seconds, default: 5)
  - Queries per hop (1-10, default: 3)
- **Protocol selection** (ICMP, UDP, TCP where supported)
- **IPv6 support** on compatible systems

#### 7. Database Integration (Optional)
- **PostgreSQL connection** for historical trace storage
- **Automatic schema creation** for traces and hops
- **Data persistence** across application restarts
- **Fallback operation** when database unavailable

### Non-Functional Requirements

#### 1. Performance
- **Real-time responsiveness** with sub-second WebSocket updates
- **Efficient process management** to prevent system overload
- **Memory optimization** with trace history limits
- **Concurrent trace limits** to maintain system stability
- **Smooth animations** at 60fps for network visualization

#### 2. Reliability
- **Error handling** for network failures and timeouts
- **Process cleanup** on application termination
- **Connection recovery** for WebSocket disconnections
- **Graceful degradation** when services unavailable
- **Cross-platform compatibility** testing

#### 3. Security
- **Input validation** for all traceroute parameters
- **Process sandboxing** to prevent system compromise
- **API key protection** for geolocation services
- **CORS configuration** for secure frontend-backend communication
- **Rate limiting** to prevent API abuse

## User Interface Specification

### Layout Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│ VisTrace - Real-Time Network Traceroute        Status: Connected │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar                    │ Main Visualization Area            │
│ ┌─ Trace Controls ────────┐ │ ┌─ Network Topology Graph ──────┐ │
│ │ Destination: [input]    │ │ │                               │ │
│ │ Max Hops: [30]         │ │ │  Source → Hop1 → Hop2        │ │
│ │ Timeout: [5s]          │ │ │    ↓       ↓      ↓          │ │
│ │ [Start Trace] [Stop]   │ │ │  Geographic Locations         │ │
│ └─────────────────────────┘ │ │  Real Latency Data           │ │
│                            │ │                               │ │
│ ┌─ Active Traces ────────┐ │ └───────────────────────────────┘ │
│ │ • google.com (running) │ │                                  │
│ │ • 8.8.8.8 (completed) │ │ ┌─ Hop Details Panel ─────────┐ │
│ │ • github.com (failed) │ │ │ Hop 3: 172.16.1.1           │ │
│ │                        │ │ │ Latency: 15.2ms             │ │
│ └─────────────────────────┘ │ │ Location: San Francisco, CA │ │
│                            │ │ ISP: Comcast Cable           │ │
│ ┌─ System Status ────────┐ │ │ Packet Loss: 0%             │ │
│ │ Backend: Connected     │ │ └─────────────────────────────┘ │
│ │ Active Traces: 2       │ │                                  │
│ │ Uptime: 01:23:45      │ │                                  │
│ └─────────────────────────┘ │                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Color Scheme & Theming
- **Background**: `#0f172a` (Slate-900)
- **Secondary Background**: `#1e293b` (Slate-800)
- **Card Background**: `#334155` (Slate-700)
- **Primary Text**: `#f1f5f9` (Slate-100)
- **Secondary Text**: `#94a3b8` (Slate-400)
- **Success**: `#10b981` (Emerald-500)
- **Warning**: `#f59e0b` (Amber-500)
- **Error**: `#ef4444` (Red-500)
- **Accent**: `#3b82f6` (Blue-500)

### Typography
- **Primary Font**: System fonts (`ui-sans-serif, system-ui`)
- **Monospace**: `ui-monospace, Menlo, Monaco, "Cascadia Code"`
- **Font Sizes**: Tailwind CSS scale (text-sm, text-base, text-lg)

## API Specification

### WebSocket Events (Socket.IO)

#### Client → Server Events
```typescript
// Start new traceroute
socket.emit('message', {
  type: 'start_traceroute',
  destination: string,
  options: {
    maxHops?: number,
    queries?: number,
    timeout?: number,
    packetSize?: number,
    protocol?: 'icmp' | 'udp' | 'tcp'
  }
});

// Stop running traceroute
socket.emit('message', {
  type: 'stop_traceroute',
  traceId: string
});
```

#### Server → Client Events
```typescript
// Traceroute progress update
socket.on('traceroute_update', {
  traceId: string,
  trace: {
    id: string,
    destination: string,
    status: 'running' | 'completed' | 'failed' | 'stopped',
    hops: HopData[],
    startTime: Date,
    endTime?: Date
  }
});

// Error notifications
socket.on('error', {
  message: string,
  traceId?: string
});
```

### REST API Endpoints

#### Health Check
```
GET /health
Response: { status: 'ok', uptime: number }
```

#### Trace Management
```
GET /api/traces
Response: TraceRoute[]

GET /api/traces/:id
Response: TraceRoute | 404

POST /api/traces/:id/stop
Response: { success: boolean }
```

## Data Models

### TraceRoute Interface
```typescript
interface TraceRoute {
  id: string;                        // Unique trace identifier (UUID)
  destination: string;               // Target hostname or IP address
  startTime: Date;                   // Trace initiation timestamp
  endTime?: Date;                    // Trace completion timestamp
  status: 'running' | 'completed' | 'failed' | 'stopped' | 'timeout';
  hops: HopData[];                   // Array of discovered network hops
  options: TracerouteOptions;        // Configuration used for trace
  totalHops: number;                 // Final hop count
  averageLatency: number;            // Overall average response time
  packetLoss: number;                // Overall packet loss percentage
}
```

### HopData Interface
```typescript
interface HopData {
  hopNumber: number;                 // Hop sequence (1-based)
  ipAddress: string;                 // IP address or '*' for no response
  hostname?: string;                 // Reverse DNS hostname
  responses: ResponseData[];         // Individual probe responses
  averageLatency: number;            // Average response time for this hop
  minLatency: number;                // Minimum response time
  maxLatency: number;                // Maximum response time
  packetLoss: number;                // Packet loss rate (0-100%)
  location?: GeolocationData;        // Geographic information
  asn?: string;                      // Autonomous System Number
  isp?: string;                      // Internet Service Provider
}
```

### ResponseData Interface
```typescript
interface ResponseData {
  sequenceNumber: number;            // Probe sequence number
  responseTime: number;              // Response time in milliseconds
  timestamp: Date;                   // Probe timestamp
  status: 'success' | 'timeout' | 'error';
  error?: string;                    // Error message if applicable
}
```

### GeolocationData Interface
```typescript
interface GeolocationData {
  country?: string;                  // Country name
  countryCode?: string;              // ISO country code
  region?: string;                   // State/province/region
  city?: string;                     // City name
  latitude?: number;                 // Geographic latitude
  longitude?: number;                // Geographic longitude
  timezone?: string;                 // Timezone identifier
  isp?: string;                      // Internet Service Provider
  organization?: string;             // Organization name
  asn?: string;                      // Autonomous System Number
}
```

### TracerouteOptions Interface
```typescript
interface TracerouteOptions {
  maxHops: number;                   // Maximum hops (default: 30)
  queries: number;                   // Queries per hop (default: 3)
  timeout: number;                   // Timeout in seconds (default: 5)
  packetSize: number;                // Packet size in bytes (default: 64)
  protocol: 'icmp' | 'udp' | 'tcp';  // Protocol to use (default: icmp)
  ipv6: boolean;                     // Use IPv6 (default: false)
  sourceAddress?: string;            // Source address to use
  port?: number;                     // Destination port (UDP/TCP only)
}
```

## Technical Implementation Details

### Backend Architecture

#### File Structure
```
vistrace-backend/
├── src/
│   ├── server.ts                   // Express server and Socket.IO setup
│   ├── services/
│   │   ├── tracerouteService.ts    // Core traceroute execution logic
│   │   └── geolocationService.ts   // IP geolocation API integration
│   └── types/
│       └── traceroute.ts           // TypeScript interface definitions
├── dist/                           // Compiled JavaScript output
├── package.json                    // Dependencies and scripts
├── tsconfig.json                   // TypeScript configuration
└── .env                           // Environment variables
```

#### Core Services

**TracerouteService:**
- Manages traceroute process lifecycle
- Handles cross-platform command execution
- Parses real traceroute output
- Manages concurrent trace sessions
- Provides process cleanup and termination

**GeolocationService:**
- Integrates with multiple IP location APIs
- Implements caching to reduce API calls
- Handles API rate limiting and errors
- Provides fallback between different services

#### Process Management
- **Child Process Spawning** with proper error handling
- **Signal Management** for graceful termination
- **Resource Cleanup** to prevent memory leaks
- **Concurrent Execution** with session isolation

### Frontend Architecture

#### File Structure
```
vistrace-app/src/
├── App.tsx                         // Main application component
├── components/
│   ├── TracerouteVisualization.tsx // ReactFlow network graph
│   ├── GraphNode.tsx              // Custom node components
│   ├── StatusPanel.tsx            // System status display
│   ├── TerminalInput.tsx          // Control input interface
│   └── __tests__/                 // Component test suites
├── services/
│   └── tracerouteService.ts       // WebSocket client service
├── types/
│   └── traceroute.ts              // TypeScript interfaces
└── hooks/                         // Custom React hooks
```

#### State Management
- **React Hooks** for component state management
- **WebSocket Integration** for real-time updates
- **Local Storage** for session persistence
- **Context API** for global state sharing

#### Real-Time Updates
- **Socket.IO Client** for WebSocket communication
- **Automatic Reconnection** on connection loss
- **Event-driven Updates** for trace progress
- **Optimistic UI Updates** for better UX

## Deployment & Infrastructure

### Development Environment
```bash
# Start backend (Terminal 1)
cd vistrace-backend
npm run dev

# Start frontend (Terminal 2)  
cd vistrace-app
npm start
```

### Production Deployment
```bash
# Build all components
npm run build

# Start production services
npm start
```

### Docker Support
The application includes Docker configurations for containerized deployment:

- **Frontend Docker**: Nginx-served static React build
- **Backend Docker**: Node.js runtime with traceroute tools
- **Docker Compose**: Full-stack orchestration
- **PostgreSQL**: Optional database container

### Environment Configuration

#### Backend (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# Database (Optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/vistrace

# Geolocation APIs
IPSTACK_API_KEY=your_api_key
IPINFO_TOKEN=your_token
GEOLOCATION_TIMEOUT=5000
```

#### Frontend (.env)
```bash
# Backend Connection
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

## Testing Strategy

### Backend Testing
- **Unit Tests** for service functions
- **Integration Tests** for API endpoints
- **Process Tests** for traceroute execution
- **WebSocket Tests** for real-time communication

### Frontend Testing
- **Component Tests** with React Testing Library
- **User Interaction Tests** for form submissions
- **WebSocket Tests** for real-time updates
- **Visual Regression Tests** for UI consistency

### End-to-End Testing
- **Full Workflow Tests** from trace start to completion
- **Cross-Platform Tests** for different operating systems
- **Performance Tests** for concurrent trace handling
- **Error Scenario Tests** for network failures

## Performance Characteristics

### Backend Performance
- **Concurrent Traces**: Up to 10 simultaneous traceroutes
- **Memory Usage**: ~50MB base + ~5MB per active trace
- **CPU Usage**: Low baseline, spikes during trace parsing
- **Network Impact**: Minimal - system traceroute handles traffic

### Frontend Performance
- **Initial Load**: ~2-3 seconds for React app
- **Real-time Updates**: <100ms WebSocket latency
- **Animation Performance**: 60fps ReactFlow rendering
- **Memory Usage**: ~100MB base + ~10MB per trace visualization

### System Requirements
- **Backend**: Node.js 16+, 512MB RAM, network access
- **Frontend**: Modern browser with WebSocket support
- **System**: Traceroute utility installed (Linux/macOS/Windows)
- **Network**: Outbound ICMP/UDP permissions (may require sudo)

## Security Considerations

### Backend Security
- **Input Validation** for all traceroute parameters
- **Process Sandboxing** to prevent command injection
- **API Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **Environment Variables** for sensitive API keys

### Network Security
- **Firewall Configuration** for outbound traceroute traffic
- **Permission Management** for ICMP packet generation
- **Process Isolation** to prevent system compromise
- **Logging** for security monitoring and audit trails

## Known Limitations & Browser Constraints

### Browser Limitations
- **No Direct Network Access**: Browsers cannot execute raw network commands
- **WebSocket Dependency**: Requires backend service for real functionality
- **Cross-Origin Restrictions**: Must configure CORS properly
- **Process Limitations**: Cannot directly spawn system processes

### System Requirements
- **Traceroute Installation**: Must have system traceroute utility
- **Network Permissions**: May require elevated privileges for ICMP
- **Platform Differences**: Command syntax varies between OS platforms
- **Geographic Data**: Dependent on third-party geolocation APIs

### Operational Considerations
- **Process Management**: Backend must handle process cleanup properly
- **Resource Limits**: Concurrent trace limits to prevent system overload
- **API Dependencies**: Geolocation features depend on external services
- **Network Environment**: Corporate firewalls may block traceroute traffic

## Troubleshooting Guide

### Common Issues

#### Backend Won't Start
```bash
# Check traceroute availability
which traceroute    # Linux/macOS
where tracert       # Windows

# Check port availability
netstat -tulpn | grep :3001

# Check permissions
sudo traceroute google.com
```

#### WebSocket Connection Failed
- Verify backend is running on correct port
- Check firewall settings for WebSocket traffic
- Ensure CORS configuration matches frontend URL
- Monitor browser console for connection errors

#### Traceroute Permission Denied
```bash
# Linux: Install traceroute and configure permissions
sudo apt install traceroute
sudo setcap cap_net_raw+ep /usr/bin/traceroute

# macOS: Run with sudo or use UDP mode
sudo npm run dev

# Windows: Run as Administrator
```

#### No Geographic Data
- Verify API keys in backend .env file
- Check network connectivity to geolocation APIs
- Monitor API usage limits and quotas
- Review backend logs for API errors

### Debug Mode
```bash
# Backend debugging
DEBUG=vistrace:* npm run dev

# Frontend debugging
# Open browser DevTools → Network → WS
```

## Current Status (Updated May 2025)

### ✅ Fully Implemented Features
1. **Real Traceroute Execution** - Cross-platform system command execution
2. **WebSocket Communication** - Real-time bidirectional data flow
3. **Interactive Visualization** - ReactFlow network graphs with hover details
4. **Geographic Integration** - Multi-API IP location services
5. **Concurrent Trace Management** - Multiple simultaneous traceroutes
6. **Professional UI** - Modern React interface with real-time updates
7. **Docker Support** - Full containerization with docker-compose
8. **Cross-Platform Support** - Windows, macOS, Linux compatibility

### 🔄 Active Development Areas
1. **Database Integration** - PostgreSQL persistence layer (optional)
2. **Performance Optimization** - Memory management and process efficiency
3. **Error Handling** - Enhanced network failure recovery
4. **Testing Coverage** - Comprehensive test suite expansion

### 🎯 Future Enhancements
1. **User Authentication** - Multi-user trace sharing
2. **Historical Analytics** - Long-term network performance tracking
3. **Custom Protocols** - Advanced traceroute protocol support
4. **Mobile Responsive** - Enhanced mobile device support
5. **Real-time Alerts** - Network performance monitoring

### Production Readiness
- ✅ **Core Functionality**: Fully operational
- ✅ **Real-time Performance**: Sub-second updates
- ✅ **Cross-platform**: Tested on major platforms
- ✅ **Docker Deployment**: Production-ready containers
- ⚠️ **Database Layer**: Optional, in development
- ⚠️ **Monitoring**: Basic logging implemented

This specification reflects the current state of VisTrace as a **production-ready real-time network traceroute visualization application** with full backend services and real network analysis capabilities.
