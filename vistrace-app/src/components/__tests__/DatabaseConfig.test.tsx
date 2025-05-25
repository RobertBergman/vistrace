import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatabaseConfigModal } from '../DatabaseConfig';

describe('DatabaseConfigModal', () => {
  const mockProps = {
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    isConnected: false,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders database configuration form when not connected', () => {
    render(<DatabaseConfigModal {...mockProps} />);
    
    expect(screen.getByText('Database Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('Database URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Database Name')).toBeInTheDocument();
    expect(screen.getByText('Connect to Database')).toBeInTheDocument();
  });

  it('shows connected state when database is connected', () => {
    const connectedProps = { ...mockProps, isConnected: true };
    render(<DatabaseConfigModal {...connectedProps} />);
    
    expect(screen.getByText('Connected to PostgreSQL database')).toBeInTheDocument();
    expect(screen.getByText('Disconnect Database')).toBeInTheDocument();
  });

  it('calls onConnect with form data when form is submitted', async () => {
    const user = userEvent.setup();
    mockProps.onConnect.mockResolvedValue(true);
    
    render(<DatabaseConfigModal {...mockProps} />);
    
    await user.type(screen.getByLabelText('Database URL'), 'postgresql://localhost:5432');
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'testpass');
    await user.type(screen.getByLabelText('Database Name'), 'testdb');
    
    const submitButton = screen.getByText('Connect to Database');
    await user.click(submitButton);
    
    expect(mockProps.onConnect).toHaveBeenCalledWith({
      url: 'postgresql://localhost:5432',
      username: 'testuser',
      password: 'testpass',
      database: 'testdb'
    });
  });

  it('shows error message when connection fails', async () => {
    const user = userEvent.setup();
    mockProps.onConnect.mockResolvedValue(false);
    
    render(<DatabaseConfigModal {...mockProps} />);
    
    await user.type(screen.getByLabelText('Database URL'), 'invalid-url');
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'testpass');
    
    const submitButton = screen.getByText('Connect to Database');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to connect to database. Please check your credentials.')).toBeInTheDocument();
    });
  });

  it('shows loading state during connection attempt', async () => {
    const user = userEvent.setup();
    mockProps.onConnect.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
    render(<DatabaseConfigModal {...mockProps} />);
    
    await user.type(screen.getByLabelText('Database URL'), 'postgresql://localhost:5432');
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'testpass');
    
    const submitButton = screen.getByText('Connect to Database');
    await user.click(submitButton);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls onDisconnect when disconnect button is clicked', async () => {
    const user = userEvent.setup();
    const connectedProps = { ...mockProps, isConnected: true };
    render(<DatabaseConfigModal {...connectedProps} />);
    
    const disconnectButton = screen.getByText('Disconnect Database');
    await user.click(disconnectButton);
    
    expect(mockProps.onDisconnect).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<DatabaseConfigModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('prevents submission with empty required fields', async () => {
    const user = userEvent.setup();
    render(<DatabaseConfigModal {...mockProps} />);
    
    const submitButton = screen.getByText('Connect to Database');
    await user.click(submitButton);
    
    expect(mockProps.onConnect).not.toHaveBeenCalled();
  });

  it('shows information about local storage fallback', () => {
    render(<DatabaseConfigModal {...mockProps} />);
    
    expect(screen.getByText(/If database connection fails, traceroute data will be stored in local memory/)).toBeInTheDocument();
  });

  it('shows information about automatic database creation', () => {
    render(<DatabaseConfigModal {...mockProps} />);
    
    expect(screen.getByText(/A new database will be created if it doesn't exist/)).toBeInTheDocument();
  });
});