import { motion } from 'framer-motion'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
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
    cursor: { fill: 'rgba(255,255,255,0.03)' },
}

const AXIS_TICK = { fill: '#646464', fontFamily: 'IBM Plex Mono', fontSize: 10 }

const SILVER_GRADIENT_ID = 'silverGradient'
const AREA_GRADIENT_ID = 'areaGradient'

function GradientDefs() {
    return (
        <defs>
            <linearGradient id={SILVER_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4d4d4" />
                <stop offset="100%" stopColor="#404040" />
            </linearGradient>
            <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(180,180,180,0.2)" />
                <stop offset="100%" stopColor="rgba(180,180,180,0)" />
            </linearGradient>
        </defs>
    )
}

export default function ChartCard({ type = 'bar', title, data, dataKey, nameKey, height = 200, className = '' }) {
    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                        <GradientDefs />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey={nameKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey={dataKey} fill={`url(#${SILVER_GRADIENT_ID})`} radius={[3, 3, 0, 0]} />
                    </BarChart>
                )

            case 'line':
                return (
                    <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey={nameKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke="#b8b8b8"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#d4d4d4' }}
                        />
                    </LineChart>
                )

            case 'pie':
                return (
                    <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#646464' }} />
                        <Pie
                            data={data}
                            dataKey={dataKey || 'value'}
                            nameKey={nameKey || 'name'}
                            cx="50%"
                            cy="50%"
                            outerRadius={Math.floor(height * 0.35)}
                            strokeWidth={0}
                        >
                            {data?.map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                )

            case 'area':
                return (
                    <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                        <defs>
                            <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(180,180,180,0.2)" />
                                <stop offset="100%" stopColor="rgba(180,180,180,0)" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey={nameKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke="#b8b8b8"
                            strokeWidth={2}
                            fill={`url(#${AREA_GRADIENT_ID})`}
                            dot={false}
                        />
                    </AreaChart>
                )

            default:
                return null
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`card card-hover p-4 ${className}`}
        >
            {title && <p className="section-tag mb-3">{title}</p>}
            <ResponsiveContainer width="100%" height={height}>
                {renderChart()}
            </ResponsiveContainer>
        </motion.div>
    )
}
