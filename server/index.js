/**
 * index.js — Express gateway server for Lumin.ai.
 * Handles file uploads, EDA computation, story generation, and chat.
 * Proxies AI calls to the FastAPI AI Engine at http://localhost:8000.
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import fetch from 'node-fetch';
import { parseCSV, parseXLSX, inferDtypes } from './parser.js';

const AI_ENGINE = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const PORT = process.env.PORT || 3001;

const app = express();

// ── In-memory session store ───────────────────────────────────────────────
/** @type {Map<string, { headers, rows, filename, dtypes, metadata, eda }>} */
const sessions = new Map();

// ── Middleware ────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json({ limit: '100mb' }));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    });
    next();
});

// ── Helper: compute null counts per column ────────────────────────────────
function computeNullCounts(headers, rows) {
    const nullCounts = {};
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const col = headers[colIdx];
        let count = 0;
        for (const row of rows) {
            const val = row[colIdx];
            if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
                count++;
            }
        }
        nullCounts[col] = count;
    }
    return nullCounts;
}

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /upload
 * Accepts a multipart file upload (field: "file"), parses it, and stores the session.
 */
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const { buffer, originalname, mimetype } = req.file;

        // Detect file type
        const isXLSX =
            mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimetype === 'application/vnd.ms-excel' ||
            originalname.endsWith('.xlsx') ||
            originalname.endsWith('.xls');

        let parsed;
        if (isXLSX) {
            parsed = parseXLSX(buffer, originalname);
        } else {
            parsed = parseCSV(buffer, originalname);
        }

        const { headers, rows, rowCount, colCount, sampleRows, filename } = parsed;
        const dtypes = inferDtypes(headers, rows);
        const nullCounts = computeNullCounts(headers, rows);

        const sessionId = uuidv4();
        const metadata = {
            filename,
            rows: rowCount,
            cols: colCount,
            dtypes,
            sampleRows,
            nullCounts,
        };

        sessions.set(sessionId, { headers, rows, filename, dtypes, metadata, eda: null });

        return res.json({ sessionId, metadata });
    } catch (err) {
        console.error('[/upload] error:', err);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /eda
 * Sends data to the AI engine for EDA computation and caches result in the session.
 */
app.post('/eda', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const aiRes = await fetch(`${AI_ENGINE}/eda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                headers: session.headers,
                rows: session.rows,
                filename: session.filename,
            }),
        });

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            return res.status(500).json({ error: `AI engine error: ${errText}` });
        }

        const eda = await aiRes.json();
        session.eda = eda;
        sessions.set(sessionId, session);

        return res.json(eda);
    } catch (err) {
        console.error('[/eda] error:', err);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /story
 * Streams an AI-generated data narrative from the AI engine (SSE).
 */
app.post('/story', async (req, res) => {
    try {
        const { sessionId, audience, depth } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (!session.eda) return res.status(400).json({ error: 'EDA not computed yet. Call /eda first.' });

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const aiRes = await fetch(`${AI_ENGINE}/story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eda: session.eda,
                metadata: session.metadata,
                audience: audience || 'EXECUTIVE',
                depth: depth || 'Standard',
            }),
        });

        if (!aiRes.ok) {
            res.write('data: [ERROR]\n\n');
            res.end();
            return;
        }

        // Pipe stream from AI engine to client
        for await (const chunk of aiRes.body) {
            res.write(chunk);
        }
        res.end();
    } catch (err) {
        console.error('[/story] error:', err);
        try {
            res.write('data: [ERROR]\n\n');
            res.end();
        } catch (_) { }
    }
});

/**
 * POST /chat
 * Streams a conversational AI response about the dataset (SSE).
 */
app.post('/chat', async (req, res) => {
    try {
        const { sessionId, messages } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (!session.eda) return res.status(400).json({ error: 'EDA not computed yet. Call /eda first.' });

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const aiRes = await fetch(`${AI_ENGINE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages || [],
                metadata: session.metadata,
                eda: session.eda,
            }),
        });

        if (!aiRes.ok) {
            res.write('data: [ERROR]\n\n');
            res.end();
            return;
        }

        // Pipe stream from AI engine to client
        for await (const chunk of aiRes.body) {
            res.write(chunk);
        }
        res.end();
    } catch (err) {
        console.error('[/chat] error:', err);
        try {
            res.write('data: [ERROR]\n\n');
            res.end();
        } catch (_) { }
    }
});

/**
 * GET /health
 */
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[Lumin Gateway] Running at http://localhost:${PORT}`);
    console.log(`[Lumin Gateway] AI Engine at ${AI_ENGINE}`);
});
