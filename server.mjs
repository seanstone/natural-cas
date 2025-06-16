#!/usr/bin/env node
"use strict";
import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import Models from './models.json' with { type: 'json' };
// import Assistant from "./src/algebra-assistant.mjs";
import Assistant from './src/cas-assistant.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

function on_message(name, message)
{
    // console.log(name, message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                name: name,
                message: message,
            }));
        }
    });
}

// Middleware for JSON parsing
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'www/dist')));

// REST API
app.post('/api/models', async (req, res) => {
    res.json(Models.models);
});

app.post('/api/chats', async (req, res) => {
    let data = {};
    for (const name in Assistant.chats)
        data[name] = Assistant.chats[name].data();
    res.json(data);
});

app.post('/api/chat', async (req, res) => {
    console.log(req.body);
    const name = req.body.name;
    if (!(name in Assistant.chats)) {
        Assistant.chats[name] = new Assistant(req.body.model);
        Assistant.chats[name].on_message = (name, message) => on_message(name, message);
    }
    await Assistant.chats[name].chat(req.body.message);
    Assistant.chats[name].save();
    res.json({});
});

// 404 handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
    console.log('WebSocket client connected');

    ws.on('message', message => {
        console.log('Received WS message:', message.toString());
    });
});

await Assistant.load("logs");
for (const name in Assistant.chats) {
    Assistant.chats[name].on_message = (name, message) => on_message(name, message);
}

// Start listening
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});