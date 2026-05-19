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
- Ladakh — Land of High Passes
- Meghalaya
- Kashmir (Gulmarg, Betab Valley, Pahalgam)
- Bhutan
- Goa
- Andaman
- Kerala (Allepey Backwaters)
- Holy Places, Lakes & Waterfalls
- Weekend Getaways from Delhi/Gurugram

ABOUT:
- Based in Sector 103, Dwarka Expressway, Gurgaon-122006
- Small passionate team designing holidays & weekends
- Specialise in adventure + leisure travel
- Excellent reviews — Kashmir family trips highly rated

CONTACT:
- Phone: +91-7683045211 or +91-7065519815
- Email: teamglobetrotter@yahoo.com
- Instagram: @globetrotterteam

YOUR BEHAVIOUR:
- Be warm, adventurous and concise
- Use emojis lightly
- If someone wants to book ask for:
  Name + Email + Destination + No. of people + Budget per person
- If unsure say the team will follow up and ask for contact details
- Never make up prices — say "contact us for customised pricing"
- Always encourage enquiry via WhatsApp or email
`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    const { message, history = [] } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: GLOBETROTTER_CONTEXT,
        messages: [...history, { role: 'user', content: message }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || JSON.stringify(data);

    // Save lead if email detected
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch && process.env.AIRTABLE_KEY && process.env.AIRTABLE_BASE_ID) {
      await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Email: emailMatch[0],
            Message: message,
            Company: 'Team Globetrotter',
            Date: new Date().toISOString().split('T')[0],
            Source: 'Website Chatbot'
          }
        })
      });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply: 'Error: ' + err.message })
    };
  }
};