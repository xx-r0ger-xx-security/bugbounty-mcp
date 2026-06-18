/**
 * Simple JSON file-based store for scopes and findings.
 * Designed to be swapped for a real DB (SQLite, Postgres) in v2.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

const VALID_STORE_NAME = /^[a-z0-9_-]+$/i;

function loadStore(name) {
  if (!VALID_STORE_NAME.test(name)) throw new Error(`Invalid store name: ${name}`);
  const filePath = join(DATA_DIR, `${name}.json`);
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function saveStore(name, data) {
  if (!VALID_STORE_NAME.test(name)) throw new Error(`Invalid store name: ${name}`);
  const filePath = join(DATA_DIR, `${name}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- Scopes ---

export function getScopes() {
  return loadStore('scopes');
}

export function addScope(scope) {
  const scopes = loadStore('scopes');
  const entry = { id: Date.now().toString(), ...scope, addedAt: new Date().toISOString() };
  scopes.push(entry);
  saveStore('scopes', scopes);
  return entry;
}

export function removeScope(id) {
  const scopes = loadStore('scopes').filter(s => s.id !== id);
  saveStore('scopes', scopes);
}

// --- Findings ---

export function getFindings(filters = {}) {
  let findings = loadStore('findings');
  if (filters.program) findings = findings.filter(f => f.program === filters.program);
  if (filters.severity) findings = findings.filter(f => f.severity === filters.severity);
  if (filters.status) findings = findings.filter(f => f.status === filters.status);
  return findings;
}

export function addFinding(finding) {
  const findings = loadStore('findings');
  const entry = {
    id: Date.now().toString(),
    status: 'open',
    createdAt: new Date().toISOString(),
    ...finding,
  };
  findings.push(entry);
  saveStore('findings', findings);
  return entry;
}

export function updateFinding(id, updates) {
  const findings = loadStore('findings');
  const idx = findings.findIndex(f => f.id === id);
  if (idx === -1) throw new Error(`Finding ${id} not found`);
  findings[idx] = { ...findings[idx], ...updates, updatedAt: new Date().toISOString() };
  saveStore('findings', findings);
  return findings[idx];
}
