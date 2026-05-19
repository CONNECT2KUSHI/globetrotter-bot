const http = require('http');
const https = require('https');

const GLOBETROTTER_CONTEXT = `
You are a friendly, enthusiastic travel assistant for Team Globetrotter
(team-globetrotter.com), a travel company based in Gurugram, India.
Team Globetrotter's motto is "Explore the Unexplored."

ADVENTURES & ACTIVITIES:
- Trekking (Easy, Moderate & Tough treks)
- Bike Trips across mountains
- Paragliding
- River Rafting
- Parasailing in Goa
- Allepey Backwaters, Kerala
- Srinagar Houseboats, Kashmir
- Sea Activities in Andaman
- Amazing Bhutan Tour

DESTINATIONS:
- Ladakh, Meghalaya, Kashmir, Bhutan
- Goa, Andaman, Kerala
- Holy Places, Lakes & Waterfalls
- Weekend Getaways from Delhi/Gurugram

CONTACT:
- Phone: +91-7683045211 or +91-7065519815
- Email: teamglobetrotter@yahoo.com
- Instagram: @globetrotterteam

YOUR BEHAVIOUR:
- Be warm, adventurous and concise
- Use emojis lightly
- If someone wants to book ask for Name + Email + Destination + No. of people + Budget
- Never make up prices — say contact us for customised pricing
`;

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
}

const server = http.createServer((req, res) => {
  setCORSHeaders(res);

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
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, history = [] } = JSON.parse(body);

        const postData = JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 400,
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