import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../store'
import ChartCard from './ChartCard'

function parseMessageContent(raw, edaResults) {
    if (!raw) return { text: '', charts: [], suggest: null }

    let text = raw
    const charts = []
    let suggest = null

    // Extract [CHART:type:column] tags
    const chartRegex = /\[CHART:(bar|line|pie):([^\]]+)\]/g
    let chartMatch
    while ((chartMatch = chartRegex.exec(raw)) !== null) {
        const chartType = chartMatch[1]
        const colName = chartMatch[2].trim()
        charts.push({ type: chartType, col: colName })
    }
    text = text.replace(chartRegex, '').trim()

    // Extract [SUGGEST] line
    const suggestRegex = /\[SUGGEST\]\s*(.+)/
    const suggestMatch = text.match(suggestRegex)
    if (suggestMatch) {
        suggest = suggestMatch[1].trim()
        text = text.replace(suggestRegex, '').trim()
    }

    return { text, charts, suggest }
}

function getChartData(colName, edaResults) {
    if (!edaResults || !colName) return { data: [], dataKey: 'value', nameKey: 'name' }

    const dist = edaResults.distributions?.[colName]
    if (dist) {
        return {
            data: dist.bins.map((b, i) => ({
                name: typeof b === 'number' ? b.toFixed(1) : b,
                value: dist.counts[i],
            })),
            dataKey: 'value',
            nameKey: 'name',
        }
    }

    const freq = edaResults.categoricalFrequency?.[colName]
    if (freq) {
        return {
            data: Object.entries(freq).map(([k, v]) => ({ name: k, value: v })),
            dataKey: 'value',
            nameKey: 'name',
        }
    }

    return { data: [], dataKey: 'value', nameKey: 'name' }
}

function MessageBubble({ message, edaResults, onSuggestionClick }) {
    const isUser = message.role === 'user'
    const { text, charts, suggest } = parseMessageContent(message.content, edaResults)

    if (isUser) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end"
            >
                <div
                    className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 font-mono text-sm text-silver-100"
                    style={{ background: '#1a1a1a' }}
                >
                    {message.content}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-start"
        >
            <div className="max-w-[85%] space-y-3">
                <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3 font-mono text-sm text-silver-300 leading-relaxed"
                    style={{
                        background: '#0f0f0f',
                        border: '1px solid #1a1a1a',
                        borderLeft: '2px solid #b8b8b8',
                    }}
                >
                    {text || <span className="text-silver-600 italic">...</span>}
                </div>

                {/* Inline charts */}
                {charts.map((chart, i) => {
                    const { data, dataKey, nameKey } = getChartData(chart.col, edaResults)
                    if (!data || data.length === 0) return null
                    return (
                        <ChartCard
                            key={i}
                            type={chart.type}
                            title={chart.col}
                            data={data}
                            dataKey={dataKey}
                            nameKey={nameKey}
                            height={160}
                        />
                    )
                })}

                {/* Suggestion pill */}
                {suggest && (
                    <button
                        onClick={() => onSuggestionClick(suggest)}
                        className="block text-left w-full px-3 py-2 rounded-xl font-mono text-[11px] text-silver-500 italic hover:text-silver-300 transition-colors"
                        style={{ border: '1px solid #2a2a2a', background: 'transparent' }}
                    >
                        ✦ {suggest}
                    </button>
                )}
            </div>
        </motion.div>
    )
}

function ThinkingBubble() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start"
        >
            <div
                className="rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderLeft: '2px solid #b8b8b8' }}
            >
                <div className="flex gap-2 items-center h-4">
                    <span className="thinking-dot-1" />
                    <span className="thinking-dot-2" />
                    <span className="thinking-dot-3" />
                </div>
            </div>
        </motion.div>
    )
}

