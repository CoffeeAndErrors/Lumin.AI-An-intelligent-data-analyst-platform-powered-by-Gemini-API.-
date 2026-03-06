import { motion } from 'framer-motion'
import { useStore } from '../store'

export default function Topbar() {
    const { uploadStatus, metadata, clearAll } = useStore()

    return (
        <header
            className="flex items-center justify-between px-6 flex-shrink-0"
            style={{
                height: 56,
                background: 'rgba(8,8,8,0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}
        >
            {/* ── Logo ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
                {/* Geometric logo mark */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" stroke="#b8b8b8" strokeWidth="1.5" />
                    <polygon points="12,7 17,9.5 17,14.5 12,17 7,14.5 7,9.5" fill="rgba(180,180,180,0.15)" stroke="#646464" strokeWidth="1" />
                    <circle cx="12" cy="12" r="2" fill="#d4d4d4" />
                </svg>
                <span className="font-display font-bold text-lg text-silver-100">Lumin</span>
                <span className="font-display font-bold text-lg chrome-text">.ai</span>
            </div>

            {/* ── Right section ─────────────────────────────────── */}
            <div className="flex items-center gap-4">
                {/* Upload status chip */}
                {uploadStatus === 'uploading' && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full bg-silver-400"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="font-mono text-xs text-silver-400">Uploading...</span>
                    </motion.div>
                )}

                {uploadStatus === 'processing' && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full bg-silver-400"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="font-mono text-xs text-silver-400">Analyzing...</span>
                    </motion.div>
                )}

                {uploadStatus === 'ready' && metadata && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-mono text-xs text-silver-400 max-w-[160px] truncate">
                            {metadata.filename}
                        </span>
                    </motion.div>
                )}

                {uploadStatus === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="font-mono text-xs text-red-400">Upload failed</span>
                    </motion.div>
                )}

                {/* New Analysis button */}
                {uploadStatus === 'ready' && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={clearAll}
                        className="btn-ghost text-xs font-mono rounded-lg px-3 py-1.5"
                    >
                        New Analysis
                    </motion.button>
                )}
            </div>
        </header>
    )
}
