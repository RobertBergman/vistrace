import React, { useState, useRef, useEffect } from 'react';
import { TracerouteOptions } from '../types/traceroute';

interface TerminalInputProps {
  onStartTrace: (destination: string, options: Partial<TracerouteOptions>) => void;
  onStopTrace: () => void;
  onClear: () => void;
  isActive: boolean;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  onStartTrace,
  onStopTrace,
  onClear,
  isActive
}) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input.trim());
      setCommandHistory(prev => [...prev, input]);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete common commands
      const commands = ['traceroute', 'ping', 'clear', 'stop', 'help'];
      const matches = commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      }
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (isActive) {
        onStopTrace();
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      onClear();
    }
  };

  const handleCommand = (command: string) => {
    if (!command) return;

    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'traceroute':
      case 'tracert':
      case 'tr':
        if (args.length === 0) {
          // Show help
          return;
        }
        handleTraceroute(args);
        break;
      
      case 'ping':
        // Convert ping to traceroute for this demo
        if (args.length > 0) {
          handleTraceroute(args);
        }
        break;
      
      case 'stop':
      case 'quit':
      case 'exit':
        onStopTrace();
        break;
      
      case 'clear':
      case 'cls':
        onClear();
        break;
      
      case 'help':
      case '?':
        showHelp();
        break;
      
      default:
        // Try to parse as hostname/IP if it looks like one
        if (isValidHostname(command)) {
          handleTraceroute([command]);
        }
        break;
    }
  };

  const handleTraceroute = (args: string[]) => {
    const destination = args[0];
    const options: Partial<TracerouteOptions> = {
      maxHops: 30,
      packetSize: 64,
      timeout: 5000,
      queries: 3,
      useIPv6: false,
      dontFragment: true,
      packetType: 'icmp'
    };

    // Parse additional arguments
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '-m' && i + 1 < args.length) {
        // Max hops
        options.maxHops = parseInt(args[i + 1]) || 30;
        i++;
      } else if (arg === '-q' && i + 1 < args.length) {
        // Queries per hop
        options.queries = parseInt(args[i + 1]) || 3;
        i++;
      } else if (arg === '-w' && i + 1 < args.length) {
        // Timeout
        options.timeout = (parseInt(args[i + 1]) || 5) * 1000;
        i++;
      } else if (arg === '-6') {
        options.useIPv6 = true;
      } else if (arg === '-I') {
        options.packetType = 'icmp';
      } else if (arg === '-U') {
        options.packetType = 'udp';
      } else if (arg === '-T') {
        options.packetType = 'tcp';
      }
    }

    onStartTrace(destination, options);
  };

  const isValidHostname = (str: string): boolean => {
    // Basic hostname/IP validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-.]*[a-zA-Z0-9]$/;
    
    return ipv4Regex.test(str) || hostnameRegex.test(str);
  };

  const showHelp = () => {
    // This would be handled by the parent component
    console.log('Help requested');
  };

  return (
    <div className="bg-terminal-bg border-t border-terminal-gray">
      <div className="p-4">
        <div className="flex items-center font-mono text-sm">
          <span className="text-terminal-cyan select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 ml-2 terminal-input text-terminal-text font-mono"
            placeholder="traceroute google.com"
            disabled={isActive}
            spellCheck={false}
            autoComplete="off"
          />
          {!isActive && (
            <span className="text-terminal-text animate-blink">_</span>
          )}
        </div>
        
        <div className="mt-2 text-xs text-terminal-gray font-mono">
          <div className="flex flex-wrap gap-4">
            <span>Commands: traceroute, ping, clear, stop, help</span>
            <span>Shortcuts: Ctrl+C (stop), Ctrl+L (clear), Tab (autocomplete)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
