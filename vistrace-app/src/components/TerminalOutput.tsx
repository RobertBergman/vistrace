import React, { useState, useEffect, useRef } from 'react';
import { TraceRoute, HopData } from '../types/traceroute';

interface TerminalOutputProps {
  trace: TraceRoute | null;
  isActive: boolean;
}

interface OutputLine {
  id: string;
  text: string;
  type: 'command' | 'output' | 'error' | 'info';
  timestamp: Date;
  isTyping?: boolean;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ trace, isActive }) => {
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [currentHop, setCurrentHop] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  useEffect(() => {
    if (!trace) return;

    if (trace.status === 'running' && outputLines.length === 0) {
      const commandLine: OutputLine = {
        id: `cmd-${trace.id}`,
        text: `traceroute ${trace.destination}`,
        type: 'command',
        timestamp: trace.startTime,
        isTyping: true
      };

      const infoLine: OutputLine = {
        id: `info-${trace.id}`,
        text: `traceroute to ${trace.destination} (${trace.destination}), ${trace.maxHops} hops max, ${trace.packetSize} byte packets`,
        type: 'info',
        timestamp: trace.startTime
      };

      setOutputLines([commandLine, infoLine]);
      setCurrentHop(0);
    }

    if (trace.hops.length > currentHop) {
      const hop = trace.hops[currentHop];
      addHopOutput(hop);
      setCurrentHop(currentHop + 1);
    }

    if (trace.status === 'completed' || trace.status === 'failed') {
      const endLine: OutputLine = {
        id: `end-${trace.id}`,
        text: trace.status === 'completed' 
          ? `\nTrace complete.`
          : `\nTrace failed or timed out.`,
        type: trace.status === 'completed' ? 'info' : 'error',
        timestamp: trace.endTime || new Date()
      };

      setOutputLines(prev => [...prev, endLine]);
    }
  }, [trace, currentHop, outputLines.length]);

  const addHopOutput = (hop: HopData) => {
    const hopLines: OutputLine[] = [];

    // Format hop output similar to real traceroute
    const hopNumber = hop.hopNumber.toString().padStart(2, ' ');
    let hopText = `${hopNumber}  `;

    if (hop.ipAddress === '*') {
      hopText += '* * *';
    } else {
      // Show hostname if available
      if (hop.hostname && hop.hostname !== hop.ipAddress) {
        hopText += `${hop.hostname} (${hop.ipAddress})`;
      } else {
        hopText += hop.ipAddress;
      }

      // Add timing information
      const timings = hop.packets
        .slice(0, 3)
        .map(p => `${p.responseTime.toFixed(3)} ms`)
        .join('  ');
      
      hopText += `  ${timings}`;

      // Add location info if available
      if (hop.location?.city) {
        hopText += `  [${hop.location.city}]`;
      }
    }

    hopLines.push({
      id: `hop-${hop.hopNumber}`,
      text: hopText,
      type: 'output',
      timestamp: new Date(),
      isTyping: true
    });

    // Add packet loss warning if any
    if (hop.packetLoss > 0) {
      hopLines.push({
        id: `loss-${hop.hopNumber}`,
        text: `     ${hop.packetLoss.toFixed(1)}% packet loss`,
        type: 'error',
        timestamp: new Date()
      });
    }

    setTimeout(() => {
      setOutputLines(prev => [...prev, ...hopLines]);
    }, Math.random() * 500 + 200); // Simulate network delay
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'command':
        return 'text-terminal-cyan';
      case 'output':
        return 'text-terminal-text';
      case 'error':
        return 'text-terminal-red';
      case 'info':
        return 'text-terminal-yellow';
      default:
        return 'text-terminal-white';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="bg-terminal-bg border border-terminal-gray rounded-lg overflow-hidden">
      <div className="bg-terminal-bg-secondary px-4 py-2 border-b border-terminal-gray">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-terminal-red"></div>
              <div className="w-3 h-3 rounded-full bg-terminal-yellow"></div>
              <div className="w-3 h-3 rounded-full bg-terminal-text"></div>
            </div>
            <span className="text-terminal-white text-sm font-mono">Terminal</span>
          </div>
          <div className="text-terminal-gray text-xs font-mono">
            {trace && formatTimestamp(trace.startTime)}
          </div>
        </div>
      </div>

      <div 
        ref={outputRef}
        className="h-96 overflow-y-auto p-4 font-mono text-sm leading-relaxed bg-terminal-bg scrollbar-thin scrollbar-thumb-terminal-gray scrollbar-track-transparent"
      >
        {outputLines.length === 0 && !trace && (
          <div className="text-terminal-text-dim">
            <span className="text-terminal-cyan">$</span> Waiting for traceroute command...
            <span className="animate-blink">_</span>
          </div>
        )}

        {outputLines.map((line, index) => (
          <div key={line.id} className="mb-1">
            {line.type === 'command' && (
              <span className="text-terminal-cyan">$ </span>
            )}
            <span className={getLineColor(line.type)}>
              {line.isTyping ? (
                <TypewriterText text={line.text} speed={50} />
              ) : (
                line.text
              )}
            </span>
          </div>
        ))}

        {isActive && trace?.status === 'running' && (
          <div className="text-terminal-text-dim">
            <span className="animate-blink">_</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface TypewriterTextProps {
  text: string;
  speed: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && <span className="animate-blink">_</span>}
    </span>
  );
};