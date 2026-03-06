import { motion } from 'framer-motion'

export default function LoadingOrb({ text = 'Analyzing...' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
                {/* Outer ring */}
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 60,
                        height: 60,
                        border: '1px solid #2a2a2a',
                    }}
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
                {/* Inner orb */}
                <motion.div
                    className="rounded-full"
                    style={{
                        width: 40,
                        height: 40,
                        background: 'radial-gradient(circle, #8c8c8c 0%, transparent 70%)',
                    }}
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            </div>
            <motion.p
                className="font-mono text-xs text-silver-500 tracking-wider"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {text}
            </motion.p>
        </div>
    )
}
