import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { TracerouteService } from './services/tracerouteService';
import { 
  WebSocketMessage, 
  TracerouteStartMessage, 
  TracerouteStopMessage 
} from './types/traceroute';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const tracerouteService = new TracerouteService();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeTraces: tracerouteService.getAllTraces().filter(t => t.status === 'running').length
  });
});

// Get all traces endpoint
app.get('/api/traces', (req, res) => {
  try {
    const traces = tracerouteService.getAllTraces();
    res.json(traces);
  } catch (error) {
    console.error('Error getting traces:', error);
    res.status(500).json({ error: 'Failed to get traces' });
  }
});

// Get specific trace endpoint
app.get('/api/traces/:traceId', (req, res) => {
  try {
    const trace = tracerouteService.getTrace(req.params.traceId);
    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }
    return res.json(trace);
  } catch (error) {
    console.error('Error getting trace:', error);
    return res.status(500).json({ error: 'Failed to get trace' });
  }
});

// Stop trace endpoint
app.post('/api/traces/:traceId/stop', (req, res) => {
  try {
    tracerouteService.stopTrace(req.params.traceId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping trace:', error);
    res.status(500).json({ error: 'Failed to stop trace' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current traces to new client
  const traces = tracerouteService.getAllTraces();
  traces.forEach(trace => {
    socket.emit('traceroute_update', { type: 'traceroute_update', trace });
  });

  socket.on('message', async (message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'start_traceroute':
          await handleStartTraceroute(socket, message);
          break;
        case 'stop_traceroute':
          handleStopTraceroute(socket, message);
          break;
        default:
          console.warn('Unknown message type:', message);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      socket.emit('traceroute_error', {
        type: 'traceroute_error',
        traceId: 'unknown',
        error: 'Internal server error'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

async function handleStartTraceroute(socket: any, message: TracerouteStartMessage) {
  try {
    console.log(`Starting traceroute to ${message.destination}`);
    const trace = await tracerouteService.startTraceroute(
      message.destination, 
      message.options
    );

    // Send initial trace data
    socket.emit('traceroute_update', { type: 'traceroute_update', trace });
    
    // Start periodic updates for this trace
    const updateInterval = setInterval(() => {
      const updatedTrace = tracerouteService.getTrace(trace.id);
      if (updatedTrace) {
        // Broadcast to all connected clients
        io.emit('traceroute_update', { type: 'traceroute_update', trace: updatedTrace });
        
        // Stop updates if trace is complete
        if (updatedTrace.status !== 'running') {
          clearInterval(updateInterval);
        }
      } else {
        clearInterval(updateInterval);
      }
    }, 1000);

  } catch (error) {
    console.error('Error starting traceroute:', error);
    socket.emit('traceroute_error', {
      type: 'traceroute_error',
      traceId: 'unknown',
      error: 'Failed to start traceroute'
    });
  }
}

function handleStopTraceroute(socket: any, message: TracerouteStopMessage) {
  try {
    tracerouteService.stopTrace(message.traceId);
    
    // Broadcast update to all clients
    const trace = tracerouteService.getTrace(message.traceId);
    if (trace) {
      io.emit('traceroute_update', { type: 'traceroute_update', trace });
    }
  } catch (error) {
    console.error('Error stopping traceroute:', error);
    socket.emit('traceroute_error', {
      type: 'traceroute_error',
      traceId: message.traceId,
      error: 'Failed to stop traceroute'
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  tracerouteService.cleanup();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  tracerouteService.cleanup();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`VisTrace Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});

export default app;
