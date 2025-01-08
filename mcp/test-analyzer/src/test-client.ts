import { spawn } from 'child_process';
import { join } from 'path';

const server = spawn('node', [join(process.cwd(), 'build', 'index.js')]);

// Send initialize request
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        call: true,
        list: true
      }
    },
    clientInfo: {
      name: 'Cline',
      version: '3.1.3'
    }
  }
};

// Write the initialize request to the server's stdin
server.stdin.write(JSON.stringify(initializeRequest) + '\n');

// After getting initialize response, send initialized notification
server.stdout.on('data', (data) => {
  const response = data.toString();
  console.log('Server response:', response);
  
  try {
    const parsed = JSON.parse(response);
    if (parsed.id === 1 && parsed.result) {
      // Send initialized notification
      const initializedNotification = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      };
      server.stdin.write(JSON.stringify(initializedNotification) + '\n');
      
      // Mark server as ready
      console.log('Server initialized successfully');
    }
  } catch (err) {
    console.error('Error parsing server response:', err);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server log:', data.toString());
});

// Keep the process alive indefinitely
setInterval(() => {
  // Send ping to keep connection alive
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'ping'
  }) + '\n');
}, 5000);

// Handle shutdown
process.on('SIGINT', () => {
  // Send shutdown request before exiting
  const shutdownRequest = {
    jsonrpc: '2.0',
    id: 999,
    method: 'shutdown'
  };
  server.stdin.write(JSON.stringify(shutdownRequest) + '\n');
  
  // Give server time to shutdown gracefully
  setTimeout(() => {
    server.kill();
    process.exit(0);
  }, 1000);
});