export default function ChatWithData() {
    const {
        messages,
        isThinking,
        suggestedQuestions,
        sessionId,
        edaResults,
        metadata,
        addMessage,
        updateLastMessage,
        setThinking,
        clearChat,
    } = useStore()

    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)
    const textareaRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isThinking])

    const handleSend = useCallback(async () => {
        const trimmed = input.trim()
        if (!trimmed || isThinking || !sessionId) return

        const userMsg = { role: 'user', content: trimmed, id: uuidv4() }
        addMessage(userMsg)
        setInput('')
        setThinking(true)

        const assistantPlaceholder = { role: 'assistant', content: '', id: uuidv4() }
        addMessage(assistantPlaceholder)

        try {
            const allMessages = [...messages, userMsg]

            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, messages: allMessages }),
            })

            if (!res.ok) throw new Error('Chat request failed')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let accumulated = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const token = line.slice(6)
                        if (token === '[DONE]') {
                            setThinking(false)
                            return
                        }
                        if (token === '[ERROR]') {
                            updateLastMessage('I encountered an error. Please try again.')
                            setThinking(false)
                            return
                        }
                        accumulated += token
                        updateLastMessage(accumulated)
                    }
                }
            }
            setThinking(false)
        } catch (err) {
            console.error('Chat error:', err)
            updateLastMessage('I encountered an error. Please try again.')
            setThinking(false)
        }
    }, [input, isThinking, sessionId, messages, addMessage, updateLastMessage, setThinking])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSuggestionClick = useCallback((question) => {
        setInput(question)
        textareaRef.current?.focus()
    }, [])


    // Auto-expand textarea
    const handleInputChange = (e) => {
        setInput(e.target.value)
        const ta = e.target
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }

    const userMsgCount = messages.filter((m) => m.role === 'user').length

    return (
        <div className="flex h-full lg:grid lg:grid-cols-5" style={{ height: 'calc(100vh - 56px)' }}>
            {/* ── Left panel ──────────────────────────────────── */}
            <div
                className="hidden lg:flex flex-col lg:col-span-2 p-6 overflow-y-auto"
                style={{ borderRight: '1px solid rgba(42,42,42,0.5)' }}
            >
                {/* Dataset context */}
                <div className="mb-6">
                    <p className="section-tag mb-3">Dataset Context</p>
                    {metadata ? (
                        <div className="card p-4 space-y-2">
                            <p className="font-mono text-silver-200 text-[11px] truncate">{metadata.filename}</p>
                            <p className="font-mono text-silver-500 text-[10px]">
                                {metadata.rows?.toLocaleString()} rows × {metadata.cols} cols
                            </p>
                            {edaResults?.overview && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    <span className="bg-silver-800 text-silver-500 rounded-full px-2 py-0.5 font-mono text-[9px]">
                                        {edaResults.overview.nullPercent}% null
                                    </span>
                                    <span className="bg-silver-800 text-silver-500 rounded-full px-2 py-0.5 font-mono text-[9px]">
                                        {edaResults.dtypeCounts?.numeric || 0} numeric
                                    </span>
                                    <span className="bg-silver-800 text-silver-500 rounded-full px-2 py-0.5 font-mono text-[9px]">
                                        {edaResults.dtypeCounts?.categorical || 0} categorical
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="font-mono text-silver-600 text-xs">No dataset loaded</p>
                    )}
                </div>

                {/* Suggested questions */}
                {suggestedQuestions.length > 0 && (
                    <div className="mb-6">
                        <p className="section-tag mb-3">Suggested Questions</p>
                        <div className="space-y-2">
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(q)}
                                    className="btn-ghost w-full text-left font-mono text-[11px] rounded-xl p-3 leading-snug"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Session stats */}
                <div>
                    <p className="section-tag mb-3">Session Stats</p>
                    <div className="space-y-1">
                        <p className="font-mono text-silver-600 text-[11px]">
                            {messages.length} messages total
                        </p>
                        <p className="font-mono text-silver-600 text-[11px]">
                            {userMsgCount} questions asked
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Right panel ─────────────────────────────────── */}
            <div className="flex flex-col lg:col-span-3 h-full overflow-hidden">
                {/* Top bar */}
                <div
                    className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(42,42,42,0.5)' }}
                >
                    <p className="section-tag">Chat with Data</p>
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="btn-ghost text-[11px] font-mono rounded-lg px-3 py-1"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <motion.div
                                className="float-anim"
                                style={{ color: '#2a2a2a', fontSize: 48 }}
                            >
                                ⬡
                            </motion.div>
                            <p className="font-display text-silver-500 text-lg">Ask anything about your data</p>
                            <p className="font-mono text-silver-700 text-xs">
                                {sessionId
                                    ? 'Lumin is ready to analyze your dataset'
                                    : 'Upload a dataset to start chatting'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        edaResults={edaResults}
                                        onSuggestionClick={handleSuggestionClick}
                                    />
                                ))}
                            </AnimatePresence>
                            {isThinking && <ThinkingBubble />}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input bar */}
                <div
                    className="flex items-end gap-3 p-4 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(42,42,42,0.5)' }}
                >
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={sessionId ? 'Ask Lumin about your data...' : 'Upload a dataset to begin'}
                        disabled={!sessionId}
                        rows={1}
                        className="input-dark flex-1 rounded-2xl px-4 py-3 font-mono text-sm resize-none overflow-y-auto"
                        style={{ minHeight: 44, maxHeight: 120 }}
                    />
                    <motion.button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking || !sessionId}
                        whileTap={{ scale: 0.95 }}
                        className="chrome-border flex items-center justify-center rounded-full transition-all duration-150 flex-shrink-0"
                        style={{
                            width: 40,
                            height: 40,
                            background: '#080808',
                            opacity: !input.trim() || isThinking || !sessionId ? 0.3 : 1,
                            cursor: !input.trim() || isThinking || !sessionId ? 'not-allowed' : 'pointer',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b8b8b8" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </div>
    )
}
