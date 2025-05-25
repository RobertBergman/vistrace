# VisTrace Technical Stack Documentation - Updated 2025

## Technology Stack Overview

VisTrace is a **full-stack real-time network traceroute visualization application** built with modern web technologies. The application consists of a React frontend for visualization and a Node.js backend for actual network traceroute execution, connected via WebSocket for real-time data streaming.

## Overall Architecture

### System Architecture
```
Frontend (React)          Backend (Node.js)           System Level
      ↓                         ↓                         ↓
Socket.IO Client    ←→    Express + Socket.IO    ←→    child_process.spawn()
      ↓                         ↓                         ↓
ReactFlow UI       ←→     Geolocation APIs       ←→    traceroute/tracert
      ↓                         ↓                         ↓
State Management   ←→     Process Management     ←→    Network Interface
```

### Technology Distribution
- **Frontend**: React 19 + TypeScript + ReactFlow + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO + Child Process + Geolocation APIs
- **Database**: PostgreSQL (optional for persistence)
- **Deployment**: Docker + Docker Compose + Nginx

## Backend Technology Stack (vistrace-backend)

### Core Runtime & Framework

#### Node.js 16+
- **Purpose**: JavaScript runtime for server-side execution
- **Version**: Requires Node.js 16+ for modern ES features
- **Key Features**:
  - Child process spawning for system command execution
  - Event-driven architecture for real-time processing
  - Cross-platform support (Windows, macOS, Linux)
- **Performance**: Handles concurrent traceroute processes efficiently

#### Express.js 4.18+
- **Purpose**: Web application framework for HTTP server and API
- **Version**: 4.18.2
- **Key Features**:
  - RESTful API endpoints for trace management
  - Middleware support for CORS and security
  - Static file serving capability
  - Integration with Socket.IO for WebSocket support
- **Configuration**: Minimal setup with CORS and JSON parsing

