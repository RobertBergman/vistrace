import { TraceRoute, TracerouteOptions } from '../types/traceroute';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  trace?: TraceRoute;
  error?: string;
  traceId?: string;
}

class TracerouteService {
  private activeTraces: Map<string, TraceRoute> = new Map();
  private maxStoredTraces = 100;
  private socket: Socket | null = null;
  private backendUrl: string;
  private listeners: ((traces: TraceRoute[]) => void)[] = [];

  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    this.initializeSocket();
  }

  private initializeSocket(): void {
    console.log('Initializing WebSocket connection to:', this.backendUrl);
    
    this.socket = io(this.backendUrl, {
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to VisTrace backend');
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('❌ Disconnected from VisTrace backend:', reason);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🔥 WebSocket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber: any) => {
      console.log('🔄 Reconnected to backend after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error: any) => {
      console.error('🔄❌ Reconnection failed:', error);
    });

    this.socket.on('traceroute_update', (message: WebSocketMessage) => {
      console.log('📡 Received traceroute update:', message);
      if (message.trace) {
        // Fix date serialization issue - convert string dates back to Date objects
        const fixedTrace = this.fixDateFields(message.trace);
        this.activeTraces.set(fixedTrace.id, fixedTrace);
        this.notifyListeners();
        this.cleanupOldTraces();
      }
    });

    this.socket.on('traceroute_error', (message: WebSocketMessage) => {
      console.error('Traceroute error:', message.error);
    });
  }

  private fixDateFields(trace: any): TraceRoute {
    // Convert string dates back to Date objects
    return {
      ...trace,
      startTime: new Date(trace.startTime),
      endTime: trace.endTime ? new Date(trace.endTime) : undefined,
      hops: trace.hops.map((hop: any) => ({
        ...hop,
        packets: hop.packets.map((packet: any) => ({
          ...packet,
          timestamp: new Date(packet.timestamp)
        }))
      }))
    };
  }

  private notifyListeners(): void {
    const traces = this.getAllTraces();
    this.listeners.forEach(listener => listener(traces));
  }

  addListener(listener: (traces: TraceRoute[]) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (traces: TraceRoute[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  async startTraceroute(
    destination: string, 
    options: Partial<TracerouteOptions> = {}
  ): Promise<TraceRoute> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('WebSocket not connected to backend');
    }

    // Send start traceroute message to backend
    this.socket.emit('message', {
      type: 'start_traceroute',
      destination,
      options
    });

    // Create a temporary trace that will be replaced by the real one from backend
    const tempTrace: TraceRoute = {
      id: `temp_${Date.now()}`,
      destination,
      startTime: new Date(),
      hops: [],
      status: 'running',
      totalPackets: 0,
      successfulPackets: 0,
      maxHops: options.maxHops || 30,
      packetSize: options.packetSize || 64,
      timeout: options.timeout || 5000
    };

    this.activeTraces.set(tempTrace.id, tempTrace);
    return tempTrace;
  }

  private cleanupOldTraces(): void {
    const traces = Array.from(this.activeTraces.values())
      .sort((a, b) => {
        const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
        const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
        return bTime - aTime;
      });

    if (traces.length > this.maxStoredTraces) {
      const toRemove = traces.slice(this.maxStoredTraces);
      toRemove.forEach(trace => this.activeTraces.delete(trace.id));
    }
  }

  getTrace(traceId: string): TraceRoute | undefined {
    return this.activeTraces.get(traceId);
  }

  getAllTraces(): TraceRoute[] {
    return Array.from(this.activeTraces.values())
      .sort((a, b) => {
        const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
        const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
        return bTime - aTime;
      });
  }

  stopTrace(traceId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Cannot stop trace: WebSocket not connected');
      return;
    }

    // Send stop message to backend
    this.socket.emit('message', {
      type: 'stop_traceroute',
      traceId
    });

    // Also update local state
    const trace = this.activeTraces.get(traceId);
    if (trace && trace.status === 'running') {
      trace.status = 'stopped';
      trace.endTime = new Date();
      this.notifyListeners();
    }
  }

  clearTrace(traceId: string): void {
    this.activeTraces.delete(traceId);
    this.notifyListeners();
  }

  // Check backend connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Reconnect to backend
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  // Cleanup method for component unmounting
  cleanup(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = [];
    this.activeTraces.clear();
  }
}

export const tracerouteService = new TracerouteService();
