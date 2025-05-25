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

export interface HopData {
  hopNumber: number;
  ipAddress: string;
  hostname?: string;
  packets: (ICMPPacket | EchoPacket)[];
  averageTime: number;
  minTime: number;
  maxTime: number;
  packetLoss: number;
  location?: {
    country?: string;
    city?: string;
    isp?: string;
  };
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

export interface TracerouteOptions {
  maxHops: number;
  packetSize: number;
  timeout: number;
  queries: number;
  useIPv6: boolean;
  dontFragment: boolean;
  sourceIP?: string;
  packetType: 'icmp' | 'udp' | 'tcp';
}

export interface DatabaseConfig {
  url: string;
  username: string;
  password: string;
  database: string;
}
