import { Client } from 'pg';
import { TraceRoute, DatabaseConfig } from '../types/traceroute';

class DatabaseService {
  private client: Client | null = null;
  private isConnected = false;

  async connect(config: DatabaseConfig): Promise<boolean> {
    try {
      this.client = new Client({
        connectionString: config.url,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: {
          rejectUnauthorized: false
        }
      });

      await this.client.connect();
      await this.initializeDatabase();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  private async initializeDatabase(): Promise<void> {
    if (!this.client) return;

    const createTracesTable = `
      CREATE TABLE IF NOT EXISTS traces (
        id VARCHAR(255) PRIMARY KEY,
        destination VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        total_packets INTEGER NOT NULL,
        successful_packets INTEGER NOT NULL,
        max_hops INTEGER NOT NULL,
        packet_size INTEGER NOT NULL,
        timeout_ms INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createHopsTable = `
      CREATE TABLE IF NOT EXISTS hops (
        id SERIAL PRIMARY KEY,
        trace_id VARCHAR(255) REFERENCES traces(id) ON DELETE CASCADE,
        hop_number INTEGER NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        hostname VARCHAR(255),
        average_time FLOAT NOT NULL,
        min_time FLOAT NOT NULL,
        max_time FLOAT NOT NULL,
        packet_loss FLOAT NOT NULL,
        location_country VARCHAR(100),
        location_city VARCHAR(100),
        location_isp VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createPacketsTable = `
      CREATE TABLE IF NOT EXISTS packets (
        id SERIAL PRIMARY KEY,
        hop_id INTEGER REFERENCES hops(id) ON DELETE CASCADE,
        sequence_number INTEGER NOT NULL,
        response_time FLOAT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        ttl INTEGER NOT NULL,
        packet_size INTEGER NOT NULL,
        flags TEXT[],
        checksum VARCHAR(10),
        identification INTEGER,
        packet_type VARCHAR(10) NOT NULL,
        icmp_type INTEGER,
        icmp_code INTEGER,
        payload TEXT,
        echo_id INTEGER,
        echo_sequence INTEGER,
        echo_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.client.query(createTracesTable);
    await this.client.query(createHopsTable);
    await this.client.query(createPacketsTable);
  }

  async saveTrace(trace: TraceRoute): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      await this.client.query('BEGIN');

      const insertTrace = `
        INSERT INTO traces (
          id, destination, start_time, end_time, status, 
          total_packets, successful_packets, max_hops, packet_size, timeout_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          end_time = EXCLUDED.end_time,
          status = EXCLUDED.status,
          total_packets = EXCLUDED.total_packets,
          successful_packets = EXCLUDED.successful_packets;
      `;

      await this.client.query(insertTrace, [
        trace.id,
        trace.destination,
        trace.startTime,
        trace.endTime,
        trace.status,
        trace.totalPackets,
        trace.successfulPackets,
        trace.maxHops,
        trace.packetSize,
        trace.timeout
      ]);

      for (const hop of trace.hops) {
        const insertHop = `
          INSERT INTO hops (
            trace_id, hop_number, ip_address, hostname, average_time,
            min_time, max_time, packet_loss, location_country, location_city, location_isp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (trace_id, hop_number) DO UPDATE SET
            ip_address = EXCLUDED.ip_address,
            hostname = EXCLUDED.hostname,
            average_time = EXCLUDED.average_time,
            min_time = EXCLUDED.min_time,
            max_time = EXCLUDED.max_time,
            packet_loss = EXCLUDED.packet_loss
          RETURNING id;
        `;

        const hopResult = await this.client.query(insertHop, [
          trace.id,
          hop.hopNumber,
          hop.ipAddress,
          hop.hostname,
          hop.averageTime,
          hop.minTime,
          hop.maxTime,
          hop.packetLoss,
          hop.location?.country,
          hop.location?.city,
          hop.location?.isp
        ]);

        const hopId = hopResult.rows[0].id;

        for (const packet of hop.packets) {
          const insertPacket = `
            INSERT INTO packets (
              hop_id, sequence_number, response_time, timestamp, ttl, packet_size,
              flags, checksum, identification, packet_type, icmp_type, icmp_code,
              payload, echo_id, echo_sequence, echo_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
          `;

          const isICMP = 'type' in packet;
          await this.client.query(insertPacket, [
            hopId,
            packet.sequenceNumber,
            packet.responseTime,
            packet.timestamp,
            packet.ttl,
            packet.packetSize,
            packet.flags,
            packet.checksum,
            packet.identification,
            isICMP ? 'icmp' : 'echo',
            isICMP ? packet.type : null,
            isICMP ? packet.code : null,
            isICMP ? packet.payload : null,
            !isICMP ? (packet as any).echoId : null,
            !isICMP ? (packet as any).echoSequence : null,
            !isICMP ? (packet as any).data : null
          ]);
        }
      }

      await this.client.query('COMMIT');
      return true;
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error('Failed to save trace:', error);
      return false;
    }
  }

  async getTraces(limit: number = 50): Promise<TraceRoute[]> {
    if (!this.client || !this.isConnected) return [];

    try {
      const result = await this.client.query(`
        SELECT * FROM traces 
        ORDER BY start_time DESC 
        LIMIT $1
      `, [limit]);

      const traces: TraceRoute[] = [];

      for (const row of result.rows) {
        const hopsResult = await this.client.query(`
          SELECT * FROM hops 
          WHERE trace_id = $1 
          ORDER BY hop_number
        `, [row.id]);

        const hops = [];
        for (const hopRow of hopsResult.rows) {
          const packetsResult = await this.client.query(`
            SELECT * FROM packets 
            WHERE hop_id = $1 
            ORDER BY sequence_number
          `, [hopRow.id]);

          const packets = packetsResult.rows.map(packetRow => ({
            sequenceNumber: packetRow.sequence_number,
            responseTime: packetRow.response_time,
            timestamp: packetRow.timestamp,
            ttl: packetRow.ttl,
            packetSize: packetRow.packet_size,
            flags: packetRow.flags || [],
            checksum: packetRow.checksum,
            identification: packetRow.identification,
            ...(packetRow.packet_type === 'icmp' ? {
              type: packetRow.icmp_type,
              code: packetRow.icmp_code,
              payload: packetRow.payload
            } : {
              echoId: packetRow.echo_id,
              echoSequence: packetRow.echo_sequence,
              data: packetRow.echo_data
            })
          }));

          hops.push({
            hopNumber: hopRow.hop_number,
            ipAddress: hopRow.ip_address,
            hostname: hopRow.hostname,
            packets,
            averageTime: hopRow.average_time,
            minTime: hopRow.min_time,
            maxTime: hopRow.max_time,
            packetLoss: hopRow.packet_loss,
            location: {
              country: hopRow.location_country,
              city: hopRow.location_city,
              isp: hopRow.location_isp
            }
          });
        }

        traces.push({
          id: row.id,
          destination: row.destination,
          startTime: row.start_time,
          endTime: row.end_time,
          hops,
          status: row.status,
          totalPackets: row.total_packets,
          successfulPackets: row.successful_packets,
          maxHops: row.max_hops,
          packetSize: row.packet_size,
          timeout: row.timeout_ms
        });
      }

      return traces;
    } catch (error) {
      console.error('Failed to get traces:', error);
      return [];
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }

  isDbConnected(): boolean {
    return this.isConnected;
  }
}

export const databaseService = new DatabaseService();