#### TypeScript 5.3+
- **Purpose**: Static type checking for enhanced development experience
- **Version**: 5.3.3
- **Configuration**:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "strict": true,
      "esModuleInterop": true,
      "outDir": "./dist",
      "rootDir": "./src"
    }
  }
  ```
- **Benefits**: Type safety for traceroute data structures and API interfaces

### Real-Time Communication

#### Socket.IO 4.7+
- **Purpose**: WebSocket server for real-time bidirectional communication
- **Version**: 4.7.5
- **Key Features**:
  - Real-time traceroute progress streaming
  - Event-driven communication with frontend
  - Automatic reconnection handling
  - Room-based trace session management
- **Integration**: Seamless integration with Express server

### System Integration

#### Child Process Module
- **Purpose**: Execute system-level traceroute commands
- **Implementation**: Native Node.js child_process.spawn()
- **Cross-Platform Support**:
  - **Linux**: `traceroute` command
  - **macOS**: `traceroute` command  
  - **Windows**: `tracert` command
- **Features**:
  - Real-time stdout/stderr parsing
  - Process termination and cleanup
  - Signal handling for graceful shutdown

#### Process Management
- **Concurrent Execution**: Multiple traceroute processes simultaneously
- **Resource Management**: Memory and CPU usage optimization
- **Error Handling**: Proper cleanup on process failures
- **Security**: Input validation to prevent command injection

### External API Integration

#### Geolocation Services
**Multiple API Provider Support**:

**IPStack API**:
- **Purpose**: Primary IP geolocation service
- **Integration**: HTTP requests via Axios
- **Data**: Country, region, city, ISP, coordinates
- **Configuration**: API key via environment variables

**IPInfo API**:
- **Purpose**: Secondary/fallback geolocation service
- **Integration**: HTTP requests with token authentication
- **Data**: Geographic and network information
- **Features**: ASN data and organization details

#### Axios HTTP Client
- **Version**: 1.6.2
- **Purpose**: HTTP client for external API calls
- **Features**:
  - Promise-based requests
  - Request/response interceptors
  - Timeout handling
  - Error handling and retries

### Database Integration (Optional)

#### PostgreSQL 8.11+
- **Purpose**: Persistent storage for trace history
- **Version**: 8.11.3 (pg client library)
- **Schema**:
  - Traces table for traceroute metadata
  - Hops table for individual hop data
  - Locations table for geolocation caching
- **Features**:
  - Automatic schema creation
  - Connection pooling
  - Transaction support
  - Graceful fallback when unavailable

### Development Tools

#### ts-node-dev
- **Purpose**: Development server with TypeScript support
- **Features**:
  - Hot reloading on file changes
  - TypeScript compilation on-the-fly
  - Automatic process restart
  - Source map support for debugging

#### ESLint + TypeScript
- **Configuration**: TypeScript-aware linting rules
- **Integration**: IDE and build process integration
- **Rules**: Strict type checking and code quality standards

#### Jest Testing Framework
- **Version**: 29.7.0
- **Purpose**: Unit and integration testing
- **Features**:
  - TypeScript support
  - Async testing for processes
  - Mock support for external APIs
  - Coverage reporting

### Backend Dependencies
```json
{
  "express": "^4.18.2",          // Web framework
  "socket.io": "^4.7.5",         // WebSocket server
  "cors": "^2.8.5",              // Cross-origin resource sharing
  "axios": "^1.6.2",             // HTTP client
  "dotenv": "^16.3.1",           // Environment configuration
  "uuid": "^9.0.1",              // Unique identifier generation
  "pg": "^8.11.3",               // PostgreSQL client
  "typescript": "^5.3.3",        // Type system
  "ts-node-dev": "^2.0.0"        // Development server
}
```

## Frontend Technology Stack (vistrace-app)

### Core Framework & Language

#### React 19
- **Purpose**: User interface framework
- **Version**: 19.1.0
- **Key Features**:
  - Modern hooks (useState, useEffect, useRef, useCallback)
  - Functional components only (no class components)
  - Concurrent features for better performance
  - Automatic batching for state updates
- **Architecture**: Component-based with clear separation of concerns

#### TypeScript 4.9+
- **Purpose**: Static type checking for React components
- **Version**: 4.9.5
- **Configuration**: Strict mode enabled with React-specific types
- **Benefits**:
  - Component prop type safety
  - Event handler type checking
  - Service integration type safety
  - IDE autocomplete and error detection

### Visualization & Graphics

#### ReactFlow 11
- **Purpose**: Interactive network graph visualization
- **Version**: 11.11.4
- **Key Features**:
  - Custom node components for network hops
  - Edge connections showing network paths
  - Interactive pan, zoom, and selection
  - Real-time updates for live traceroute data
  - Built-in layout algorithms
- **Performance**: 60fps rendering with efficient re-rendering

#### Dagre Layout Algorithm
- **Version**: 0.8.5
- **Purpose**: Automatic graph layout for network topology
- **Integration**: Works with ReactFlow for optimal node positioning
- **Features**:
  - Hierarchical layout (source → hops → destination)
  - Automatic edge routing
  - Configurable spacing and orientation

### Real-Time Communication

#### Socket.IO Client 4.8+
- **Purpose**: WebSocket client for real-time backend communication
- **Version**: 4.8.1
- **Key Features**:
  - Real-time traceroute progress updates
  - Automatic reconnection on connection loss
  - Event-driven architecture
  - Binary data support for efficient transmission
- **Integration**: Seamless with React hooks for state management

### Styling & UI Framework

#### Tailwind CSS 3.4+
- **Purpose**: Utility-first CSS framework
- **Version**: 3.4.17
- **Configuration**:
  ```javascript
  // tailwind.config.js
  module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        colors: {
          // Custom color palette for network visualization
          'network-green': '#10b981',
          'network-yellow': '#f59e0b', 
          'network-red': '#ef4444'
        }
      }
    }
  }
  ```
- **Features**:
  - Responsive design utilities
  - Dark theme support
  - Custom component styling
  - Optimized bundle size with purging

#### PostCSS & Autoprefixer
- **PostCSS**: 8.5.3 - CSS processing pipeline
- **Autoprefixer**: 10.4.21 - Browser compatibility prefixes
- **Integration**: Seamless with Tailwind CSS processing

### Icons & Assets

#### Lucide React 0.511+
- **Purpose**: Comprehensive icon system
- **Version**: 0.511.0
- **Features**:
  - Tree-shakeable imports for bundle optimization
  - SVG-based icons for crisp rendering
  - Consistent design language
  - TypeScript support with prop types
- **Usage**: Network, terminal, and status icons

### State Management & Data Flow

#### React Hooks Pattern
- **useState**: Component-local state management
- **useEffect**: Side effects and lifecycle management
- **useRef**: DOM references and mutable values
- **useCallback**: Function memoization for performance
- **Custom Hooks**: Reusable state logic extraction

#### Real-Time Data Flow
```typescript
// WebSocket integration pattern
const [traces, setTraces] = useState<TraceRoute[]>([]);
const [socket, setSocket] = useState<Socket | null>(null);

