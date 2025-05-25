import React, { useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { TraceRoute, HopData } from '../types/traceroute';
import GraphNode, { GraphNodeData } from './GraphNode'; // Import the custom node
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TracerouteVisualizationProps {
  trace: TraceRoute;
  // showDetails and onToggleDetails might be re-evaluated or removed
  // as tooltips provide much of the detail now.
  // For now, we'll keep them to maintain the parent component's interface.
  showDetails: boolean;
  onToggleDetails: () => void;
}

const nodeTypes = {
  custom: GraphNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 150; // Approximate width for a node, for layout
const NODE_HEIGHT = 100; // Approximate height for a node, for layout

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    // We are shifting the dagre node position (anchor=center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - NODE_WIDTH / 2,
      y: nodeWithPosition.y - NODE_HEIGHT / 2,
    };
    return node;
  });

  return { nodes, edges };
};


export const TracerouteVisualization: React.FC<TracerouteVisualizationProps> = ({
  trace,
  showDetails,
  onToggleDetails
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  useEffect(() => {
    if (!trace || !trace.hops) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes: Node<GraphNodeData>[] = [];
    const newEdges: Edge[] = [];

    // Add a source node (could be 'User' or the actual source IP if available)
    // For now, a conceptual 'Start' node
    const startNodeId = 'start_node';
    newNodes.push({
      id: startNodeId,
      type: 'input', // Or a custom type if we want to style it
      data: { label: 'You', hopNumber: 0 } as any, // Cast to any for simplicity, should match GraphNodeData if custom
      position: { x: 0, y: 0 }, // Position will be updated by layout
      style: { width: 60, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', backgroundColor: '#e0e0e0', borderColor: '#bdbdbd' }
    });


    let prevNodeId = startNodeId;

    trace.hops.forEach((hop, index) => {
      const nodeId = `hop_${hop.hopNumber}`;
      const nodeData: GraphNodeData = {
        ...hop,
        isTarget: false,
        label: hop.hostname || hop.ipAddress,
      };
      newNodes.push({
        id: nodeId,
        type: 'custom',
        data: nodeData,
        position: { x: 0, y: 0 }, // Position will be updated by layout
      });

      newEdges.push({
        id: `edge_${prevNodeId}_${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        animated: trace.status === 'running' && index === trace.hops.length -1, // Animate last edge if running
        style: { stroke: hop.ipAddress === '*' || hop.packetLoss > 0 ? '#f87171' : '#9ca3af' }, // Red for timeout/loss
        markerEnd: { type: MarkerType.ArrowClosed, color: hop.ipAddress === '*' || hop.packetLoss > 0 ? '#f87171' : '#9ca3af' },
      });
      prevNodeId = nodeId;
    });

    // Add the destination node
    const destinationNodeId = `dest_${trace.destination.replace(/[^a-zA-Z0-9]/g, '_')}`;
    // Attempt to find if the last hop is the destination
    const lastHop = trace.hops[trace.hops.length - 1];
    const destNodeData: GraphNodeData = {
      hopNumber: trace.hops.length + 1,
      ipAddress: trace.destination,
      hostname: trace.destination, // Assuming destination is a hostname initially
      packets: lastHop?.ipAddress === trace.destination ? lastHop.packets : [], // Use last hop's packets if it matches dest
      averageTime: lastHop?.ipAddress === trace.destination ? lastHop.averageTime : -1,
      minTime: lastHop?.ipAddress === trace.destination ? lastHop.minTime : -1,
      maxTime: lastHop?.ipAddress === trace.destination ? lastHop.maxTime : -1,
      packetLoss: lastHop?.ipAddress === trace.destination ? lastHop.packetLoss : (lastHop?.ipAddress === '*' ? 100 : 0),
      isTarget: true,
      label: trace.destination,
    };

    newNodes.push({
      id: destinationNodeId,
      type: 'custom',
      data: destNodeData,
      position: { x: 0, y: 0 }, // Position will be updated by layout
    });

    // Connect the last hop to the destination
    if (trace.hops.length > 0) {
      newEdges.push({
        id: `edge_${prevNodeId}_${destinationNodeId}`,
        source: prevNodeId,
        target: destinationNodeId,
        animated: trace.status === 'running',
        style: { stroke: destNodeData.packetLoss > 0 ? '#f87171' : '#9ca3af' },
        markerEnd: { type: MarkerType.ArrowClosed, color: destNodeData.packetLoss > 0 ? '#f87171' : '#9ca3af' },
      });
    } else { // Connect start directly to destination if no hops
       newEdges.push({
        id: `edge_${startNodeId}_${destinationNodeId}`,
        source: startNodeId,
        target: destinationNodeId,
        animated: trace.status === 'running',
        style: { stroke: destNodeData.packetLoss > 0 ? '#f87171' : '#9ca3af' },
        markerEnd: { type: MarkerType.ArrowClosed, color: destNodeData.packetLoss > 0 ? '#f87171' : '#9ca3af' },
      });
    }
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

  }, [trace, setNodes, setEdges]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-network-success';
      case 'running': return 'text-blue-500';
      case 'failed': return 'text-network-error';
      case 'timeout': return 'text-network-timeout';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed': case 'timeout': return <AlertTriangle className="w-4 h-4" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-1 mb-4" style={{ height: 500 }}> {/* Ensure height for ReactFlow */}
      <div className="flex justify-between items-start mb-2 p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Traceroute to {trace.destination}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className={`flex items-center gap-1 ${getStatusColor(trace.status)}`}>
              {getStatusIcon(trace.status)}
              {trace.status}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(trace.startTime).toLocaleString()}
            </span>
            <span>
              {trace.hops.length} hops
            </span>
          </div>
        </div>
        {/* The Show/Hide details button might be less relevant now, or could control something else */}
        <button
          onClick={onToggleDetails}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
      >
        <Controls />
        <Background gap={16} color="#e0e0e0" />
      </ReactFlow>
    </div>
  );
};
