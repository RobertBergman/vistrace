# VisTrace Backend

Real-time traceroute execution backend for the VisTrace application. This service performs actual system-level traceroute commands and streams results to the frontend via WebSocket connections.

## Features

- **Real Traceroute Execution**: Uses system `traceroute` (Linux/macOS) or `tracert` (Windows) commands
- **WebSocket Streaming**: Real-time updates of traceroute progress
- **Geolocation Integration**: Automatic IP geolocation using multiple APIs
- **Cross-Platform Support**: Works on Linux, macOS, and Windows
- **RESTful API**: HTTP endpoints for trace management
- **Process Management**: Proper cleanup and signal handling

## Prerequisites

### System Requirements
- Node.js 16+ 
- npm or yarn
- System traceroute tools:
  - **Linux**: `traceroute` package (`sudo apt install traceroute` or `sudo yum install traceroute`)
  - **macOS**: Built-in `traceroute` command
  - **Windows**: Built-in `tracert` command

### Network Permissions
- **Linux/macOS**: May require sudo privileges for ICMP traceroute
- **Windows**: Usually works without special permissions

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables (.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Optional API Keys for Enhanced Geolocation
IPSTACK_API_KEY=your_ipstack_api_key_here
IPINFO_TOKEN=your_ipinfo_token_here

# Database (Optional - for future expansion)
DATABASE_URL=postgresql://username:password@localhost:5432/vistrace
```

### Geolocation API Keys (Optional)

The backend uses multiple geolocation services for IP location data:

1. **IPStack** (Recommended): Get free API key at https://ipstack.com/
2. **IPInfo**: Get free token at https://ipinfo.io/
3. **IP-API**: Free service, no key required (fallback)

Without API keys, the service will use IP-API as fallback with rate limits.

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and active trace count.

### Get All Traces
```
GET /api/traces
```
Returns array of all stored traces.

### Get Specific Trace
```
GET /api/traces/:traceId
```
Returns details for a specific trace.

### Stop Trace
```
POST /api/traces/:traceId/stop
```
Stops a running traceroute.

## WebSocket Interface

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Starting a Traceroute
```javascript
socket.emit('message', {
  type: 'start_traceroute',
  destination: 'google.com',
  options: {
    maxHops: 30,
    queries: 3,
    timeout: 5000,
    useIPv6: false,
    packetType: 'icmp'
  }
});
```

### Receiving Updates
```javascript
socket.on('traceroute_update', (message) => {
  console.log('Trace update:', message.trace);
});

socket.on('traceroute_error', (message) => {
  console.error('Trace error:', message.error);
});
```

### Stopping a Traceroute
```javascript
socket.emit('message', {
  type: 'stop_traceroute',
  traceId: 'trace-id-here'
});
```

## Command Line Options

The backend automatically detects the platform and uses appropriate commands:

### Linux/macOS
```bash
traceroute -m 30 -q 3 -w 5 -I google.com
```

### Windows
```bash
tracert -h 30 google.com
```

### Options Support
- **Max Hops**: `-m` (Linux/macOS) / `-h` (Windows)
- **Queries per Hop**: `-q` (Linux/macOS only)
- **Timeout**: `-w` (Linux/macOS only)
- **Protocol**: `-I` (ICMP), `-T` (TCP), `-U` (UDP) on Linux
- **IPv6**: `traceroute6` command on Unix systems

## Security Considerations

### Network Security
- **ICMP Requirements**: May need elevated privileges on some systems
- **Firewall Rules**: Ensure outbound traceroute traffic is allowed
- **Rate Limiting**: Built-in cleanup prevents excessive traces

### API Security
- **CORS Configuration**: Restricts frontend origins
- **Input Validation**: Sanitizes destination inputs
- **Process Isolation**: Each traceroute runs in separate process

## Performance

### Resource Management
- **Process Cleanup**: Automatic termination of completed traces
- **Memory Limits**: Maximum 100 stored traces per instance
- **Connection Limits**: WebSocket connection management

### Scaling Considerations
- **Single Instance**: Current design for single-server deployment
- **Process Pool**: Consider process pooling for high-volume usage
- **Database Storage**: Optional PostgreSQL integration for persistence

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Linux/macOS: Try with sudo or use UDP mode
   sudo npm run dev
   ```

2. **Command Not Found**
   ```bash
   # Linux: Install traceroute
   sudo apt install traceroute  # Debian/Ubuntu
   sudo yum install traceroute  # RHEL/CentOS
   ```

3. **Port Already in Use**
   ```bash
   # Change PORT in .env file
   PORT=3002
   ```

4. **WebSocket Connection Failed**
   - Check firewall settings
   - Verify FRONTEND_URL in .env
   - Ensure frontend is connecting to correct port

### Debugging

Enable debug logging:
```bash
DEBUG=vistrace:* npm run dev
```

Check process status:
```bash
# View active Node.js processes
ps aux | grep node

# Check port usage
netstat -tulpn | grep :3001
```

## Development

### Project Structure
```
src/
├── server.ts              # Main Express server
├── services/
│   ├── tracerouteService.ts  # Core traceroute logic
│   └── geolocationService.ts # IP geolocation
└── types/
    └── traceroute.ts       # TypeScript interfaces
```

### Adding Features

1. **New Commands**: Extend `buildTracerouteCommand()` method
2. **Additional APIs**: Add endpoints to `server.ts`
3. **Enhanced Parsing**: Modify `parseHopLine()` method
4. **Database Integration**: Implement persistence layer

### Code Quality
```bash
npm run lint          # ESLint checking
npm run test          # Run test suite
npm run build         # TypeScript compilation
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check this README
2. Review the troubleshooting section
3. Check system traceroute functionality
4. Verify network connectivity and permissions