useEffect(() => {
  const newSocket = io(BACKEND_URL);
  
  newSocket.on('traceroute_update', (data) => {
    setTraces(prev => updateTraceData(prev, data));
  });
  
  return () => newSocket.disconnect();
}, []);
```

### Build Tools & Development

#### Create React App 5.0+
- **Purpose**: Build tooling and development environment
- **Version**: React Scripts 5.0.1
- **Features**:
  - Webpack bundling with optimization
  - Babel transpilation for browser compatibility
  - Development server with hot module replacement
  - Production build optimization
  - ESLint integration

#### Webpack (via CRA)
- **Bundle Optimization**: Code splitting and tree shaking
- **Asset Processing**: SVG, CSS, and image optimization
- **Source Maps**: Development debugging support
- **Hot Module Replacement**: Fast development iteration

### Testing Framework

#### React Testing Library 16.3+
- **Purpose**: Component testing utilities
- **Version**: 16.3.0
- **Philosophy**: Testing from user perspective
- **Features**:
  - DOM queries based on accessibility
  - User interaction simulation
  - Async testing support for real-time features
  - Integration with Jest for assertions

#### Jest Environment
- **Version**: 29.7.0 (jsdom environment)
- **Purpose**: Test runner and assertion library
- **Features**:
  - Component snapshot testing
  - Mock support for WebSocket and services
  - Coverage reporting
  - Watch mode for development

### Frontend Dependencies
```json
{
  "react": "^19.1.0",               // Core UI framework
  "react-dom": "^19.1.0",           // DOM rendering
  "reactflow": "^11.11.4",          // Network visualization
  "dagre": "^0.8.5",               // Graph layout algorithm
  "socket.io-client": "^4.8.1",     // WebSocket client
  "tailwindcss": "^3.4.17",         // CSS framework
  "lucide-react": "^0.511.0",       // Icon system
  "typescript": "^4.9.5",           // Type system
  "@types/react": "^19.1.5",        // React type definitions
  "@types/dagre": "^0.7.52"         // Dagre type definitions
}
```

## Shared Technologies

### TypeScript Type System

#### Shared Interface Definitions
Both frontend and backend share TypeScript interfaces for data consistency:

```typescript
// Shared across frontend and backend
interface TraceRoute {
  id: string;
  destination: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  hops: HopData[];
  options: TracerouteOptions;
}

interface HopData {
  hopNumber: number;
  ipAddress: string;
  hostname?: string;
  responses: ResponseData[];
  averageLatency: number;
  location?: GeolocationData;
}
```

#### Type Safety Benefits
- **Compile-time Error Detection**: Catches type mismatches early
- **API Contract Enforcement**: Ensures frontend-backend compatibility
- **IntelliSense Support**: Enhanced IDE experience
- **Refactoring Safety**: Type-safe code changes

### Development Workflow

#### Monorepo Structure
```
vistrace/
├── package.json                    // Root package with scripts
├── vistrace-backend/              // Node.js backend service
│   ├── src/                       // TypeScript source code
│   ├── dist/                      // Compiled JavaScript
│   └── package.json               // Backend dependencies
├── vistrace-app/                  // React frontend application
│   ├── src/                       // React components and services
│   ├── build/                     // Production build output
│   └── package.json               // Frontend dependencies
└── docker-compose.yml             // Full-stack orchestration
```

#### Concurrent Development
- **Root Scripts**: Manage both frontend and backend simultaneously
- **Hot Reloading**: Both services support live code updates
- **Shared Types**: TypeScript interfaces synchronized between services
- **Testing**: Integrated test suites for both components

### Deployment Technologies

#### Docker Containerization

**Backend Container (Node.js)**:
```dockerfile
FROM node:16-alpine
RUN apk add --no-cache traceroute
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

