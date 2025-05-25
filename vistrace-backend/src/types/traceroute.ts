// Shared types between frontend and backend
export interface TracerouteOptions {
  maxHops: number;
  packetSize: number;
  timeout: number;
  queries: number;
  useIPv6: boolean;
  dontFragment: boolean;
  packetType: 'icmp' | 'udp' | 'tcp';
}

export interface PacketData {
  sequenceNumber: number;
  responseTime: number;
  timestamp: Date;
  ttl: number;
  packetSize: number;
  flags: string[];
  checksum: string;
  identification: number;
}

export interface ICMPPacket extends PacketData {
  type: number;
  code: number;
  payload: string;
}

export interface EchoPacket extends PacketData {
  echoId: number;
  echoSequence: number;
  data: string;
}

export interface LocationData {
  country?: string;
  city?: string;
  isp?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface HopData {
  hopNumber: number;
  ipAddress: string;
  hostname?: string;
  packets: (ICMPPacket | EchoPacket)[];
  averageTime: number;
  minTime: number;
  maxTime: number;
  packetLoss: number;
  location?: LocationData;
}

export interface TraceRoute {
  id: string;
  destination: string;
  startTime: Date;
  endTime?: Date;
  hops: HopData[];
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'stopped';
  totalPackets: number;
  successfulPackets: number;
  maxHops: number;
  packetSize: number;
  timeout: number;
}

// WebSocket message types
export interface TracerouteStartMessage {
  type: 'start_traceroute';
  destination: string;
  options: Partial<TracerouteOptions>;
}

export interface TracerouteStopMessage {
  type: 'stop_traceroute';
  traceId: string;
}

export interface TracerouteUpdateMessage {
  type: 'traceroute_update';
  trace: TraceRoute;
}

export interface TracerouteErrorMessage {
  type: 'traceroute_error';
  traceId: string;
  error: string;
}

export type WebSocketMessage = 
  | TracerouteStartMessage 
  | TracerouteStopMessage 
  | TracerouteUpdateMessage 
  | TracerouteErrorMessage;
