-- VisTrace Database Initialization Script
-- This script creates the necessary tables for storing traceroute data

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create traces table
CREATE TABLE IF NOT EXISTS traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    total_packets INTEGER DEFAULT 0,
    successful_packets INTEGER DEFAULT 0,
    max_hops INTEGER DEFAULT 30,
    packet_size INTEGER DEFAULT 64,
    timeout_ms INTEGER DEFAULT 5000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create hops table
CREATE TABLE IF NOT EXISTS hops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id UUID NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
    hop_number INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- Supports both IPv4 and IPv6
    hostname VARCHAR(255),
    average_time DECIMAL(10,3),
    min_time DECIMAL(10,3),
    max_time DECIMAL(10,3),
    packet_loss DECIMAL(5,2) DEFAULT 0,
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    location_isp VARCHAR(255),
    location_latitude DECIMAL(10,7),
    location_longitude DECIMAL(10,7),
    location_timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(trace_id, hop_number)
);

-- Create packets table
CREATE TABLE IF NOT EXISTS packets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hop_id UUID NOT NULL REFERENCES hops(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    response_time DECIMAL(10,3),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    ttl INTEGER,
    packet_size INTEGER,
    flags TEXT[],
    checksum VARCHAR(10),
    identification INTEGER,
    packet_type VARCHAR(10) DEFAULT 'icmp',
    icmp_type INTEGER,
    icmp_code INTEGER,
    payload TEXT,
    echo_id INTEGER,
    echo_sequence INTEGER,
    echo_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_traces_destination ON traces(destination);
CREATE INDEX IF NOT EXISTS idx_traces_start_time ON traces(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_hops_trace_id ON hops(trace_id);
CREATE INDEX IF NOT EXISTS idx_hops_hop_number ON hops(trace_id, hop_number);
CREATE INDEX IF NOT EXISTS idx_packets_hop_id ON packets(hop_id);
CREATE INDEX IF NOT EXISTS idx_packets_timestamp ON packets(timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_traces_updated_at ON traces;
CREATE TRIGGER update_traces_updated_at
    BEFORE UPDATE ON traces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for easy querying
CREATE OR REPLACE VIEW trace_summary AS
SELECT 
    t.id,
    t.destination,
    t.start_time,
    t.end_time,
    t.status,
    t.total_packets,
    t.successful_packets,
    EXTRACT(EPOCH FROM (COALESCE(t.end_time, NOW()) - t.start_time)) as duration_seconds,
    COUNT(h.id) as hop_count,
    AVG(h.average_time) as avg_response_time,
    MIN(h.min_time) as min_response_time,
    MAX(h.max_time) as max_response_time
FROM traces t
LEFT JOIN hops h ON t.id = h.trace_id
GROUP BY t.id, t.destination, t.start_time, t.end_time, t.status, t.total_packets, t.successful_packets;

-- Create view for latest traces
CREATE OR REPLACE VIEW latest_traces AS
SELECT * FROM trace_summary
ORDER BY start_time DESC
LIMIT 100;

-- Insert sample data for testing (optional)
INSERT INTO traces (id, destination, start_time, end_time, status, total_packets, successful_packets)
VALUES 
    (uuid_generate_v4(), 'google.com', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '58 minutes', 'completed', 90, 87),
    (uuid_generate_v4(), '8.8.8.8', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 'completed', 60, 60)
ON CONFLICT DO NOTHING;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vistrace_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vistrace_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO vistrace_user;

-- Display table info
\dt
\d traces
\d hops
\d packets

COMMENT ON TABLE traces IS 'Stores traceroute execution information';
COMMENT ON TABLE hops IS 'Stores individual hop data for each traceroute';
COMMENT ON TABLE packets IS 'Stores individual packet data for each hop';
COMMENT ON VIEW trace_summary IS 'Summary view of traces with aggregated hop statistics';
COMMENT ON VIEW latest_traces IS 'Most recent 100 traces ordered by start time';
