import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { TraceRoute, TracerouteOptions, HopData, ICMPPacket, LocationData } from '../types/traceroute';
import { GeolocationService } from './geolocationService';

export class TracerouteService {
  private activeTraces: Map<string, { trace: TraceRoute; process?: ChildProcess }> = new Map();
  private geolocationService: GeolocationService;

  constructor() {
    this.geolocationService = new GeolocationService();
  }

  async startTraceroute(
    destination: string,
    options: Partial<TracerouteOptions> = {}
  ): Promise<TraceRoute> {
    const defaultOptions: TracerouteOptions = {
      maxHops: 30,
      packetSize: 64,
      timeout: 5000,
      queries: 3,
      useIPv6: false,
      dontFragment: true,
      packetType: 'icmp'
    };

    const traceOptions = { ...defaultOptions, ...options };
    const traceId = uuidv4();

    const trace: TraceRoute = {
      id: traceId,
      destination,
      startTime: new Date(),
      hops: [],
      status: 'running',
      totalPackets: 0,
      successfulPackets: 0,
      maxHops: traceOptions.maxHops,
      packetSize: traceOptions.packetSize,
      timeout: traceOptions.timeout
    };

    this.activeTraces.set(traceId, { trace });
    
    // Start the traceroute process
    this.executeTraceroute(traceId, destination, traceOptions);
    
    return trace;
  }

  private executeTraceroute(
    traceId: string,
    destination: string,
    options: TracerouteOptions
  ): void {
    const traceData = this.activeTraces.get(traceId);
    if (!traceData) return;

    const command = this.buildTracerouteCommand(destination, options);
    console.log(`Executing: ${command.cmd} ${command.args.join(' ')}`);

    const process = spawn(command.cmd, command.args);
    traceData.process = process;

    let outputBuffer = '';
    let hopNumber = 1;

    process.stdout.on('data', (data: Buffer) => {
      outputBuffer += data.toString();
      
      // Process complete lines
      const lines = outputBuffer.split('\n');
      outputBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        this.processTracerouteLine(traceId, line.trim(), hopNumber, options);
        if (line.trim() && !line.includes('traceroute to') && !line.includes('TRACEROUTE')) {
          hopNumber++;
        }
      }
    });

    process.stderr.on('data', (data: Buffer) => {
      console.error(`Traceroute stderr: ${data}`);
    });

    process.on('close', (code) => {
      const trace = this.activeTraces.get(traceId);
      if (trace) {
        trace.trace.status = code === 0 ? 'completed' : 'failed';
        trace.trace.endTime = new Date();
        console.log(`Traceroute ${traceId} finished with code ${code}`);
      }
    });

