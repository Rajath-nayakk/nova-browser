import net from 'net';

/**
 * Tests TCP socket reachability to local Tor SOCKS proxy.
 */
export function checkTorSocksConnectivity(
  port = 9050,
  host = '127.0.0.1',
  timeoutMs = 2000
): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const latencyMs = Date.now() - startTime;
      socket.destroy();
      resolve({ connected: true, latencyMs });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ connected: false, error: `Connection timed out after ${timeoutMs}ms` });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ connected: false, error: err.message || 'Tor SOCKS proxy connection refused' });
    });

    try {
      socket.connect(port, host);
    } catch (err: any) {
      resolve({ connected: false, error: err?.message || 'Failed to initiate socket connection' });
    }
  });
}
