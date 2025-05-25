# VisTrace - Visual Network Traceroute Tool

A React-based visual traceroute application that provides network engineers with comprehensive packet analysis and route visualization capabilities.

## Features

- **Visual Traceroute Display**: Clean, intuitive visualization of network hops with color-coded latency indicators
- **Detailed Packet Analysis**: Complete ICMP/Echo packet information including:
  - Sequence numbers, response times, TTL values
  - Packet sizes, flags, checksums, identification numbers
  - ICMP type/code information
- **Multiple Destination Tracking**: Simultaneous traceroutes to multiple destinations
- **Basic and Detailed Views**: Toggle between simplified and comprehensive packet information
- **Advanced Configuration Options**: Control over:
  - Maximum hops, packet sizes, timeout values
  - Packet types (ICMP, UDP, TCP)
  - IPv6 support, fragmentation settings
- **Memory Management**: Automatic cleanup of old traces to prevent memory overflow
- **PostgreSQL Integration**: Optional database storage for historical data analysis (backend required)

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Running Tests

```bash
npm test
```

## Usage

1. **Starting a Traceroute**:
   - Enter a hostname or IP address in the input field
   - Optionally configure advanced options (max hops, packet size, etc.)
   - Click "Start Trace"

2. **Viewing Results**:
   - Each hop displays IP address, hostname (if available), and latency
   - Color coding: Green (good), Yellow (warning), Red (poor) latency
   - Click "Show Details" to see packet-level information

3. **Managing Multiple Traces**:
   - Multiple traceroutes can run simultaneously
   - Use "Stop All" to terminate all active traces
   - Old traces are automatically cleaned up to conserve memory

4. **Database Integration** (requires backend):
   - Click the database icon to configure PostgreSQL connection
   - Completed traces are automatically saved for historical analysis

## Architecture

- **Frontend**: React with TypeScript, Tailwind CSS for styling
- **State Management**: React hooks for local state
- **Testing**: Jest with React Testing Library
- **Styling**: Atomic CSS with Tailwind CSS
- **Icons**: Lucide React for consistent iconography

## Technical Details

### Packet Analysis
The application captures and displays comprehensive packet information:
- **ICMP Packets**: Type, code, payload data
- **Echo Packets**: Echo ID, sequence numbers, data payloads
- **Network Info**: TTL, packet size, flags, checksums

### Memory Management
- Maintains a rolling window of recent traces (default: 100)
- Automatic cleanup based on trace age
- Configurable memory limits to prevent browser slowdown

### Browser Limitations
Note: This is a simulated traceroute for demonstration purposes. Real network traceroute functionality requires system-level access not available in browsers. For production use, integrate with a backend service that performs actual network tracing.

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── TracerouteControl.tsx      # Main control interface
│   ├── TracerouteVisualization.tsx # Results display
│   └── DatabaseConfig.tsx         # Database settings
├── services/           # Business logic
│   ├── tracerouteService.ts       # Core tracing logic
│   └── databaseService.ts         # Database integration
├── types/              # TypeScript definitions
│   └── traceroute.ts              # Interface definitions
└── __tests__/          # Test suites
```

### Available Scripts

- `npm start` - Runs the development server
- `npm test` - Runs the test suite
- `npm run build` - Creates a production build
- `npm run eject` - Ejects from Create React App (one-way operation)

### Adding Features

1. **New Packet Types**: Extend the `PacketData` interface in `types/traceroute.ts`
2. **Additional Visualizations**: Create new components in the `components/` directory
3. **Enhanced Analysis**: Add methods to `tracerouteService.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Future Enhancements

- Real-time geographic visualization of hops
- Integration with network monitoring systems
- Export functionality for trace data
- Custom alerting for network issues
- Integration with popular network tools (ping, nslookup, etc.)