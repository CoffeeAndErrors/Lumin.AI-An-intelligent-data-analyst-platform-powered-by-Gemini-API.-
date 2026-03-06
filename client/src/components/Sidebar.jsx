import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import UploadZone from './UploadZone'

const NAV_ITEMS = [
    {
        id: 'eda',
        label: 'EDA Explorer',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        id: 'story',
        label: 'Data Story',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
            </svg>
        ),
    },
    {
        id: 'chat',
        label: 'Chat with Data',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
]

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, activeFeature, setActiveFeature, metadata, edaResults } =
        useStore()

    const nullPercent = edaResults?.overview?.nullPercent ?? null
    const memKB = edaResults?.overview?.memoryKB ?? null

    return (
        <motion.aside
            animate={{ width: sidebarCollapsed ? 56 : 220 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="flex flex-col h-screen flex-shrink-0 overflow-hidden"
            style={{
                background: '#0a0a0a',
                borderRight: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {/* ── Collapse toggle ─────────────────────────────── */}
            <div className="flex items-center justify-end p-3 pt-4 flex-shrink-0">
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-silver-500 hover:text-silver-300 hover:bg-silver-900/50 transition-all"
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <motion.div
                        animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.div>
                </button>
            </div>

            {/* ── Upload Zone ─────────────────────────────────── */}
            <div className="px-2 pb-3 flex-shrink-0">
                <AnimatePresence mode="wait">
                    {sidebarCollapsed ? (
                        <motion.button
                            key="collapsed-upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex items-center justify-center p-2 rounded-lg text-silver-500 hover:text-silver-300 hover:bg-silver-900/50 transition-all"
                            title="Upload dataset"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polyline points="16 16 12 12 8 16" />
                                <line x1="12" y1="12" x2="12" y2="21" />
                                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                            </svg>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="expanded-upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <UploadZone />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Dataset info ─────────────────────────────────── */}
            <AnimatePresence>
                {metadata && !sidebarCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mx-2 mb-3 p-3 rounded-xl"
                        style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                        <p className="font-mono text-silver-400 text-[11px] truncate mb-1">{metadata.filename}</p>
                        <p className="font-mono text-silver-600 text-[10px] mb-2">
                            {metadata.rows?.toLocaleString()} rows × {metadata.cols} cols
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {nullPercent !== null && (
                                <span className="bg-silver-800 text-silver-500 rounded-full px-2 py-0.5 font-mono text-[9px]">
                                    {nullPercent}% null
                                </span>
                            )}
                            {memKB !== null && (
                                <span className="bg-silver-800 text-silver-500 rounded-full px-2 py-0.5 font-mono text-[9px]">
                                    {memKB} KB
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Navigation ───────────────────────────────────── */}
            <nav className="flex flex-col gap-1 px-2 flex-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeFeature === item.id
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveFeature(item.id)}
                            className="relative flex items-center gap-3 px-2 py-3 rounded-xl text-left transition-all duration-150"
                            style={{
                                color: isActive ? '#e8e8e8' : '#646464',
                                background: isActive ? 'rgba(42,42,42,0.8)' : 'transparent',
                                borderLeft: isActive ? '2px solid #b8b8b8' : '2px solid transparent',
                            }}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <AnimatePresence>
                                {!sidebarCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="font-display text-sm whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )
                })}
            </nav>

            {/* ── Bottom info ──────────────────────────────────── */}
            <AnimatePresence>
                {!sidebarCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-4 border-t border-silver-800/40"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="w-1.5 h-1.5 rounded-full bg-silver-600" />
                                <span className="w-1.5 h-1.5 rounded-full bg-silver-700" />
                            </div>
                            <span className="font-mono text-silver-600" style={{ fontSize: '10px' }}>
                                Lumin.ai v1.0
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.aside>
    )
}
