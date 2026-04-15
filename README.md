# bugbounty-mcp

A Model Context Protocol (MCP) server for bug bounty hunting. Gives Claude direct access to recon tools, scope management, finding tracking, payload libraries, and report drafting — so you get an AI copilot that acts, not just advises.

---

## Architecture

```
bugbounty-mcp/
├── src/
│   ├── index.js          # MCP server entry point — registers all tools
│   ├── store/
│   │   └── db.js         # JSON file-based persistence (scopes, findings)
│   └── tools/
│       ├── scope.js      # Scope management tools
│       ├── findings.js   # Finding tracker tools
│       ├── recon.js      # Recon CLI wrappers (subfinder, httpx, nmap, nuclei, ffuf)
│       ├── report.js     # Report generation tools
│       └── payloads.js   # Payload library tools
├── data/                 # Auto-created; stores scopes.json and findings.json
└── package.json
```

### Design principles

- **Structured outputs everywhere** — every tool returns JSON. This is intentional: it makes tools composable and enables future agentic pipelines to chain them without parsing.
- **Thin wrappers, not reimplementations** — recon tools shell out to battle-tested CLIs (subfinder, httpx, nmap, nuclei, ffuf). The MCP layer handles structured I/O and error handling.
- **Built for v2 agentic chaining** — tools are small, focused, and stateless. A future `recon_pipeline` tool can trivially chain `recon_subdomains → recon_probe → recon_nuclei` and reason over the results mid-flight.

---

## Tools

### Scope Management
| Tool | Description |
|------|-------------|
| `scope_add` | Add a target (domain, IP, wildcard) to a program's scope |
| `scope_list` | List all in-scope targets, filterable by program |
| `scope_check` | Check if a given target is in scope |
| `scope_remove` | Remove a scope entry by ID |

### Finding Tracker
| Tool | Description |
|------|-------------|
| `finding_add` | Log a new vulnerability finding |
| `finding_list` | List findings, filterable by program/severity/status |
| `finding_update` | Update status, add notes, record bounty |

### Recon Wrappers
| Tool | Requires |
|------|----------|
| `recon_subdomains` | [subfinder](https://github.com/projectdiscovery/subfinder) |
| `recon_probe` | [httpx](https://github.com/projectdiscovery/httpx) |
| `recon_portscan` | [nmap](https://nmap.org) |
| `recon_nuclei` | [nuclei](https://github.com/projectdiscovery/nuclei) |
| `recon_ffuf` | [ffuf](https://github.com/ffuf/ffuf) |
| `recon_whois` | whois (system) |

### Payload Library
| Tool | Description |
|------|-------------|
| `payload_list_types` | List all payload categories |
| `payload_get` | Get payloads for XSS, SQLi, SSRF, IDOR, LFI, open redirect, SSTI |

### Report Generation
| Tool | Description |
|------|-------------|
| `report_draft` | Generate a HackerOne/Bugcrowd-ready report from a finding |
| `report_summary` | Summarize all findings for a program |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install recon CLI tools (optional but recommended)

```bash
# ProjectDiscovery suite
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# ffuf
go install github.com/ffuf/ffuf/v2@latest

# nmap — install via package manager
# Windows: https://nmap.org/download.html
# macOS: brew install nmap
# Linux: apt install nmap
```

Tools that aren't installed will return a clear error with install instructions — the rest of the server keeps working.

### 3. Register with Claude Code

Add to your Claude Code MCP config (`~/.claude/claude_desktop_config.json` or via `claude mcp add`):

```json
{
  "mcpServers": {
    "bugbounty": {
      "command": "node",
      "args": ["/path/to/bugbounty-mcp/src/index.js"]
    }
  }
}
```

### 4. Start the server

```bash
npm start
```

---

## Usage examples

Once connected to Claude, you can say things like:

- *"Add `*.acme.com` to scope for the Acme HackerOne program"*
- *"Is `api.acme.com` in scope?"*
- *"Run subdomain enumeration on acme.com"*
- *"Probe these subdomains for live HTTP services: [list]"*
- *"Log a high-severity IDOR finding on /api/v1/users/{id}"*
- *"Draft a bug bounty report for finding ID 1234"*
- *"Show me SSRF payloads"*
- *"Summarize all my findings for the Acme program"*

---

## Roadmap (v2)

- [ ] Agentic recon pipeline (`recon_subdomains → recon_probe → recon_nuclei` in one call)
- [ ] HackerOne / Bugcrowd API integration (pull scopes, submit reports)
- [ ] CVE / advisory lookup (NVD, GitHub Security Advisories)
- [ ] SQLite persistence (replace JSON files)
- [ ] Codex integration for source code analysis
- [ ] Nuclei custom template management

---

## Ethics & Legal

Only use this against targets you have **explicit written permission** to test (bug bounty programs, CTFs, your own infrastructure). Unauthorized testing is illegal. Always verify scope before running any recon tools.
