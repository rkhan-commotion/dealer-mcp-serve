# Dealer MCP Server

A simple MCP (Model Context Protocol) server for finding car dealers by pincode using Supabase.

## Features

- REST API for dealer lookup
- Server-Sent Events (SSE) for real-time updates  
- MCP server for LLM integration
- Supabase integration

## API Endpoints

- `GET /api/dealers` - Get all dealers
- `GET /api/dealers?pincode=400028` - Get dealers by pincode
- `GET /dealers-stream` - SSE endpoint for real-time updates
- `GET /mcp/tools` - List available MCP tools
- `POST /mcp/tools/call` - Call MCP tools

## Environment Variables

Set these in Render:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon public key

## Usage with LLMs

The server provides an MCP tool `get_dealers_by_pincode` that can be called by compatible LLMs to find dealers by pincode.

Example tool call:
```json
{
  "tool": "get_dealers_by_pincode",
  "arguments": {
    "pincode": "400028"
  }
}
```