**Frontend Container (Nginx)**:
```dockerfile
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

#### Docker Compose Orchestration
- **Multi-service coordination**: Frontend, backend, and database
- **Network configuration**: Internal communication setup
- **Volume management**: Data persistence and development mounting
- **Environment configuration**: Centralized environment variables

#### Production Deployment Stack
- **Nginx**: Static file serving and reverse proxy
- **Node.js**: Backend API and WebSocket server
- **PostgreSQL**: Optional database for trace persistence
- **Docker**: Containerized deployment
- **Load Balancing**: Support for horizontal scaling

## Performance Optimization

### Backend Performance

#### Process Management
- **Concurrent Limits**: Maximum 10 simultaneous traceroutes
- **Memory Management**: Automatic process cleanup
- **CPU Optimization**: Efficient parsing and data processing
- **Resource Monitoring**: Process health tracking

#### Caching Strategies
- **Geolocation Caching**: Reduce external API calls
- **DNS Caching**: Minimize hostname lookup overhead
- **Result Caching**: Store trace results for quick retrieval

### Frontend Performance

#### React Optimization
- **Component Memoization**: React.memo for expensive components
- **Hook Dependencies**: Optimized useEffect dependency arrays
- **Virtual DOM**: Efficient re-rendering with proper keys
- **Code Splitting**: Dynamic imports for large components

#### Visualization Performance
- **ReactFlow Optimization**: Efficient node and edge rendering
- **Animation Performance**: 60fps network topology updates
- **Canvas Optimization**: Efficient redraw strategies
- **Memory Management**: Cleanup of animation frames and intervals

#### Bundle Optimization
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Lazy loading of components
- **Asset Optimization**: Image and SVG compression
- **Bundle Analysis**: Monitor and optimize bundle size

## Security Implementation

### Backend Security

#### Input Validation
- **Command Injection Prevention**: Strict parameter validation
- **Sanitization**: Clean all user inputs before processing
- **Type Checking**: TypeScript compile-time validation
- **Rate Limiting**: Prevent API abuse and DoS attacks

#### Process Security
- **Sandboxing**: Isolate traceroute processes
- **Permission Management**: Minimal required privileges
- **Resource Limits**: Prevent resource exhaustion
- **Error Handling**: Secure error messages without information leakage

### Frontend Security

#### XSS Prevention
- **React Built-in Protection**: Automatic escaping of user content
- **Content Security Policy**: Restrict script execution
- **Input Sanitization**: Validate all user inputs
- **Safe HTML Rendering**: Use React's safe rendering patterns

#### Communication Security
- **HTTPS Enforcement**: Secure WebSocket connections (WSS)
- **CORS Configuration**: Proper cross-origin request handling
- **Token Validation**: Secure API authentication
- **Error Boundary**: Graceful error handling without exposure

## Development Tools & Workflow

### Code Quality Tools

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "@typescript-eslint/strict-boolean-expressions": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier Code Formatting
- **Consistent Code Style**: Automated formatting
- **Integration**: IDE and pre-commit hooks
- **Configuration**: Shared across frontend and backend

### Version Control & CI/CD

#### Git Workflow
- **Feature Branches**: Isolated development
- **Pull Request Reviews**: Code quality enforcement
- **Automated Testing**: CI pipeline integration
- **Release Management**: Semantic versioning

#### Potential CI/CD Pipeline
- **Automated Testing**: Run test suites on commits
- **Build Verification**: Ensure successful builds
- **Docker Building**: Automated container creation
- **Deployment**: Staging and production deployment

## Monitoring & Observability

### Logging Strategy

#### Backend Logging
- **Structured Logging**: JSON format for parsing
- **Log Levels**: Error, warn, info, debug
- **Request Logging**: API and WebSocket activity
- **Process Logging**: Traceroute execution tracking

#### Frontend Logging
- **Console Logging**: Development debugging
- **Error Tracking**: Production error monitoring
- **User Analytics**: Usage pattern tracking
- **Performance Monitoring**: Core Web Vitals

### Health Monitoring

#### System Health Checks
- **Backend Health Endpoint**: `/health` API endpoint
- **Database Connectivity**: Connection status monitoring
- **Process Monitoring**: Active traceroute tracking
- **Resource Usage**: Memory and CPU monitoring

#### Real-time Metrics
- **Active Connections**: WebSocket connection count
- **Trace Statistics**: Success/failure rates
- **Response Times**: API and trace performance
- **Error Rates**: System reliability metrics

## Browser Compatibility & Requirements

### Supported Browsers
- **Chrome 90+**: Full feature support with optimal performance
- **Firefox 88+**: Complete compatibility with WebSocket support
- **Safari 14+**: Full support with minor performance differences
- **Edge 90+**: Complete Chromium-based compatibility

### Required Features
- **WebSocket Support**: Essential for real-time communication
- **Modern JavaScript**: ES2020+ features via Babel transpilation
- **CSS Grid/Flexbox**: Layout compatibility
- **SVG Support**: Icon rendering capability

### Performance Baselines
- **Initial Load**: < 3 seconds for React application
- **WebSocket Latency**: < 100ms for real-time updates
- **Animation Performance**: 60fps ReactFlow rendering
- **Memory Usage**: < 200MB for typical usage

## Scalability Considerations

### Horizontal Scaling

#### Backend Scaling
- **Load Balancing**: Multiple backend instances
- **Process Distribution**: Distributed traceroute execution
- **Database Scaling**: Read replicas and connection pooling
- **WebSocket Scaling**: Sticky sessions or Redis adapter

#### Frontend Scaling
- **CDN Distribution**: Global static asset delivery
- **Caching**: Browser and proxy caching strategies
- **Bundle Optimization**: Minimize initial load times
- **Progressive Loading**: Lazy loading for large datasets

### Resource Management

#### Memory Optimization
- **Trace Cleanup**: Automatic old trace removal
- **Connection Management**: WebSocket connection pooling
- **Cache Management**: Intelligent cache eviction
- **Process Limits**: Prevent resource exhaustion

#### Performance Monitoring
- **Real-time Metrics**: System performance tracking
- **Alert Systems**: Automated performance issue detection
- **Resource Usage**: CPU, memory, and network monitoring
- **Scaling Triggers**: Automatic scaling based on load

This technical stack documentation reflects the current state of VisTrace as a **production-ready full-stack real-time network traceroute visualization application** with comprehensive backend services, real network analysis capabilities, and modern frontend visualization technologies.
