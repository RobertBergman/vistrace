import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TraceRoute, HopData } from '../types/traceroute';

interface NetworkTopologyProps {
  trace: TraceRoute | null;
}

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'source' | 'hop' | 'destination';
  hop?: HopData;
  isActive: boolean;
}

interface Connection {
  from: string;
  to: string;
  latency: number;
  isActive: boolean;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({ trace }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [animationFrame, setAnimationFrame] = useState(0);

  const drawTopology = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw connections
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return;

      ctx.strokeStyle = connection.isActive ? '#00ff00' : '#004400';
      ctx.lineWidth = connection.isActive ? 2 : 1;
      ctx.setLineDash(connection.isActive ? [] : [5, 5]);

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();

      // Draw latency label
      if (connection.latency > 0) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2 - 10;
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '10px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${connection.latency.toFixed(1)}ms`, midX, midY);
      }

      // Animated packet flow
      if (connection.isActive) {
        const progress = (animationFrame * 0.05) % 1;
        const packetX = fromNode.x + (toNode.x - fromNode.x) * progress;
        const packetY = fromNode.y + (toNode.y - fromNode.y) * progress;

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      // Node circle
      ctx.fillStyle = getNodeColor(node);
      ctx.strokeStyle = node.isActive ? '#ffffff' : '#666666';
      ctx.lineWidth = node.isActive ? 2 : 1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, getNodeRadius(node), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Consolas, monospace';
      ctx.textAlign = 'center';
      
      // Truncate long labels
      let label = node.label;
      if (label.length > 15) {
        label = label.substring(0, 12) + '...';
      }
      
      ctx.fillText(label, node.x, node.y + getNodeRadius(node) + 20);

      // Additional info for hops
      if (node.hop) {
        ctx.font = '10px Consolas, monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(`Hop ${node.hop.hopNumber}`, node.x, node.y + getNodeRadius(node) + 35);
        
        if (node.hop.location?.city) {
          ctx.fillText(node.hop.location.city, node.x, node.y + getNodeRadius(node) + 50);
        }
      }

      // Pulsing effect for active nodes
      if (node.isActive) {
        const pulse = Math.sin(animationFrame * 0.1) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, getNodeRadius(node) + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }, [nodes, connections, animationFrame]); // Added animationFrame as it's used in drawTopology

  useEffect(() => {
    if (!trace) {
      setNodes([]);
      setConnections([]);
      return;
    }

    const newNodes: Node[] = [];
    const newConnections: Connection[] = [];

    // Source node
    newNodes.push({
      id: 'source',
      x: 50,
      y: 200,
      label: 'Source',
      type: 'source',
      isActive: true
    });

    // Hop nodes
    trace.hops.forEach((hop, index) => {
      const x = 150 + (index * 120);
      const y = 200 + (Math.sin(index * 0.5) * 80);
      
      newNodes.push({
        id: `hop-${hop.hopNumber}`,
        x,
        y,
        label: hop.hostname || hop.ipAddress,
        type: 'hop',
        hop,
        isActive: trace.status === 'running' && index <= trace.hops.length - 1
      });

      // Connection from previous node
      const fromId = index === 0 ? 'source' : `hop-${trace.hops[index - 1].hopNumber}`;
      newConnections.push({
        from: fromId,
        to: `hop-${hop.hopNumber}`,
        latency: hop.averageTime,
        isActive: trace.status === 'running' && index <= trace.hops.length - 1
      });
    });

    // Destination node (if trace is complete)
    if (trace.status === 'completed' && trace.hops.length > 0) {
      const lastHop = trace.hops[trace.hops.length - 1];
      if (lastHop.ipAddress === trace.destination || lastHop.hostname === trace.destination) {
        // Last hop is destination
        const lastNode = newNodes[newNodes.length - 1];
        lastNode.type = 'destination';
        lastNode.label = trace.destination;
      } else {
        // Add separate destination node
        newNodes.push({
          id: 'destination',
          x: 150 + (trace.hops.length * 120),
          y: 200,
          label: trace.destination,
          type: 'destination',
          isActive: true
        });

        newConnections.push({
          from: `hop-${trace.hops[trace.hops.length - 1].hopNumber}`,
          to: 'destination',
          latency: 0,
          isActive: true
        });
      }
    }

    setNodes(newNodes);
    setConnections(newConnections);
  }, [trace]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      drawTopology(ctx, canvas.width, canvas.height);
      setAnimationFrame(prev => prev + 1);
      requestAnimationFrame(animate);
    };

    // Start animation
    const animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => cancelAnimationFrame(animationId);
  }, [nodes, connections, drawTopology]); // Added drawTopology to dependencies

  const getNodeColor = useCallback((node: Node): string => {
    switch (node.type) {
      case 'source':
        return '#0066ff';
      case 'destination':
        return '#ff0066';
      case 'hop':
        if (node.hop) {
          if (node.hop.packetLoss > 0) return '#ff6600';
          if (node.hop.averageTime > 150) return '#ffff00';
          return '#00ff00';
        }
        return '#666666';
      default:
        return '#666666';
    }
  }, []);

  const getNodeRadius = (node: Node): number => {
    switch (node.type) {
      case 'source':
      case 'destination':
        return 15;
      case 'hop':
        return 12;
      default:
        return 8;
    }
  };

  const handleCanvasResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  };

  useEffect(() => {
    handleCanvasResize();
    window.addEventListener('resize', handleCanvasResize);
    return () => window.removeEventListener('resize', handleCanvasResize);
  }, []);

  return (
    <div className="bg-terminal-bg border border-terminal-gray rounded-lg overflow-hidden">
      <div className="bg-terminal-bg-secondary px-4 py-2 border-b border-terminal-gray">
        <h3 className="text-terminal-white font-mono text-sm">Network Topology</h3>
      </div>
      
      <div className="relative h-64">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: '#0a0a0a' }}
        />
        
        {!trace && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-terminal-gray font-mono text-sm">
              Start a traceroute to visualize network topology
            </div>
          </div>
        )}
      </div>

      <div className="bg-terminal-bg-secondary px-4 py-2 border-t border-terminal-gray">
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-terminal-white">Source</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-terminal-white">Good Latency</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-terminal-white">High Latency</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-terminal-white">Packet Loss</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-terminal-white">Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
};
