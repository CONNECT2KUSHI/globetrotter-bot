const http = require('http');
const https = require('https');

const ALLOWED_DOMAINS = [
  'globetrotter-bot.vercel.app',
  'localhost',
  '127.0.0.1',
];

const GLOBETROTTER_CONTEXT = `
You are a friendly travel assistant for Team Globetrotter
(team-globetrotter.com), based in Gurugram, India.
Motto: "Explore the Unexplored."

TRIPS & ACTIVITIES:
- Trekking, Bike Trips, Paragliding, River Rafting
- Parasailing in Goa, Backwaters Kerala
- Srinagar Houseboats, Sea Activities Andaman
- Amazing Bhutan Tour

DESTINATIONS:
- Ladakh, Meghalaya, Kashmir, Bhutan
- Goa, Andaman, Kerala
- Weekend Getaways from Delhi/Gurugram

CONTACT:
- Phone: +91-7683045211 or +91-7065519815
- Email: teamglobetrotter@yahoo.com
- Instagram: @globetrotterteam

YOUR BEHAVIOUR:
- Reply in maximum 2-3 lines only
- Be punchy and fun like a friend texting
- Use 1 emoji max per reply
- Never make long lists — mention 2-3 options only
- Ask only ONE question at a time
- Never make up prices — say "contact us for pricing"
- If someone wants to book collect ONLY these one at a time:
  1. First ask: "What's your name?"
  2. Then ask: "Your phone number?"
  3. Then ask: "Which destination interests you?"
  Never ask email, budget or group size
`;

function setCORSHeaders(res, allowed) {
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function isDomainAllowed(req) {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const host = req.headers.host || '';

  if (!origin && !referer) return true;

  return ALLOWED_DOMAINS.some(domain =>
    origin.includes(domain) ||
    referer.includes(domain) ||
    host.includes(domain)
  );
}

const server = http.createServer((req, res) => {
  const allowed = isDomainAllowed(req);
  setCORSHeaders(res, allowed);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Team Globetrotter Bot is running!');
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    if (!allowed) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        reply: 'Unauthorized. Please contact Desi Nomad to activate this bot.'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, history = [] } = JSON.parse(body);

        const postData = JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 150,
          system: GLOBETROTTER_CONTEXT,
          messages: [...history, { role: 'user', content: message }]
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', chunk => data += chunk);
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const reply = parsed.content?.[0]?.text || JSON.stringify(parsed);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply }));
            } catch (e) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: 'Parse error: ' + e.message }));
            }
          });
        });

        apiReq.on('error', (e) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ reply: 'API error: ' + e.message }));
        });

        apiReq.write(postData);
        apiReq.end();

      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: 'Error: ' + e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Team Globetrotter bot running on port ${PORT}`);
});