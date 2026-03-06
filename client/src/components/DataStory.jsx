import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

const AUDIENCES = ['EXECUTIVE', 'TECHNICAL', 'GENERAL']
const DEPTHS = ['Brief', 'Standard', 'Deep Dive']

const SECTION_META = {
    OVERVIEW: { title: 'Overview', icon: '◈' },
    KEY_FINDING_1: { title: 'Key Finding 1', icon: '◆' },
    KEY_FINDING_2: { title: 'Key Finding 2', icon: '◆' },
    KEY_FINDING_3: { title: 'Key Finding 3', icon: '◆' },
    ANOMALY: { title: 'Anomaly Detected', icon: '⚠' },
    RECOMMENDATION: { title: 'Recommendation', icon: '✦' },
}

export default function DataStory() {
    const {
        sessionId,
        metadata,
        edaResults,
        story,
        updateStory,
        setStoryContent,
    } = useStore()

    const { content, parsedSections, isStreaming, audience, depth, generated } = story

    const handleGenerate = useCallback(async () => {
        if (!sessionId || !edaResults || isStreaming) return

        updateStory({ isStreaming: true, content: '', parsedSections: {}, generated: false })

        try {
            const res = await fetch('/story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, audience, depth }),
            })

            if (!res.ok) {
                updateStory({ isStreaming: false })
                return
            }

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
                            setStoryContent(accumulated)
                            updateStory({ isStreaming: false, generated: true })
                            return
                        }
                        if (token === '[ERROR]') {
                            updateStory({ isStreaming: false })
                            return
                        }
                        accumulated += token
                        setStoryContent(accumulated)
                    }
                }
            }
            setStoryContent(accumulated)
            updateStory({ isStreaming: false, generated: true })
        } catch (err) {
            console.error('Story error:', err)
            updateStory({ isStreaming: false })
        }
    }, [sessionId, edaResults, isStreaming, audience, depth, updateStory, setStoryContent])

    const handleCopy = useCallback(() => {
        if (content) {
            navigator.clipboard.writeText(content.replace(/\[.*?\]/g, '').trim())
        }
    }, [content])

    const hasData = sessionId && edaResults

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* ── Header ──────────────────────────────────────────── */}
            <div>
                <h2 className="font-display text-2xl text-silver-100 mb-1">AI Data Story</h2>
                <p className="font-mono text-xs text-silver-500">
                    {metadata
                        ? `Generate a narrative for ${metadata.filename}`
                        : 'Upload a dataset to generate a story'}
                </p>
            </div>

            {/* ── Controls ────────────────────────────────────────── */}
            {hasData && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-5 space-y-4"
                >
                    {/* Audience selector */}
                    <div>
                        <p className="section-tag mb-2">Audience</p>
                        <div className="flex gap-2">
                            {AUDIENCES.map((a) => (
                                <button
                                    key={a}
                                    onClick={() => updateStory({ audience: a })}
                                    className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${audience === a
                                            ? 'bg-silver-700 text-silver-100'
                                            : 'bg-transparent text-silver-500 hover:text-silver-300'
                                        }`}
                                    style={{
                                        border: audience === a
                                            ? '1px solid #404040'
                                            : '1px solid #1a1a1a',
                                    }}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Depth selector */}
                    <div>
                        <p className="section-tag mb-2">Depth</p>
                        <div className="flex gap-2">
                            {DEPTHS.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => updateStory({ depth: d })}
                                    className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${depth === d
                                            ? 'bg-silver-700 text-silver-100'
                                            : 'bg-transparent text-silver-500 hover:text-silver-300'
                                        }`}
                                    style={{
                                        border: depth === d
                                            ? '1px solid #404040'
                                            : '1px solid #1a1a1a',
                                    }}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate button */}
                    <motion.button
                        onClick={handleGenerate}
                        disabled={isStreaming}
                        whileTap={{ scale: 0.97 }}
                        className="chrome-border rounded-xl px-6 py-3 font-display text-sm text-silver-100 transition-all w-full"
                        style={{
                            background: '#0f0f0f',
                            opacity: isStreaming ? 0.5 : 1,
                            cursor: isStreaming ? 'wait' : 'pointer',
                        }}
                    >
                        {isStreaming ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.span
                                    className="w-2 h-2 rounded-full bg-silver-400"
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                Generating...
                            </span>
                        ) : generated ? (
                            'Regenerate Story'
                        ) : (
                            'Generate Story'
                        )}
                    </motion.button>
                </motion.div>
            )}

            {/* ── Story output ────────────────────────────────────── */}
            <AnimatePresence>
                {(content || isStreaming) && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                    >
                        {/* Actions bar */}
                        {generated && !isStreaming && (
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={handleCopy}
                                    className="btn-ghost text-[11px] font-mono rounded-lg px-3 py-1"
                                >
                                    Copy Text
                                </button>
                            </div>
                        )}

                        {/* Section cards */}
                        {Object.keys(parsedSections).length > 0 ? (
                            Object.entries(parsedSections).map(([key, text]) => {
                                if (!text) return null
                                const meta = SECTION_META[key] || { title: key, icon: '•' }
                                return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="card p-5"
                                        style={{ borderLeft: '2px solid #b8b8b8' }}
                                    >
                                        <p className="font-display text-silver-200 text-sm mb-2">
                                            <span className="text-silver-500 mr-2">{meta.icon}</span>
                                            {meta.title}
                                        </p>
                                        <p className="font-mono text-silver-400 text-xs leading-relaxed">
                                            {text}
                                        </p>
                                    </motion.div>
                                )
                            })
                        ) : content ? (
                            <div className="card p-5" style={{ borderLeft: '2px solid #b8b8b8' }}>
                                <p className="font-mono text-silver-400 text-xs leading-relaxed whitespace-pre-wrap">
                                    {content}
                                    {isStreaming && (
                                        <motion.span
                                            className="inline-block w-1.5 h-3.5 bg-silver-400 ml-0.5"
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                        />
                                    )}
                                </p>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Empty state ─────────────────────────────────────── */}
            {!hasData && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <motion.div
                        className="float-anim"
                        style={{ color: '#2a2a2a', fontSize: 48 }}
                    >
                        ✦
                    </motion.div>
                    <p className="font-display text-silver-500 text-lg">
                        Upload a dataset to generate a story
                    </p>
                    <p className="font-mono text-silver-700 text-xs">
                        Lumin will create a narrative from your data
                    </p>
                </div>
            )}
        </div>
    )
}
