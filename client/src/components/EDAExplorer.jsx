import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import LoadingOrb from './LoadingOrb'
import generateReport from '../utils/generateReport'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'

const PIE_COLORS = ['#e8e8e8', '#b8b8b8', '#8c8c8c', '#646464', '#404040', '#2a2a2a']

const TOOLTIP_STYLE = {
    contentStyle: {
        background: '#111',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        fontFamily: 'IBM Plex Mono',
        fontSize: '11px',
        color: '#b8b8b8',
    },
    cursor: { fill: 'rgba(255,255,255,0.02)' },
}
const AXIS_TICK = { fill: '#646464', fontFamily: 'IBM Plex Mono', fontSize: 9 }

function fadeVariant(delay = 0) {
    return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay },
    }
}

function correlationBg(val) {
    if (val === null || val === undefined) return '#1a1a1a'
    const v = Math.max(-1, Math.min(1, val))
    if (v > 0) {
        const t = v
        const r = Math.round(26 + t * (255 - 26))
        const g = Math.round(26 + t * (255 - 26))
        const b = Math.round(26 + t * (255 - 26))
        return `rgb(${r},${g},${b})`
    } else {
        const t = -v
        const base = 26
        const r = Math.round(base - t * 10)
        const g = Math.round(base - t * 10)
        const b = Math.round(base - t * 10)
        return `rgb(${Math.max(0, r)},${Math.max(0, g)},${Math.max(0, b)})`
    }
}

function correlationTextColor(val) {
    if (val === null || val === undefined) return '#646464'
    return Math.abs(val) > 0.5 ? '#080808' : '#8c8c8c'
}

