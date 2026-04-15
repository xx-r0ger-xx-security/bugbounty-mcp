import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { scopeTools } from './tools/scope.js';
import { findingTools } from './tools/findings.js';
import { reconTools } from './tools/recon.js';
import { reportTools } from './tools/report.js';
import { payloadTools } from './tools/payloads.js';

const server = new McpServer({
  name: 'bugbounty-mcp',
  version: '1.0.0',
});

const allTools = [
  ...scopeTools,
  ...findingTools,
  ...reconTools,
  ...reportTools,
  ...payloadTools,
];

for (const tool of allTools) {
  server.tool(tool.name, tool.description, tool.inputSchema.shape, tool.handler);
}

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`bugbounty-mcp running — ${allTools.length} tools registered`);
