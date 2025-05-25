import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TracerouteVisualization } from '../TracerouteVisualization';
import { TraceRoute } from '../../types/traceroute';

describe('TracerouteVisualization', () => {
  const mockTrace: TraceRoute = {
    id: 'test-trace-1',
    destination: 'google.com',
    startTime: new Date('2023-01-01T10:00:00Z'),
    endTime: new Date('2023-01-01T10:00:05Z'),
    hops: [
      {
        hopNumber: 1,
        ipAddress: '192.168.1.1',
        hostname: 'router.local',
        packets: [
          {
            sequenceNumber: 1,
            responseTime: 1.23,
            timestamp: new Date(),
            ttl: 64,
            packetSize: 64,
            flags: ['DF'],
            checksum: 'abcd',
            identification: 12345,
            type: 8,
            code: 0,
            payload: 'test'
          }
        ],
        averageTime: 1.23,
        minTime: 1.23,
        maxTime: 1.23,
        packetLoss: 0
      },
      {
        hopNumber: 2,
        ipAddress: '8.8.8.8',
        packets: [],
        averageTime: 15.67,
        minTime: 14.23,
        maxTime: 17.89,
        packetLoss: 0,
        location: {
          country: 'US',
          city: 'Mountain View',
          isp: 'Google'
        }
      }
    ],
    status: 'completed',
    totalPackets: 6,
    successfulPackets: 6,
    maxHops: 30,
    packetSize: 64,
    timeout: 5000
  };

  const mockProps = {
    trace: mockTrace,
    showDetails: false,
    onToggleDetails: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders traceroute information', () => {
    render(<TracerouteVisualization {...mockProps} />);
    
    expect(screen.getByText('Traceroute to google.com')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('2 hops')).toBeInTheDocument();
  });

  it('displays hop information', () => {
    render(<TracerouteVisualization {...mockProps} />);
    
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('(router.local)')).toBeInTheDocument();
    expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
  });

  it('shows latency with appropriate colors', () => {
    render(<TracerouteVisualization {...mockProps} />);
    
    const goodLatency = screen.getByText('1.23ms');
    const warningLatency = screen.getByText('15.67ms');
    
    expect(goodLatency).toHaveClass('text-network-success');
    expect(warningLatency).toHaveClass('text-network-warning');
  });

  it('toggles details when button is clicked', async () => {
    const user = userEvent.setup();
    render(<TracerouteVisualization {...mockProps} />);
    
    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);
    
    expect(mockProps.onToggleDetails).toHaveBeenCalled();
  });

  it('shows detailed view when showDetails is true', () => {
    const detailedProps = { ...mockProps, showDetails: true };
    render(<TracerouteVisualization {...detailedProps} />);
    
    const hopElement = screen.getByText('192.168.1.1').closest('div');
    fireEvent.click(hopElement!);
    
    expect(screen.getByText('Timing Statistics')).toBeInTheDocument();
    expect(screen.getByText('Packet Details')).toBeInTheDocument();
  });

  it('shows location information when available', () => {
    const detailedProps = { ...mockProps, showDetails: true };
    render(<TracerouteVisualization {...detailedProps} />);
    
    expect(screen.getByText('Mountain View')).toBeInTheDocument();
  });

  it('displays packet loss when present', () => {
    const traceWithLoss = {
      ...mockTrace,
      hops: [
        {
          ...mockTrace.hops[0],
          packetLoss: 25.5
        }
      ]
    };
    
    render(<TracerouteVisualization {...mockProps} trace={traceWithLoss} />);
    
    expect(screen.getByText('25.5% loss')).toBeInTheDocument();
  });

  it('shows running status with spinner', () => {
    const runningTrace = { ...mockTrace, status: 'running' as const };
    render(<TracerouteVisualization {...mockProps} trace={runningTrace} />);
    
    expect(screen.getByText('Tracing route...')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('handles no response hops', () => {
    const traceWithTimeout = {
      ...mockTrace,
      hops: [
        {
          hopNumber: 1,
          ipAddress: '*',
          packets: [],
          averageTime: 0,
          minTime: 0,
          maxTime: 0,
          packetLoss: 100
        }
      ]
    };
    
    render(<TracerouteVisualization {...mockProps} trace={traceWithTimeout} />);
    
    expect(screen.getByText('No response')).toBeInTheDocument();
  });

  it('shows packet details when hop is selected and details are shown', async () => {
    const user = userEvent.setup();
    const detailedProps = { ...mockProps, showDetails: true };
    render(<TracerouteVisualization {...detailedProps} />);
    
    const firstHop = screen.getByText('192.168.1.1').closest('div');
    await user.click(firstHop!);
    
    expect(screen.getByText('ICMP Type: 8, Code: 0')).toBeInTheDocument();
    expect(screen.getByText('Seq: 1')).toBeInTheDocument();
    expect(screen.getByText('TTL: 64')).toBeInTheDocument();
  });
});