export default function EDAExplorer() {
    const { edaResults, uploadStatus, metadata } = useStore()
    const [selectedCol, setSelectedCol] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        if (!edaResults || isGenerating) return
        setIsGenerating(true)
        try {
            await generateReport(edaResults, metadata)
        } catch (e) {
            console.error('Report generation failed:', e)
        } finally {
            setIsGenerating(false)
        }
    }

    if (!edaResults) {
        if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
            return (
                <div className="flex items-center justify-center h-64">
                    <LoadingOrb text="Computing EDA..." />
                </div>
            )
        }
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <p className="font-display text-silver-600 text-sm">Upload a dataset to generate EDA</p>
                <p className="font-mono text-silver-700 text-xs">← Use the sidebar to upload a CSV or XLSX file</p>
            </div>
        )
    }

    const {
        overview,
        dtypeCounts,
        numericCols,
        categoricalCols,
        missingValues,
        statistics,
        topCorrelations,
        distributions,
        categoricalFrequency,
        correlationMatrix,
    } = edaResults

    // Column explorer data
    const allCols = [...(numericCols || []), ...(categoricalCols || [])]
    const activeCol = selectedCol || allCols[0] || ''
    const isNumericCol = numericCols?.includes(activeCol)
    const distData = distributions?.[activeCol]
    const freqData = categoricalFrequency?.[activeCol]

    const colExplorerData = isNumericCol && distData
        ? distData.bins.map((b, i) => ({
            name: typeof b === 'number' ? b.toFixed(1) : b,
            value: distData.counts[i],
        }))
        : freqData
            ? Object.entries(freqData).map(([name, value]) => ({ name, value }))
            : []

    // Dtype pie data
    const dtypePieData = [
        { name: 'Numeric', value: dtypeCounts?.numeric || 0 },
        { name: 'Categorical', value: dtypeCounts?.categorical || 0 },
        { name: 'Datetime', value: dtypeCounts?.datetime || 0 },
    ].filter((d) => d.value > 0)

    // Missing values bar data (horizontal)
    const missingBarData = (missingValues || []).slice(0, 10).map((m) => ({
        name: m.col.length > 12 ? m.col.slice(0, 12) + '…' : m.col,
        value: m.percent,
    }))

    // Correlation matrix columns
    const cmCols = correlationMatrix?.columns || []
    const cmValues = correlationMatrix?.values || []

    return (
        <div className="p-6">
            {/* ── DOWNLOAD BUTTON ──────────────────────────── */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleDownload}
                    disabled={!edaResults || isGenerating}
                    className="btn-ghost text-xs font-mono rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <motion.span
                                className="w-2 h-2 rounded-full bg-silver-400"
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            Generating Report...
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download Summary Report
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* ── CARD 1: DATASET OVERVIEW ──────────────────────── */}
                <motion.div {...fadeVariant(0)} className="card card-hover p-5">
                    <p className="section-tag mb-4">Dataset Overview</p>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Rows', value: (overview?.rows || 0).toLocaleString() },
                            { label: 'Columns', value: overview?.cols || 0 },
                            { label: 'Memory KB', value: overview?.memoryKB?.toFixed(1) || 0 },
                            { label: 'Null %', value: `${overview?.nullPercent ?? 0}%` },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="stat-label">{label}</p>
                                <p className="stat-value text-xl">{value}</p>
                            </div>
                        ))}
                    </div>
                    {overview?.duplicateRows > 0 && (
                        <div className="mt-3 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 inline-block">
                            <p className="font-mono text-amber-400 text-[10px]">
                                ⚠ {overview.duplicateRows} duplicate rows
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* ── CARD 2: COLUMN TYPES ──────────────────────────── */}
                <motion.div {...fadeVariant(0.07)} className="card card-hover p-5">
                    <p className="section-tag mb-2">Column Types</p>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Pie
                                data={dtypePieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={72}
                                strokeWidth={0}
                            >
                                {dtypePieData.map((_, idx) => (
                                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {[
                            { label: 'Numeric', count: dtypeCounts?.numeric },
                            { label: 'Categorical', count: dtypeCounts?.categorical },
                            { label: 'Datetime', count: dtypeCounts?.datetime },
                        ].map(({ label, count }) => (
                            <span
                                key={label}
                                className="bg-silver-800 text-silver-400 rounded-full px-2 py-0.5 font-mono"
                                style={{ fontSize: 10 }}
                            >
                                {label}: {count}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* ── CARD 3: MISSING VALUES ────────────────────────── */}
                <motion.div {...fadeVariant(0.14)} className="card card-hover p-5">
                    <p className="section-tag mb-3">Missing Values</p>
                    {missingValues && missingValues.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart
                                data={missingBarData}
                                layout="vertical"
                                margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                <XAxis
                                    type="number"
                                    unit="%"
                                    tick={AXIS_TICK}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={AXIS_TICK}
                                    axisLine={false}
                                    tickLine={false}
                                    width={72}
                                />
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Bar dataKey="value" fill="#2a2a2a" radius={[0, 3, 3, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm mt-2">
                            <span>✓</span>
                            <span>No missing values</span>
                        </div>
                    )}
                </motion.div>

                {/* ── CARD 4: STATISTICS TABLE (spans 2 cols) ────────── */}
                <motion.div
                    {...fadeVariant(0.21)}
                    className="card card-hover p-5 md:col-span-2"
                >
                    <p className="section-tag mb-3">Statistical Summary</p>
                    <div className="overflow-auto max-h-64">
                        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 480 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                                    {['COL', 'MEAN', 'MEDIAN', 'STD', 'MIN', 'MAX'].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left py-2 px-3 text-silver-500 uppercase tracking-wider"
                                            style={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(statistics || []).map((s, i) => (
                                    <tr
                                        key={s.col}
                                        style={{ background: i % 2 === 0 ? '#0f0f0f' : '#111111' }}
                                    >
                                        <td className="py-2 px-3 font-mono text-silver-300 text-[11px]">
                                            {s.col}
                                            {s.nullCount > 0 && (
                                                <span className="ml-1 bg-silver-800 text-silver-500 rounded-sm px-1 text-[9px]">
                                                    {s.nullCount} null
                                                </span>
                                            )}
                                        </td>
                                        {[s.mean, s.median, s.std, s.min, s.max].map((v, vi) => (
                                            <td key={vi} className="py-2 px-3 font-mono text-silver-200 text-[11px]">
                                                {v !== null && v !== undefined ? Number(v).toFixed(2) : '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ── CARD 5: COLUMN EXPLORER ──────────────────────── */}
                <motion.div {...fadeVariant(0.28)} className="card card-hover p-5">
                    <p className="section-tag mb-3">Column Deep Dive</p>
                    <select
                        value={activeCol}
                        onChange={(e) => setSelectedCol(e.target.value)}
                        className="input-dark w-full rounded-xl px-3 py-2 font-mono text-xs mb-3 cursor-pointer"
                    >
                        {allCols.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {colExplorerData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={140}>
                            <BarChart data={colExplorerData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                                <defs>
                                    <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#d4d4d4" />
                                        <stop offset="100%" stopColor="#404040" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Bar dataKey="value" fill="url(#colGrad)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="font-mono text-silver-600 text-xs">No data available for this column</p>
                    )}
                    {activeCol && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {isNumericCol && statistics?.find((s) => s.col === activeCol) ? (() => {
                                const stat = statistics.find((s) => s.col === activeCol)
                                return (
                                    <>
                                        <span className="bg-silver-800 text-silver-400 rounded-full px-2 py-0.5 font-mono text-[9px]">min: {stat.min?.toFixed(2)}</span>
                                        <span className="bg-silver-800 text-silver-400 rounded-full px-2 py-0.5 font-mono text-[9px]">mean: {stat.mean?.toFixed(2)}</span>
                                        <span className="bg-silver-800 text-silver-400 rounded-full px-2 py-0.5 font-mono text-[9px]">max: {stat.max?.toFixed(2)}</span>
                                    </>
                                )
                            })() : freqData ? (
                                <span className="bg-silver-800 text-silver-400 rounded-full px-2 py-0.5 font-mono text-[9px]">
                                    top: {Object.keys(freqData)[0]}
                                </span>
                            ) : null}
                        </div>
                    )}
                </motion.div>

                {/* ── CARD 6: CORRELATION HEATMAP ──────────────────── */}
                {cmCols.length >= 2 && (
                    <motion.div {...fadeVariant(0.35)} className="card card-hover p-5 overflow-auto">
                        <p className="section-tag mb-3">Correlation Matrix</p>
                        <div
                            className="inline-grid gap-px"
                            style={{ gridTemplateColumns: `auto repeat(${cmCols.length}, 32px)` }}
                        >
                            {/* Header row */}
                            <div />
                            {cmCols.map((col) => (
                                <div
                                    key={col}
                                    className="flex items-end justify-center pb-1"
                                    style={{ height: 40 }}
                                    title={col}
                                >
                                    <span
                                        className="text-silver-500 font-mono"
                                        style={{
                                            fontSize: 8,
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)',
                                            maxHeight: 36,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {col.slice(0, 8)}
                                    </span>
                                </div>
                            ))}

                            {/* Data rows */}
                            {cmCols.map((rowCol, ri) => (
                                <React.Fragment key={rowCol}>
                                    <div
                                        className="flex items-center justify-end pr-1"
                                        style={{ width: 56 }}
                                        title={rowCol}
                                    >
                                        <span className="text-silver-500 font-mono text-[8px] truncate max-w-[52px]">
                                            {rowCol.slice(0, 8)}
                                        </span>
                                    </div>
                                    {cmCols.map((_, ci) => {
                                        const val = cmValues[ri]?.[ci]
                                        const isDiag = ri === ci
                                        return (
                                            <div
                                                key={`cell-${ri}-${ci}`}
                                                className="flex items-center justify-center rounded-sm"
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    background: isDiag ? '#2a2a2a' : correlationBg(val),
                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                }}
                                                title={`${cmCols[ri]} × ${cmCols[ci]}: ${val?.toFixed(3) ?? 'N/A'}`}
                                            >
                                                <span
                                                    className="font-mono"
                                                    style={{ fontSize: 8, color: isDiag ? '#646464' : correlationTextColor(val) }}
                                                >
                                                    {isDiag ? '—' : val !== null && val !== undefined ? val.toFixed(2) : ''}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── CARD 7: TOP CORRELATIONS LIST ────────────────── */}
                {topCorrelations && topCorrelations.length > 0 && (
                    <motion.div {...fadeVariant(0.42)} className="card card-hover p-5">
                        <p className="section-tag mb-3">Strongest Correlations</p>
                        <div className="space-y-2">
                            {topCorrelations.slice(0, 8).map((corr, i) => {
                                const abs = Math.abs(corr.value)
                                const badgeBg =
                                    abs >= 0.7 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                        : abs >= 0.4 ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                                            : 'bg-silver-800 text-silver-400'
                                return (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-silver-300 text-[11px] truncate flex-1">
                                            {corr.col1} ↔ {corr.col2}
                                        </span>
                                        <span className={`font-mono text-[10px] rounded-full px-2 py-0.5 flex-shrink-0 ${badgeBg}`}>
                                            {corr.value >= 0 ? '+' : ''}{corr.value.toFixed(3)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
