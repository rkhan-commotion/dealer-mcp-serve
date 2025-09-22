const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Helper function to call Supabase API
async function callSupabase(endpoint) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.statusText}`);
  }
  
  return response.json();
}

// REST API Endpoints
app.get('/api/dealers', async (req, res) => {
  try {
    const { pincode } = req.query;
    let endpoint = '/dealers';
    
    if (pincode) {
      endpoint += `?pincode=eq.${pincode}`;
    }
    
    const dealers = await callSupabase(endpoint);
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SSE Endpoint for real-time updates
app.get('/dealers-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial data
  const sendDealers = async () => {
    try {
      const dealers = await callSupabase('/dealers');
      res.write(`data: ${JSON.stringify(dealers)}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({error: error.message})}\n\n`);
    }
  };

  sendDealers();

  // Send updates every 30 seconds (you can adjust this)
  const interval = setInterval(sendDealers, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// MCP Tool: Get dealers by pincode
const getDealersByPincode = async (pincode) => {
  try {
    const dealers = await callSupabase(`/dealers?pincode=eq.${pincode}`);
    
    if (dealers.length === 0) {
      return {
        success: false,
        message: `No dealers found for pincode ${pincode}`
      };
    }
    
    return {
      success: true,
      pincode: pincode,
      dealers: dealers.map(d => ({
        name: d.dealership_name,
        pincode: d.pincode
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// MCP Server Implementation (simplified)
app.post('/mcp/tools/call', async (req, res) => {
  const { tool, arguments: args } = req.body;
  
  try {
    switch (tool) {
      case 'get_dealers_by_pincode':
        const result = await getDealersByPincode(args.pincode);
        res.json(result);
        break;
      default:
        res.status(404).json({ error: 'Tool not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Tools List
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_dealers_by_pincode',
        description: 'Find car dealers by pincode',
        inputSchema: {
          type: 'object',
          properties: {
            pincode: {
              type: 'string',
              description: 'The pincode to search for dealers'
            }
          },
          required: ['pincode']
        }
      }
    ]
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Dealer MCP Server is running!',
    endpoints: {
      api: '/api/dealers?pincode=400028',
      sse: '/dealers-stream',
      mcp_tools: '/mcp/tools',
      mcp_call: '/mcp/tools/call'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
});
