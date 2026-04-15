/**
 * Recon tool wrappers.
 * Each tool shells out to a well-known CLI tool if installed,
 * or returns a clear "tool not installed" error with install instructions.
 * Outputs are structured JSON so they can be chained in future agentic pipelines.
 */

import { z } from 'zod';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function runTool(cmd, args) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { timeout: 60000 });
    return { success: true, output: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { success: false, error: `'${cmd}' not found. Install it and ensure it's on PATH.` };
    }
    return { success: false, error: err.message, stdout: err.stdout, stderr: err.stderr };
  }
}

function parseLines(output) {
  return output.split('\n').map(l => l.trim()).filter(Boolean);
}

export const reconTools = [
  {
    name: 'recon_subdomains',
    description: 'Enumerate subdomains for a domain using subfinder. Returns a structured list.',
    inputSchema: z.object({
      domain: z.string().describe('Target domain, e.g. "acme.com"'),
      silent: z.boolean().optional().default(true),
    }),
    handler: async ({ domain, silent }) => {
      const args = ['-d', domain];
      if (silent) args.push('-silent');
      const result = await runTool('subfinder', args);
      if (!result.success) return result;
      const subdomains = parseLines(result.output);
      return { success: true, domain, count: subdomains.length, subdomains };
    },
  },
  {
    name: 'recon_probe',
    description: 'Probe a list of hosts/subdomains for live HTTP/HTTPS services using httpx.',
    inputSchema: z.object({
      hosts: z.array(z.string()).describe('List of hostnames or IPs to probe'),
      timeout: z.number().optional().default(10).describe('Timeout per host in seconds'),
    }),
    handler: async ({ hosts, timeout }) => {
      // httpx reads targets from stdin when passed -l -
      const { execFile } = await import('child_process');
      return new Promise((resolve) => {
        const proc = execFile(
          'httpx',
          ['-silent', '-status-code', '-title', '-tech-detect', '-json', `-timeout`, String(timeout)],
          { timeout: 120000 },
          (err, stdout, stderr) => {
            if (err && !stdout) {
              if (err.code === 'ENOENT') {
                return resolve({ success: false, error: "'httpx' not found. Install projectdiscovery/httpx." });
              }
              return resolve({ success: false, error: err.message });
            }
            const results = stdout.trim().split('\n').filter(Boolean).map(line => {
              try { return JSON.parse(line); } catch { return { raw: line }; }
            });
            resolve({ success: true, count: results.length, results });
          }
        );
        proc.stdin.write(hosts.join('\n'));
        proc.stdin.end();
      });
    },
  },
  {
    name: 'recon_portscan',
    description: 'Run a fast port scan against a host using nmap.',
    inputSchema: z.object({
      host: z.string().describe('IP or hostname'),
      ports: z.string().optional().default('top1000').describe('Port range, e.g. "80,443,8080" or "1-65535"'),
      fast: z.boolean().optional().default(true).describe('Use -T4 timing (faster)'),
    }),
    handler: async ({ host, ports, fast }) => {
      const args = ['-sV', '--open', '-oG', '-'];
      if (fast) args.push('-T4');
      if (ports === 'top1000') {
        args.push('--top-ports', '1000');
      } else {
        args.push('-p', ports);
      }
      args.push(host);
      const result = await runTool('nmap', args);
      if (!result.success) return result;
      // Parse open ports from grepable output
      const openPorts = [];
      for (const line of parseLines(result.output)) {
        const m = line.match(/Ports:\s+(.+)/);
        if (m) {
          m[1].split(',').forEach(entry => {
            const parts = entry.trim().split('/');
            if (parts[1] === 'open') {
              openPorts.push({ port: parseInt(parts[0]), protocol: parts[2], service: parts[4], version: parts[6] });
            }
          });
        }
      }
      return { success: true, host, openPorts, raw: result.output };
    },
  },
  {
    name: 'recon_nuclei',
    description: 'Run nuclei vulnerability scanner against a target URL.',
    inputSchema: z.object({
      target: z.string().describe('Target URL, e.g. "https://acme.com"'),
      tags: z.array(z.string()).optional().describe('Nuclei template tags, e.g. ["cve","xss","sqli"]'),
      severity: z.array(z.enum(['critical','high','medium','low','info'])).optional(),
    }),
    handler: async ({ target, tags, severity }) => {
      const args = ['-u', target, '-json', '-silent'];
      if (tags && tags.length) args.push('-tags', tags.join(','));
      if (severity && severity.length) args.push('-severity', severity.join(','));
      const result = await runTool('nuclei', args);
      if (!result.success) return result;
      const findings = parseLines(result.output).map(line => {
        try { return JSON.parse(line); } catch { return { raw: line }; }
      });
      return { success: true, target, count: findings.length, findings };
    },
  },
  {
    name: 'recon_ffuf',
    description: 'Run directory/endpoint fuzzing against a target URL using ffuf.',
    inputSchema: z.object({
      url: z.string().describe('Target URL with FUZZ keyword, e.g. "https://acme.com/FUZZ"'),
      wordlist: z.string().describe('Path to wordlist file'),
      extensions: z.string().optional().describe('Comma-separated extensions, e.g. "php,html,js"'),
      filterCode: z.string().optional().default('404').describe('HTTP status codes to filter out'),
    }),
    handler: async ({ url, wordlist, extensions, filterCode }) => {
      const args = ['-u', url, '-w', wordlist, '-json', '-fc', filterCode];
      if (extensions) args.push('-e', extensions);
      const result = await runTool('ffuf', args);
      if (!result.success) return result;
      try {
        const parsed = JSON.parse(result.output);
        return { success: true, url, count: parsed.results?.length ?? 0, results: parsed.results };
      } catch {
        return { success: true, url, raw: result.output };
      }
    },
  },
  {
    name: 'recon_whois',
    description: 'Run a WHOIS lookup on a domain or IP.',
    inputSchema: z.object({
      target: z.string().describe('Domain or IP'),
    }),
    handler: async ({ target }) => {
      const result = await runTool('whois', [target]);
      return result;
    },
  },
];
