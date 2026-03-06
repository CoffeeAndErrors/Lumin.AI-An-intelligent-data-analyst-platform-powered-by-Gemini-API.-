import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

export default function UploadZone() {
    const { uploadStatus, uploadError, metadata, setSession, setEDA, setUploadStatus, clearAll } = useStore()
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)

    const handleFile = useCallback(
        async (file) => {
            if (!file) return

            const ext = file.name.split('.').pop().toLowerCase()
            if (!['csv', 'xlsx', 'xls'].includes(ext)) {
                setUploadStatus('error', 'Only CSV and XLSX files are supported')
                return
            }

            setUploadStatus('uploading')

            try {
                const formData = new FormData()
                formData.append('file', file)

                const uploadRes = await fetch('/upload', { method: 'POST', body: formData })
                if (!uploadRes.ok) {
                    const err = await uploadRes.json()
                    throw new Error(err.error || 'Upload failed')
                }
                const { sessionId, metadata } = await uploadRes.json()
                setSession(sessionId, metadata)

                setUploadStatus('processing')

                const edaRes = await fetch('/eda', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                })
                if (!edaRes.ok) {
                    const err = await edaRes.json()
                    throw new Error(err.error || 'EDA computation failed')
                }
                const eda = await edaRes.json()
                setEDA(eda)
                setUploadStatus('ready')
            } catch (err) {
                setUploadStatus('error', err.message)
            }
        },
        [setSession, setEDA, setUploadStatus]
    )

    const onDrop = useCallback(
        (e) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files[0]
            handleFile(file)
        },
        [handleFile]
    )

    const onDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }
    const onDragLeave = () => setIsDragging(false)

    const onInputChange = (e) => {
        const file = e.target.files[0]
        handleFile(file)
        e.target.value = ''
    }

    if (uploadStatus === 'ready' && metadata) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-silver-700 bg-surface"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c8c8c" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div className="min-w-0">
                            <p className="font-mono text-[11px] text-silver-200 font-medium truncate max-w-[120px]">
                                {metadata.filename}
                            </p>
                            <p className="font-mono text-[10px] text-silver-500">
                                {metadata.rows?.toLocaleString()} × {metadata.cols}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={clearAll}
                        className="text-silver-600 hover:text-silver-300 transition-colors flex-shrink-0 mt-0.5"
                        title="Clear dataset"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </motion.div>
        )
    }

    if (uploadStatus === 'uploading') {
        return (
            <div className="p-3 rounded-xl border border-silver-800 bg-surface">
                <div className="w-full bg-silver-900 rounded-full h-1 mb-2 overflow-hidden">
                    <motion.div
                        className="h-full bg-silver-400 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '90%' }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                    />
                </div>
                <motion.p
                    className="font-mono text-[10px] text-silver-500 text-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    Uploading...
                </motion.p>
            </div>
        )
    }

    if (uploadStatus === 'processing') {
        return (
            <div className="p-3 rounded-xl border border-silver-800 bg-surface flex items-center justify-center gap-2 min-h-[60px]">
                <motion.div
                    className="w-3 h-3 rounded-full bg-silver-400"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="font-mono text-[10px] text-silver-500">Analyzing...</p>
            </div>
        )
    }

    return (
        <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={onInputChange}
                className="hidden"
            />

            <motion.div
                animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative rounded-xl overflow-hidden"
            >
                {/* SVG dashed border */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                >
                    <rect
                        x="1" y="1"
                        width="calc(100% - 2px)" height="calc(100% - 2px)"
                        rx="11" ry="11"
                        fill="none"
                        stroke={isDragging ? '#b8b8b8' : '#404040'}
                        strokeWidth="1"
                        strokeDasharray="6 4"
                        className={isDragging ? '' : 'dash-move-anim'}
                        style={{ transition: 'stroke 0.2s' }}
                    />
                </svg>

                <motion.div
                    className="relative flex flex-col items-center justify-center gap-2 py-6 px-4"
                    style={{
                        background: isDragging ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.005)',
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#646464" strokeWidth="1.5">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                    <p className="font-display text-silver-400 text-xs text-center">
                        Drop your dataset
                    </p>
                    <p className="font-mono text-silver-600 text-[10px]">CSV · XLSX · up to 100MB</p>

                    {uploadStatus === 'error' && (
                        <p className="font-mono text-red-400 text-[10px] text-center">
                            {uploadError || 'Upload failed'}
                        </p>
                    )}
                </motion.div>
            </motion.div>
        </div>
    )
}