    process.on('error', (error) => {
      console.error(`Traceroute error: ${error}`);
      const trace = this.activeTraces.get(traceId);
      if (trace) {
        trace.trace.status = 'failed';
        trace.trace.endTime = new Date();
      }
    });
  }

  private buildTracerouteCommand(destination: string, options: TracerouteOptions): { cmd: string; args: string[] } {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows tracert command
      const args = ['-h', options.maxHops.toString()];
      if (options.useIPv6) args.push('-6');
      args.push(destination);
      return { cmd: 'tracert', args };
    } else {
      // Unix-like systems (Linux, macOS)
      const args: string[] = [];
      
      // Set maximum hops
      args.push('-m', options.maxHops.toString());
      
      // Set number of queries per hop
      args.push('-q', options.queries.toString());
      
      // Set timeout (convert ms to seconds)
      args.push('-w', Math.ceil(options.timeout / 1000).toString());
      
      // IPv6 support
      if (options.useIPv6) {
        return { cmd: 'traceroute6', args: [...args, destination] };
      }
      
      // Protocol selection (Linux)
      if (platform === 'linux') {
        switch (options.packetType) {
          case 'icmp':
            args.push('-I');
            break;
          case 'tcp':
            args.push('-T');
            break;
          case 'udp':
            // UDP is default for Linux traceroute
            break;
        }
      }
      
      // Don't fragment flag (Linux)
      if (options.dontFragment && platform === 'linux') {
        args.push('-F');
      }
      
      args.push(destination);
      return { cmd: 'traceroute', args };
    }
  }

  private async processTracerouteLine(
    traceId: string,
    line: string,
    hopNumber: number,
    options: TracerouteOptions
  ): Promise<void> {
    const traceData = this.activeTraces.get(traceId);
    if (!traceData || !line) return;

    // Skip header lines
    if (line.includes('traceroute to') || line.includes('TRACEROUTE') || 
        line.includes('over a maximum of') || line.trim() === '') {
      return;
    }

    const hopData = await this.parseHopLine(line, hopNumber, options);
    if (hopData) {
      // Update or add the hop
      const existingHopIndex = traceData.trace.hops.findIndex(h => h.hopNumber === hopData.hopNumber);
      if (existingHopIndex >= 0) {
        traceData.trace.hops[existingHopIndex] = hopData;
      } else {
        traceData.trace.hops.push(hopData);
      }

      // Update packet counts
      traceData.trace.totalPackets += hopData.packets.length;
      traceData.trace.successfulPackets += hopData.packets.filter(p => p.responseTime > 0).length;
    }
  }

  private async parseHopLine(line: string, hopNumber: number, options: TracerouteOptions): Promise<HopData | null> {
    // Different regex patterns for different platforms and formats
    const patterns = [
      // Linux/macOS: " 1  router.local (192.168.1.1)  1.234 ms  1.345 ms  1.456 ms"
      /^\s*(\d+)\s+(\S+)\s*\(([^)]+)\)\s+(.+)$/,
      // Windows: " 1    <1 ms    <1 ms    <1 ms  192.168.1.1"
      /^\s*(\d+)\s+(.+?)\s+(\d+\.\d+\.\d+\.\d+|\*+)$/,
      // Simplified: " 1  192.168.1.1  1.234 ms  1.345 ms  1.456 ms"
      /^\s*(\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(.+)$/,
      // Timeout: " 1  * * *"
      /^\s*(\d+)\s+\*\s*\*\s*\*\s*$/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return await this.parseMatchedHop(match, hopNumber, options);
      }
    }

    return null;
  }

  private async parseMatchedHop(match: RegExpMatchArray, hopNumber: number, options: TracerouteOptions): Promise<HopData> {
    let ipAddress = '*';
    let hostname: string | undefined;
    const packets: ICMPPacket[] = [];

    if (match[0].includes('* * *')) {
      // Timeout hop
      return {
        hopNumber,
        ipAddress: '*',
        packets: [],
        averageTime: -1,
        minTime: -1,
        maxTime: -1,
        packetLoss: 100
      };
    }

    // Extract IP and hostname
    if (match.length >= 4) {
      hostname = match[2];
      ipAddress = match[3];
      
      // Parse timing data from the rest of the line
      const timingData = match[4] || '';
      const timeMatches = timingData.match(/(\d+(?:\.\d+)?)\s*ms/g);
      
      if (timeMatches) {
        timeMatches.forEach((timeStr, index) => {
          const time = parseFloat(timeStr.replace(/\s*ms/, ''));
          packets.push({
            sequenceNumber: index + 1,
            responseTime: time,
            timestamp: new Date(),
            ttl: hopNumber,
            packetSize: options.packetSize,
            flags: options.dontFragment ? ['DF'] : [],
            checksum: Math.floor(Math.random() * 65535).toString(16),
            identification: Math.floor(Math.random() * 65535),
            type: 11, // ICMP Time Exceeded
            code: 0,
            payload: ''
          });
        });
      }
    }

    // Calculate statistics
    const times = packets.map(p => p.responseTime).filter(t => t > 0);
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : -1;
    const minTime = times.length > 0 ? Math.min(...times) : -1;
    const maxTime = times.length > 0 ? Math.max(...times) : -1;
    const packetLoss = ((options.queries - packets.length) / options.queries) * 100;

    // Get geolocation data
    let location: LocationData | undefined;
    if (ipAddress !== '*' && this.isPublicIP(ipAddress)) {
      try {
        location = await this.geolocationService.getLocationData(ipAddress);
      } catch (error) {
        console.warn(`Failed to get location for ${ipAddress}:`, error);
      }
    }

    return {
      hopNumber,
      ipAddress,
      hostname,
      packets,
      averageTime,
      minTime,
      maxTime,
      packetLoss,
      location
    };
  }

  private isPublicIP(ip: string): boolean {
    // Check if IP is public (not private, loopback, or special)
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    // Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    // Loopback: 127.0.0.0/8
    // Link-local: 169.254.0.0/16
    
    if (parts[0] === 10) return false;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    if (parts[0] === 192 && parts[1] === 168) return false;
    if (parts[0] === 127) return false;
    if (parts[0] === 169 && parts[1] === 254) return false;
    
    return true;
  }

  getTrace(traceId: string): TraceRoute | undefined {
    return this.activeTraces.get(traceId)?.trace;
  }

  getAllTraces(): TraceRoute[] {
    return Array.from(this.activeTraces.values()).map(t => t.trace);
  }

  stopTrace(traceId: string): void {
    const traceData = this.activeTraces.get(traceId);
    if (traceData) {
      if (traceData.process) {
        traceData.process.kill('SIGTERM');
      }
      traceData.trace.status = 'stopped';
      traceData.trace.endTime = new Date();
    }
  }

  clearTrace(traceId: string): void {
    const traceData = this.activeTraces.get(traceId);
    if (traceData && traceData.process) {
      traceData.process.kill('SIGTERM');
    }
    this.activeTraces.delete(traceId);
  }

  cleanup(): void {
    // Stop all active processes
    for (const [traceId, traceData] of this.activeTraces.entries()) {
      if (traceData.process) {
        traceData.process.kill('SIGTERM');
      }
    }
    this.activeTraces.clear();
  }
}
