import { z } from 'zod';
import { getFindings, addFinding, updateFinding } from '../store/db.js';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const STATUSES = ['open', 'in-progress', 'submitted', 'triaged', 'resolved', 'duplicate', 'n/a'];

export const findingTools = [
  {
    name: 'finding_add',
    description: 'Log a new vulnerability finding.',
    inputSchema: z.object({
      program: z.string().describe('Program name'),
      title: z.string().describe('Short title, e.g. "Reflected XSS on /search"'),
      severity: z.enum(SEVERITIES),
      type: z.string().describe('Vuln class, e.g. "XSS", "IDOR", "SSRF"'),
      url: z.string().describe('Affected URL or endpoint'),
      description: z.string().describe('What you found and how'),
      impact: z.string().optional().describe('Business/security impact'),
      steps: z.array(z.string()).optional().describe('Reproduction steps'),
    }),
    handler: async (args) => {
      const entry = addFinding(args);
      return { success: true, entry };
    },
  },
  {
    name: 'finding_list',
    description: 'List findings, optionally filtered by program, severity, or status.',
    inputSchema: z.object({
      program: z.string().optional(),
      severity: z.enum(SEVERITIES).optional(),
      status: z.enum(STATUSES).optional(),
    }),
    handler: async (filters) => {
      const findings = getFindings(filters);
      return { count: findings.length, findings };
    },
  },
  {
    name: 'finding_update',
    description: 'Update the status or details of an existing finding.',
    inputSchema: z.object({
      id: z.string().describe('Finding ID'),
      status: z.enum(STATUSES).optional(),
      notes: z.string().optional().describe('Additional notes to append'),
      bounty: z.number().optional().describe('Bounty amount received (USD)'),
    }),
    handler: async ({ id, ...updates }) => {
      const entry = updateFinding(id, updates);
      return { success: true, entry };
    },
  },
];
