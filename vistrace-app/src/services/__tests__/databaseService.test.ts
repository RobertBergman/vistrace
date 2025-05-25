import { databaseService } from '../databaseService';
import { DatabaseConfig, TraceRoute } from '../../types/traceroute';

// Mock pg Client
const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockEnd = jest.fn();

jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    query: mockQuery,
    end: mockEnd
  }))
}));

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockClear();
    mockQuery.mockClear();
    mockEnd.mockClear();
  });

  describe('connect', () => {
    const mockConfig: DatabaseConfig = {
      url: 'postgresql://localhost:5432',
      username: 'testuser',
      password: 'testpass',
      database: 'testdb'
    };

    it('successfully connects to database', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockQuery.mockResolvedValue({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      const result = await databaseService.connect(mockConfig);

      expect(result).toBe(true);
      expect(mockConnect).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS traces'));
    });

    it('handles connection failure', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      const result = await databaseService.connect(mockConfig);

      expect(result).toBe(false);
      expect(databaseService.isDbConnected()).toBe(false);
    });

    it('creates database tables on successful connection', async () => {
      mockConnect.mockResolvedValue(undefined);
      mockQuery.mockResolvedValue({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      await databaseService.connect(mockConfig);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS traces'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS hops'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS packets'));
    });
  });

  describe('isDbConnected', () => {
    it('returns false initially', () => {
      expect(databaseService.isDbConnected()).toBe(false);
    });
  });
});