import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TracerouteControl } from '../TracerouteControl';

describe('TracerouteControl', () => {
  const mockProps = {
    onStartTrace: jest.fn(),
    onStopTrace: jest.fn(),
    activeTraces: [],
    onShowSettings: jest.fn(),
    onShowDatabase: jest.fn(),
    isDbConnected: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders traceroute control form', () => {
    render(<TracerouteControl {...mockProps} />);
    
    expect(screen.getByText('Traceroute Control')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter hostname or IP address/)).toBeInTheDocument();
    expect(screen.getByText('Start Trace')).toBeInTheDocument();
  });

  it('starts traceroute with destination', async () => {
    const user = userEvent.setup();
    render(<TracerouteControl {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/Enter hostname or IP address/);
    const button = screen.getByText('Start Trace');
    
    await user.type(input, 'google.com');
    await user.click(button);
    
    expect(mockProps.onStartTrace).toHaveBeenCalledWith('google.com', expect.any(Object));
  });

  it('disables start button when no destination is entered', () => {
    render(<TracerouteControl {...mockProps} />);
    
    const button = screen.getByText('Start Trace');
    expect(button).toBeDisabled();
  });

  it('shows advanced options when toggled', async () => {
    const user = userEvent.setup();
    render(<TracerouteControl {...mockProps} />);
    
    const advancedToggle = screen.getByText('Show Advanced Options');
    await user.click(advancedToggle);
    
    expect(screen.getByText('Max Hops')).toBeInTheDocument();
    expect(screen.getByText('Packet Size (bytes)')).toBeInTheDocument();
    expect(screen.getByText('Timeout (ms)')).toBeInTheDocument();
  });

  it('shows active traces and stop all button', () => {
    const propsWithActiveTraces = {
      ...mockProps,
      activeTraces: ['trace1', 'trace2']
    };
    
    render(<TracerouteControl {...propsWithActiveTraces} />);
    
    expect(screen.getByText('2 active traces')).toBeInTheDocument();
    expect(screen.getByText('Stop All')).toBeInTheDocument();
  });

  it('calls onStopTrace for all active traces when Stop All is clicked', async () => {
    const user = userEvent.setup();
    const propsWithActiveTraces = {
      ...mockProps,
      activeTraces: ['trace1', 'trace2']
    };
    
    render(<TracerouteControl {...propsWithActiveTraces} />);
    
    const stopAllButton = screen.getByText('Stop All');
    await user.click(stopAllButton);
    
    expect(mockProps.onStopTrace).toHaveBeenCalledTimes(2);
    expect(mockProps.onStopTrace).toHaveBeenCalledWith('trace1');
    expect(mockProps.onStopTrace).toHaveBeenCalledWith('trace2');
  });

  it('shows database connected status', () => {
    const propsWithDb = {
      ...mockProps,
      isDbConnected: true
    };
    
    render(<TracerouteControl {...propsWithDb} />);
    
    const dbButton = screen.getByTitle('Database Connected');
    expect(dbButton).toHaveClass('text-network-success');
  });

  it('calls onShowDatabase when database button is clicked', async () => {
    const user = userEvent.setup();
    render(<TracerouteControl {...mockProps} />);
    
    const dbButton = screen.getByTitle('Database Settings');
    await user.click(dbButton);
    
    expect(mockProps.onShowDatabase).toHaveBeenCalled();
  });

  it('updates advanced options when changed', async () => {
    const user = userEvent.setup();
    render(<TracerouteControl {...mockProps} />);
    
    const advancedToggle = screen.getByText('Show Advanced Options');
    await user.click(advancedToggle);
    
    const maxHopsInput = screen.getByDisplayValue('30');
    await user.clear(maxHopsInput);
    await user.type(maxHopsInput, '20');
    
    const input = screen.getByPlaceholderText(/Enter hostname or IP address/);
    const button = screen.getByText('Start Trace');
    
    await user.type(input, 'example.com');
    await user.click(button);
    
    expect(mockProps.onStartTrace).toHaveBeenCalledWith('example.com', 
      expect.objectContaining({ maxHops: 20 })
    );
  });
});