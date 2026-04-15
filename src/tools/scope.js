import { z } from 'zod';
import { getScopes, addScope, removeScope } from '../store/db.js';

export const scopeTools = [
  {
    name: 'scope_add',
    description: 'Add a target to the in-scope list for a bug bounty program.',
    inputSchema: z.object({
      program: z.string().describe('Program name, e.g. "Acme HackerOne"'),
      target: z.string().describe('Domain, IP, or wildcard, e.g. "*.acme.com"'),
      type: z.enum(['domain', 'ip', 'wildcard', 'url', 'mobile']).describe('Target type'),
      notes: z.string().optional().describe('Optional notes'),
    }),
    handler: async ({ program, target, type, notes }) => {
      const entry = addScope({ program, target, type, notes });
      return { success: true, entry };
    },
  },
  {
    name: 'scope_list',
    description: 'List all in-scope targets, optionally filtered by program.',
    inputSchema: z.object({
      program: z.string().optional().describe('Filter by program name'),
    }),
    handler: async ({ program }) => {
      let scopes = getScopes();
      if (program) scopes = scopes.filter(s => s.program === program);
      return { count: scopes.length, scopes };
    },
  },
  {
    name: 'scope_check',
    description: 'Check whether a given target is in scope for any program.',
    inputSchema: z.object({
      target: z.string().describe('Domain or IP to check'),
    }),
    handler: async ({ target }) => {
      const scopes = getScopes();
      const matches = scopes.filter(s => {
        if (s.type === 'wildcard') {
          const base = s.target.replace('*.', '');
          return target === base || target.endsWith(`.${base}`);
        }
        return s.target === target;
      });
      return { inScope: matches.length > 0, matches };
    },
  },
  {
    name: 'scope_remove',
    description: 'Remove a target from the scope list by its ID.',
    inputSchema: z.object({
      id: z.string().describe('Scope entry ID'),
    }),
    handler: async ({ id }) => {
      removeScope(id);
      return { success: true };
    },
  },
];
