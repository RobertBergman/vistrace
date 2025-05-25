import { tracerouteService } from '../tracerouteService';
import { TracerouteOptions } from '../../types/traceroute';

describe('TracerouteService', () => {
  beforeEach(() => {
    tracerouteService.getAllTraces().forEach(trace => {
      tracerouteService.clearTrace(trace.id);
    });
  });

  describe('startTraceroute', () => {
    it('creates a new traceroute with default options', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      
      expect(traceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
      
      const trace = tracerouteService.getTrace(traceId);
      expect(trace).toBeDefined();
      expect(trace?.destination).toBe('google.com');
      expect(trace?.status).toBe('running');
      expect(trace?.maxHops).toBe(30);
      expect(trace?.packetSize).toBe(64);
      expect(trace?.timeout).toBe(5000);
    });

    it('applies custom options', async () => {
      const options: Partial<TracerouteOptions> = {
        maxHops: 20,
        packetSize: 128,
        timeout: 3000,
        queries: 5
      };

      const traceId = await tracerouteService.startTraceroute('example.com', options);
      const trace = tracerouteService.getTrace(traceId);
      
      expect(trace?.maxHops).toBe(20);
      expect(trace?.packetSize).toBe(128);
      expect(trace?.timeout).toBe(3000);
    });

    it('starts trace with running status', async () => {
      const traceId = await tracerouteService.startTraceroute('test.com');
      const trace = tracerouteService.getTrace(traceId);
      
      expect(trace?.status).toBe('running');
      expect(trace?.startTime).toBeInstanceOf(Date);
      expect(trace?.endTime).toBeUndefined();
    });
  });

  describe('getTrace', () => {
    it('returns undefined for non-existent trace', () => {
      const trace = tracerouteService.getTrace('non-existent-id');
      expect(trace).toBeUndefined();
    });

    it('returns existing trace', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      const trace = tracerouteService.getTrace(traceId);
      
      expect(trace).toBeDefined();
      expect(trace?.id).toBe(traceId);
    });
  });

  describe('getAllTraces', () => {
    it('returns empty array when no traces exist', () => {
      const traces = tracerouteService.getAllTraces();
      expect(traces).toEqual([]);
    });

    it('returns all active traces', async () => {
      const traceId1 = await tracerouteService.startTraceroute('google.com');
      const traceId2 = await tracerouteService.startTraceroute('example.com');
      
      const traces = tracerouteService.getAllTraces();
      expect(traces).toHaveLength(2);
      expect(traces.map(t => t.id)).toContain(traceId1);
      expect(traces.map(t => t.id)).toContain(traceId2);
    });
  });

  describe('stopTrace', () => {
    it('stops a running trace', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      
      tracerouteService.stopTrace(traceId);
      
      const trace = tracerouteService.getTrace(traceId);
      expect(trace?.status).toBe('timeout');
      expect(trace?.endTime).toBeInstanceOf(Date);
    });

    it('does not affect non-existent trace', () => {
      expect(() => {
        tracerouteService.stopTrace('non-existent-id');
      }).not.toThrow();
    });

    it('does not stop already completed trace', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      
      // Wait for trace to potentially complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const traceBefore = tracerouteService.getTrace(traceId);
      tracerouteService.stopTrace(traceId);
      const traceAfter = tracerouteService.getTrace(traceId);
      
      if (traceBefore?.status !== 'running') {
        expect(traceAfter?.status).toBe(traceBefore?.status);
      }
    });
  });

  describe('clearTrace', () => {
    it('removes trace from storage', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      
      expect(tracerouteService.getTrace(traceId)).toBeDefined();
      
      tracerouteService.clearTrace(traceId);
      
      expect(tracerouteService.getTrace(traceId)).toBeUndefined();
    });

    it('does not affect other traces', async () => {
      const traceId1 = await tracerouteService.startTraceroute('google.com');
      const traceId2 = await tracerouteService.startTraceroute('example.com');
      
      tracerouteService.clearTrace(traceId1);
      
      expect(tracerouteService.getTrace(traceId1)).toBeUndefined();
      expect(tracerouteService.getTrace(traceId2)).toBeDefined();
    });
  });

  describe('memory management', () => {
    it('limits stored traces to prevent memory overflow', async () => {
      // Create more traces than the limit (assuming limit is 100)
      const traceIds = [];
      for (let i = 0; i < 105; i++) {
        const traceId = await tracerouteService.startTraceroute(`test${i}.com`);
        traceIds.push(traceId);
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const allTraces = tracerouteService.getAllTraces();
      expect(allTraces.length).toBeLessThanOrEqual(100);
      
      // Newest traces should still exist
      const newestTraceIds = traceIds.slice(-50);
      newestTraceIds.forEach(traceId => {
        expect(tracerouteService.getTrace(traceId)).toBeDefined();
      });
    });
  });

  describe('trace completion', () => {
    it('eventually completes trace', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      
      // Wait for trace to complete (mock implementation should be fast)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const trace = tracerouteService.getTrace(traceId);
      expect(trace?.status).toMatch(/^(completed|failed|timeout)$/);
      expect(trace?.endTime).toBeInstanceOf(Date);
    });

    it('generates hop data during trace', async () => {
      const traceId = await tracerouteService.startTraceroute('google.com');
      
      // Wait for some hops to be generated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const trace = tracerouteService.getTrace(traceId);
      expect(trace?.hops.length).toBeGreaterThan(0);
      
      const firstHop = trace?.hops[0];
      expect(firstHop?.hopNumber).toBe(1);
      expect(firstHop?.packets.length).toBeGreaterThan(0);
      expect(firstHop?.averageTime).toBeGreaterThan(0);
    });
  });
});