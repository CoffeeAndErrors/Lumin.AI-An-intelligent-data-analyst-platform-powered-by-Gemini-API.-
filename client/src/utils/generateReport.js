import jsPDF from 'jspdf'

/* ═══════════════════════════════════════════════════════════════════════
   COLORS  (RGB arrays)
   ═══════════════════════════════════════════════════════════════════════ */
const C = {
    void: [8, 8, 8], surface: [15, 15, 15], elevated: [20, 20, 20],
    s100: [232, 232, 232], s200: [212, 212, 212], s300: [184, 184, 184],
    s400: [140, 140, 140], s500: [100, 100, 100], s600: [64, 64, 64],
    s700: [42, 42, 42], s800: [26, 26, 26],
    green: [34, 197, 94], amber: [245, 158, 11],
    orange: [249, 115, 22], red: [239, 68, 68],
}

/* ═══════════════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */
const PW = 210, PH = 297
const ML = 18, MR = 18
const CW = PW - ML - MR          // 174
const CONTENT_TOP = 36
const MAX_Y = PH - 30            // 267 — trigger new page before this

/* ═══════════════════════════════════════════════════════════════════════
   FORMATTING HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const fmt = (v, d = 0) => {
    if (v === null || v === undefined || isNaN(v)) return '--'
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAWING PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════ */
function drawPageBg(doc) {
    doc.setFillColor(...C.void)
    doc.rect(0, 0, PW, PH, 'F')
}

function drawSpotlight(doc) {
    const steps = 12, h = 50
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1)
        const v = 8 + Math.round(7 * Math.pow(1 - t, 2))
        doc.setFillColor(v, v, v)
        doc.rect(PW * 0.1, i * (h / steps), PW * 0.8, h / steps + 0.2, 'F')
    }
}

function drawChromeLine(doc, x, y, w) {
    const segs = 30, segW = w / segs
    for (let i = 0; i < segs; i++) {
        const t = i / (segs - 1)
        const f = 1 - 2 * Math.abs(t - 0.5)
        const v = Math.round(180 - f * 68)
        doc.setFillColor(v, v, v)
        doc.rect(x + i * segW, y, segW + 0.05, 0.4, 'F')
    }
}

function drawChromeBarV(doc, x, y, h) {
    const segs = 15, segH = h / segs
    for (let i = 0; i < segs; i++) {
        const t = i / (segs - 1)
        const f = 1 - 2 * Math.abs(t - 0.5)
        const v = Math.round(180 - f * 68)
        doc.setFillColor(v, v, v)
        doc.rect(x, y + i * segH, 2.5, segH + 0.05, 'F')
    }
}

function drawLogo(doc, x, y) {
    const r = 4.5
    const pts = [], pts2 = []
    for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2
        pts.push([x + r * Math.cos(a), y + r * Math.sin(a)])
        pts2.push([x + r * 0.45 * Math.cos(a), y + r * 0.45 * Math.sin(a)])
    }
    doc.setDrawColor(...C.s300); doc.setLineWidth(0.3)
    for (let i = 0; i < 6; i++) doc.line(pts[i][0], pts[i][1], pts[(i + 1) % 6][0], pts[(i + 1) % 6][1])
    doc.setDrawColor(...C.s500); doc.setLineWidth(0.2)
    for (let i = 0; i < 6; i++) doc.line(pts2[i][0], pts2[i][1], pts2[(i + 1) % 6][0], pts2[(i + 1) % 6][1])
    doc.setFillColor(...C.s200); doc.circle(x, y, 0.8, 'F')
}

function drawHeader(doc, filename, dateStr) {
    drawLogo(doc, ML + 5, 12)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.s100)
    doc.text('DATUM', ML + 12, 13.5)
    doc.setTextColor(...C.s300); doc.text('.AI', ML + 12 + doc.getTextWidth('DATUM'), 13.5)
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.s500)
    doc.text(filename, PW - MR, 11, { align: 'right' })
    doc.text(dateStr, PW - MR, 15, { align: 'right' })
    drawChromeLine(doc, ML, 20, CW)
}

function drawFooter(doc, pageNum, totalPages) {
    const fy = PH - 14
    drawChromeLine(doc, ML, fy, CW)
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.s500)
    doc.text(`${pageNum} / ${totalPages}`, PW / 2, fy + 6, { align: 'center' })
    doc.text('DATUM.AI Summary Report', ML, fy + 6)
}

function initPage(doc, filename, dateStr) {
    drawPageBg(doc)
    drawSpotlight(doc)
    drawHeader(doc, filename, dateStr)
}

function ensureSpace(doc, y, needed, ctx) {
    if (y + needed > MAX_Y) {
        doc.addPage()
        initPage(doc, ctx.filename, ctx.dateStr)
        return CONTENT_TOP
    }
    return y
}

function drawSectionHeading(doc, y, tag, title) {
    doc.setFont('courier', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.s500)
    doc.text(tag.toUpperCase(), ML, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...C.s100)
    doc.text(title, ML, y + 8)
    return y + 16
}

function drawBadge(doc, x, y, text, bg, fg) {
    doc.setFont('courier', 'normal'); doc.setFontSize(6.5)
    const tw = doc.getTextWidth(text) + 4
    doc.setFillColor(...bg); doc.roundedRect(x, y - 3.5, tw, 5, 1, 1, 'F')
    doc.setTextColor(...fg); doc.text(text, x + 2, y)
    return tw
}

/* ═══════════════════════════════════════════════════════════════════════
   METRIC CARD
   ═══════════════════════════════════════════════════════════════════════ */
function drawMetricCard(doc, x, y, w, h, value, label, accent) {
    doc.setFillColor(...C.surface); doc.roundedRect(x, y, w, h, 2, 2, 'F')
    doc.setDrawColor(...C.s700); doc.setLineWidth(0.2); doc.roundedRect(x, y, w, h, 2, 2, 'S')
    const accentColor = accent || C.s300
    doc.setFillColor(...accentColor); doc.rect(x + 4, y + 1, w - 8, 1, 'F')
    doc.setFont('courier', 'normal'); doc.setFontSize(14); doc.setTextColor(...C.s100)
    const valStr = String(value)
    const valLines = doc.splitTextToSize(valStr, w - 8)
    doc.text(valLines[0] || '--', x + w / 2, y + h / 2 - 1, { align: 'center' })
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.s500)
    doc.text(label.toUpperCase(), x + w / 2, y + h / 2 + 6, { align: 'center' })
}

/* ═══════════════════════════════════════════════════════════════════════
   FINDING CARD
   ═══════════════════════════════════════════════════════════════════════ */
function drawFindingCard(doc, y, num, headline, evidence, badge, ctx) {
    const cardH = 24
    const ny = ensureSpace(doc, y, cardH + 4, ctx)
    doc.setFillColor(...C.surface); doc.roundedRect(ML, ny, CW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.s700); doc.setLineWidth(0.15); doc.roundedRect(ML, ny, CW, cardH, 2, 2, 'S')
    drawChromeBarV(doc, ML, ny, cardH)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C.s200)
    doc.text(`${num}.  ${headline}`, ML + 6, ny + 8)
    doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.s400)
    const evLines = doc.splitTextToSize(evidence, CW - 50)
    doc.text(evLines, ML + 6, ny + 14)
    if (badge) drawBadge(doc, PW - MR - 36, ny + 4, badge, C.s700, C.s300)
    return ny + cardH + 4
}

/* ═══════════════════════════════════════════════════════════════════════
   RISK CARD
   ═══════════════════════════════════════════════════════════════════════ */
function severityColor(sev) {
    if (sev === 'CRITICAL') return C.red
    if (sev === 'HIGH') return C.orange
    if (sev === 'MEDIUM') return C.amber
    return C.s400
}

function drawRiskCard(doc, y, title, severity, details, explanation, action, ctx) {
    doc.setFont('courier', 'normal'); doc.setFontSize(7)
    const explLines = doc.splitTextToSize(explanation, CW - 14)
    const cardH = 28 + explLines.length * 3
    const ny = ensureSpace(doc, y, cardH + 4, ctx)
    const sc = severityColor(severity)
    doc.setFillColor(...C.surface); doc.roundedRect(ML, ny, CW, cardH, 2, 2, 'F')
    doc.setDrawColor(...C.s700); doc.setLineWidth(0.15); doc.roundedRect(ML, ny, CW, cardH, 2, 2, 'S')
    doc.setFillColor(...sc); doc.rect(ML, ny + 2, 2.5, cardH - 4, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C.s200)
    doc.text(title, ML + 6, ny + 7)
    drawBadge(doc, PW - MR - 28, ny + 3.5, severity, sc, C.void)
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.s400)
    doc.text(details, ML + 6, ny + 13)
    doc.setTextColor(...C.s500); doc.text(explLines, ML + 6, ny + 19)
    const actionY = ny + 19 + explLines.length * 3
    doc.setTextColor(...C.s300); doc.text('> ' + action, ML + 6, actionY)
    return ny + cardH + 4
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA COMPUTATIONS
   ═══════════════════════════════════════════════════════════════════════ */
function computeFindings(eda) {
    const findings = []
    const { topCorrelations, statistics, categoricalFrequency, overview } = eda || {}

    // A — Highest correlation pair
    if (topCorrelations?.length > 0) {
        const top = topCorrelations.reduce((a, b) => Math.abs(a.value) > Math.abs(b.value) ? a : b)
        const abs = Math.abs(top.value)
        let cls = 'Weak'
        if (abs >= 0.7 && top.value > 0) cls = 'Strong Positive'
        else if (abs >= 0.7 && top.value < 0) cls = 'Strong Negative'
        else if (abs >= 0.4 && top.value > 0) cls = 'Moderate Positive'
        else if (abs >= 0.4 && top.value < 0) cls = 'Moderate Negative'
        findings.push({
            headline: `Strongest Correlation: ${top.col1} & ${top.col2}`,
            evidence: `r = ${top.value.toFixed(3)} (${cls})`,
            badge: 'STRONG CORRELATION',
        })
    }

    // B — Most variable column (highest CV)
    if (statistics?.length > 0) {
        let best = null, bestCV = 0
        statistics.forEach(s => {
            if (s.mean != null && s.std != null && s.mean !== 0) {
                const cv = Math.abs(s.std / s.mean)
                if (cv > bestCV) { bestCV = cv; best = s }
            }
        })
        if (best) {
            findings.push({
                headline: `Most Variable Column: ${best.col}`,
                evidence: `Std = ${fmt(best.std, 2)}, Mean = ${fmt(best.mean, 2)}, CV = ${(bestCV * 100).toFixed(1)}%`,
                badge: 'HIGH VARIABILITY',
            })
        }
    }

    // C — Widest range
    if (statistics?.length > 0) {
        let best = null, bestR = 0
        statistics.forEach(s => {
            if (s.min != null && s.max != null) {
                const r = s.max - s.min
                if (r > bestR) { bestR = r; best = s }
            }
        })
        if (best) {
            findings.push({
                headline: `Widest Range: ${best.col}`,
                evidence: `Min: ${fmt(best.min, 2)} to Max: ${fmt(best.max, 2)} | Range: ${fmt(bestR, 2)}`,
                badge: 'WIDE RANGE',
            })
        }
    }

    // D — Skew detection
    if (statistics?.length > 0) {
        const skewed = []
        statistics.forEach(s => {
            if (s.mean != null && s.median != null && Math.abs(s.median) > 0) {
                const ratio = (s.mean - s.median) / Math.abs(s.median)
                if (ratio > 0.15) skewed.push({ col: s.col, mean: s.mean, median: s.median, dir: 'Right-skewed' })
                else if (ratio < -0.15) skewed.push({ col: s.col, mean: s.mean, median: s.median, dir: 'Left-skewed' })
            }
        })
        if (skewed.length > 0) {
            const ev = skewed.map(s => `${s.col}: mean=${fmt(s.mean, 2)}, median=${fmt(s.median, 2)} (${s.dir})`).join('; ')
            findings.push({ headline: `Skewed Distributions Detected (${skewed.length})`, evidence: ev, badge: 'SKEWED DISTRIBUTION' })
        } else {
            findings.push({
                headline: 'Distribution Symmetry',
                evidence: 'All numeric distributions appear approximately symmetric.',
                badge: 'SYMMETRIC',
            })
        }
    }

    // E — Dominant categorical value
    if (categoricalFrequency) {
        Object.entries(categoricalFrequency).forEach(([col, freqMap]) => {
            const entries = Object.entries(freqMap)
            if (entries.length === 0) return
            const total = entries.reduce((s, [, c]) => s + c, 0)
            entries.sort((a, b) => b[1] - a[1])
            const [topVal, topCount] = entries[0]
            const p = (topCount / total) * 100
            if (p > 50) {
                findings.push({
                    headline: `Dominant Category in "${col}": "${topVal}"`,
                    evidence: `"${topVal}" accounts for ${p.toFixed(1)}% of values in this column.`,
                    badge: 'DOMINANT CATEGORY',
                })
            }
        })
    }

    // F — Correlation cluster / hub
    if (topCorrelations?.length >= 3) {
        const highCorrs = topCorrelations.filter(c => Math.abs(c.value) > 0.6)
        if (highCorrs.length >= 3) {
            const counts = {}
            highCorrs.forEach(c => { counts[c.col1] = (counts[c.col1] || 0) + 1; counts[c.col2] = (counts[c.col2] || 0) + 1 })
            const hub = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
            if (hub) {
                const related = highCorrs.filter(c => c.col1 === hub[0] || c.col2 === hub[0])
                    .map(c => c.col1 === hub[0] ? c.col2 : c.col1)
                findings.push({
                    headline: `Correlation Hub: ${hub[0]}`,
                    evidence: `Correlated with: ${related.join(', ')}`,
                    badge: 'CORRELATION CLUSTER',
                })
            }
        }
    }

    return findings
}

function computeQualityScore(eda) {
    let score = 100
    const nullPct = eda.overview?.nullPercent || 0
    score -= nullPct
    if ((eda.overview?.duplicateRows || 0) > 0) score -= 5
    const mv = eda.missingValues || []
    if (mv.some(m => m.percent > 30)) score -= 5
    const totalCols = eda.overview?.cols || 0
    const colsWithNulls = mv.filter(m => m.count > 0).length
    if (totalCols > 0 && colsWithNulls > totalCols / 2) score -= 5
    return Math.max(0, Math.round(score))
}

function computeRisks(eda) {
    const risks = []
    const { overview, missingValues, statistics, topCorrelations, categoricalFrequency } = eda || {}
    const nullPct = overview?.nullPercent || 0
    const rows = overview?.rows || 0

    // 1 — High null exposure
    if (nullPct > 10) {
        let sev = 'MEDIUM'
        if (nullPct > 40) sev = 'CRITICAL'
        else if (nullPct > 20) sev = 'HIGH'
        const worst = (missingValues || []).sort((a, b) => b.percent - a.percent).slice(0, 3).map(m => m.col).join(', ')
        risks.push({
            title: 'HIGH NULL EXPOSURE', severity: sev,
            details: `Overall null rate: ${nullPct.toFixed(1)}%. Primary contributors: ${worst || 'N/A'}`,
            explanation: 'Missing values can introduce bias in aggregations and mislead trend analysis if not handled through imputation or exclusion.',
            action: 'Investigate root cause of missingness and apply appropriate imputation strategy.',
        })
    }

    // 2 — Duplicate data contamination
    if ((overview?.duplicateRows || 0) > 0) {
        const d = overview.duplicateRows
        const p = rows > 0 ? ((d / rows) * 100).toFixed(1) : '?'
        risks.push({
            title: 'DUPLICATE DATA CONTAMINATION', severity: d > rows * 0.1 ? 'HIGH' : 'MEDIUM',
            details: `${fmt(d)} duplicate rows found (${p}% of dataset).`,
            explanation: 'Duplicate rows inflate counts, distort averages, and can cause double-counting in aggregate reports.',
            action: 'Remove duplicate rows before performing any statistical analysis.',
        })
    }

    // 3 — Extreme outlier exposure
    if (statistics?.length > 0) {
        const outlierCols = []
        statistics.forEach(s => {
            if (s.q25 != null && s.q75 != null && s.max != null) {
                const iqr = s.q75 - s.q25
                if (iqr > 0 && (s.max - s.q75) > 3 * iqr) outlierCols.push(s.col)
            }
        })
        if (outlierCols.length > 0) {
            risks.push({
                title: 'EXTREME OUTLIER EXPOSURE', severity: outlierCols.length > 3 ? 'HIGH' : 'MEDIUM',
                details: `Affected columns: ${outlierCols.join(', ')}`,
                explanation: 'Extreme outliers can severely distort mean-based metrics and regression models.',
                action: 'Apply outlier capping (winsorization) or use robust statistical methods.',
            })
        }
    }

    // 4 — Skewed distribution impact
    if (statistics?.length > 0) {
        const skewed = []
        statistics.forEach(s => {
            if (s.mean != null && s.median != null && Math.abs(s.median) > 0) {
                const ratio = (s.mean - s.median) / Math.abs(s.median)
                if (Math.abs(ratio) > 0.15) skewed.push(s.col)
            }
        })
        if (skewed.length > 0) {
            risks.push({
                title: 'SKEWED DISTRIBUTION IMPACT', severity: skewed.length > 3 ? 'HIGH' : 'MEDIUM',
                details: `Skewed columns: ${skewed.join(', ')}`,
                explanation: 'Heavily skewed columns make mean an unreliable central tendency measure. Median should be preferred for those columns.',
                action: 'Use median instead of mean for skewed columns. Consider log transform if modeling.',
            })
        }
    }

    // 5 — High cardinality categorical
    if (categoricalFrequency) {
        Object.entries(categoricalFrequency).forEach(([col, freqMap]) => {
            const distinct = Object.keys(freqMap).length
            if (distinct > 20) {
                risks.push({
                    title: 'HIGH CARDINALITY CATEGORICAL', severity: distinct > 100 ? 'HIGH' : 'MEDIUM',
                    details: `Column "${col}" has ${distinct} distinct values.`,
                    explanation: 'High cardinality columns are expensive to encode for modeling and may require grouping or hashing strategies.',
                    action: `Group rare categories in "${col}" or use target/hash encoding.`,
                })
            }
        })
    }

    // 6 — Dominant category bias
    if (categoricalFrequency) {
        Object.entries(categoricalFrequency).forEach(([col, freqMap]) => {
            const entries = Object.entries(freqMap)
            const total = entries.reduce((s, [, c]) => s + c, 0)
            if (total === 0) return
            entries.sort((a, b) => b[1] - a[1])
            const [topVal, topCount] = entries[0]
            const p = (topCount / total) * 100
            if (p > 70) {
                risks.push({
                    title: 'DOMINANT CATEGORY BIAS', severity: p > 90 ? 'HIGH' : 'MEDIUM',
                    details: `"${topVal}" in "${col}" accounts for ${p.toFixed(1)}% of rows.`,
                    explanation: 'A dominant category can cause class imbalance issues in classification models.',
                    action: 'Consider oversampling minority classes or using class weights in models.',
                })
            }
        })
    }

    // 7 — Multicollinearity warning
    if (topCorrelations?.length > 0) {
        const highPairs = topCorrelations.filter(c => Math.abs(c.value) > 0.85)
        if (highPairs.length >= 3) {
            const pairStr = highPairs.slice(0, 5).map(c => `${c.col1} & ${c.col2} (${c.value.toFixed(3)})`).join('; ')
            risks.push({
                title: 'MULTICOLLINEARITY WARNING', severity: 'HIGH',
                details: `${highPairs.length} highly correlated pairs: ${pairStr}`,
                explanation: 'Highly correlated input columns in a model can destabilize coefficient estimates and reduce model interpretability.',
                action: 'Remove or combine redundant features before modeling.',
            })
        }
    }

    // 8 — Sparse dataset warning
    if (rows > 0 && rows < 500) {
        risks.push({
            title: 'SPARSE DATASET WARNING', severity: rows < 100 ? 'HIGH' : 'MEDIUM',
            details: `Dataset contains only ${fmt(rows)} rows.`,
            explanation: 'With fewer than 500 rows, statistical findings may lack significance and machine learning models may overfit.',
            action: 'Collect more data if possible, or use cross-validation and regularization.',
        })
    }

    return risks
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION RENDERERS
   ═══════════════════════════════════════════════════════════════════════ */

function renderTitle(doc, y, filename, ctx) {
    y = ensureSpace(doc, y, 36, ctx)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...C.s100)
    doc.text('EDA SUMMARY REPORT', PW / 2, y, { align: 'center' })
    drawChromeLine(doc, ML + 30, y + 4, CW - 60)
    doc.setFont('courier', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.s400)
    doc.text(filename, PW / 2, y + 12, { align: 'center' })
    doc.setFontSize(7); doc.setTextColor(...C.s500)
    doc.text(ctx.dateStr, PW / 2, y + 18, { align: 'center' })
    return y + 28
}

function renderSection1(doc, y, eda, metadata, ctx) {
    y = ensureSpace(doc, y, 90, ctx)
    drawChromeLine(doc, ML, y, CW)
    y = drawSectionHeading(doc, y + 4, 'SECTION 01', 'Dataset Overview')

    const rows = eda.overview?.rows ?? metadata?.rows ?? 0
    const cols = eda.overview?.cols ?? metadata?.cols ?? 0
    const mem = eda.overview?.memoryKB
    const nullPct = eda.overview?.nullPercent ?? 0
    const dupes = eda.overview?.duplicateRows ?? 0
    const dtypes = eda.dtypeCounts || {}
    const totalCols = cols || 1

    const numPct = ((dtypes.numeric || 0) / totalCols * 100).toFixed(0)
    const catPct = ((dtypes.categorical || 0) / totalCols * 100).toFixed(0)
    const dtPct = ((dtypes.datetime || 0) / totalCols * 100).toFixed(0)

    const completeness = (100 - nullPct).toFixed(1)
    let compAccent = C.green
    if (nullPct > 20) compAccent = C.red
    else if (nullPct > 5) compAccent = C.amber

    const dupeLabel = dupes === 0 ? 'CLEAN' : `${fmt(dupes)} (${(dupes / (rows || 1) * 100).toFixed(1)}%)`
    const dupeAccent = dupes === 0 ? C.green : C.amber

    const cardW = (CW - 18) / 3, cardH = 28, gap = 9
    const cards = [
        { v: fmt(rows), l: 'Total Rows' },
        { v: fmt(cols), l: 'Total Columns' },
        { v: `N:${dtypes.numeric || 0}(${numPct}%) C:${dtypes.categorical || 0}(${catPct}%) D:${dtypes.datetime || 0}(${dtPct}%)`, l: 'Column Composition' },
        { v: mem != null ? `${fmt(mem, 1)} KB` : '--', l: 'Memory Footprint' },
        { v: `${completeness}%`, l: 'Data Completeness', accent: compAccent },
        { v: dupeLabel, l: 'Duplicate Rows', accent: dupeAccent },
    ]

    cards.forEach((c, i) => {
        const col = i % 3, row = Math.floor(i / 3)
        const cx = ML + col * (cardW + gap), cy = y + row * (cardH + 8)
        drawMetricCard(doc, cx, cy, cardW, cardH, c.v, c.l, c.accent)
    })

    return y + 2 * (cardH + 8) + 6
}

function renderSection2(doc, y, findings, ctx) {
    y = ensureSpace(doc, y, 40, ctx)
    drawChromeLine(doc, ML, y, CW)
    y = drawSectionHeading(doc, y + 4, 'SECTION 02', 'Key EDA Findings')

    findings.forEach((f, i) => {
        y = drawFindingCard(doc, y, i + 1, f.headline, f.evidence, f.badge, ctx)
    })
    return y + 4
}

function renderSection3(doc, y, eda, metadata, ctx) {
    y = ensureSpace(doc, y, 60, ctx)
    drawChromeLine(doc, ML, y, CW)
    y = drawSectionHeading(doc, y + 4, 'SECTION 03', 'Missing Values & Data Quality')

    // Quality Score
    const score = computeQualityScore(eda)
    let scoreLabel = 'EXCELLENT', scoreAccent = C.green
    if (score < 50) { scoreLabel = 'CRITICAL'; scoreAccent = C.red }
    else if (score < 75) { scoreLabel = 'NEEDS ATTENTION'; scoreAccent = C.amber }
    else if (score < 90) { scoreLabel = 'GOOD'; scoreAccent = C.s400 }

    const scoreCardW = 80, scoreCardH = 32
    doc.setFillColor(...C.surface); doc.roundedRect(ML, y, scoreCardW, scoreCardH, 2, 2, 'F')
    doc.setDrawColor(...C.s700); doc.setLineWidth(0.15); doc.roundedRect(ML, y, scoreCardW, scoreCardH, 2, 2, 'S')
    doc.setFillColor(...scoreAccent); doc.rect(ML + 8, y + 1, scoreCardW - 16, 1.2, 'F')
    doc.setFont('courier', 'normal'); doc.setFontSize(22); doc.setTextColor(...C.s100)
    doc.text(String(score), ML + scoreCardW / 2, y + 16, { align: 'center' })
    doc.setFontSize(7); doc.setTextColor(...C.s500)
    doc.text('DATA QUALITY SCORE', ML + scoreCardW / 2, y + 22, { align: 'center' })
    drawBadge(doc, ML + scoreCardW / 2 - 12, y + 28, scoreLabel, scoreAccent, score >= 90 ? C.void : C.s100)

    y += scoreCardH + 8

    // Missing Values Table
    const mv = (eda.missingValues || []).filter(m => m.count > 0).sort((a, b) => b.percent - a.percent)
    if (mv.length === 0) {
        y = ensureSpace(doc, y, 14, ctx)
        doc.setFillColor(...C.surface); doc.roundedRect(ML, y, CW, 12, 2, 2, 'F')
        doc.setFont('courier', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.green)
        doc.text('[OK]  Dataset is 100% complete -- no missing values detected.', ML + 6, y + 7.5)
        y += 18
    } else {
        // Table header
        y = ensureSpace(doc, y, 12, ctx)
        const colWidths = [60, 30, 50, 34]
        const headers = ['COLUMN', 'MISSING', 'PERCENT', 'SEVERITY']
        doc.setFillColor(...C.s800); doc.rect(ML, y, CW, 7, 'F')
        doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.s500)
        let hx = ML + 3
        headers.forEach((h, i) => { doc.text(h, hx, y + 5); hx += colWidths[i] })
        y += 7

        // Table rows
        const maxBar = 40
        mv.forEach((m, i) => {
            y = ensureSpace(doc, y, 7, ctx)
            const bg = i % 2 === 0 ? C.surface : C.elevated
            let sevLabel = 'TRACE', sevColor = C.s500
            if (m.percent > 30) { sevLabel = 'CRITICAL'; sevColor = C.red }
            else if (m.percent > 15) { sevLabel = 'HIGH'; sevColor = C.orange }
            else if (m.percent > 5) { sevLabel = 'MODERATE'; sevColor = C.amber }
            else if (m.percent >= 1) { sevLabel = 'LOW'; sevColor = C.s400 }

            const isCritical = sevLabel === 'CRITICAL'
            if (isCritical) {
                doc.setFillColor(40, 25, 10); doc.rect(ML, y, CW, 6.5, 'F')
            } else {
                doc.setFillColor(...bg); doc.rect(ML, y, CW, 6.5, 'F')
            }

            doc.setFont('courier', 'normal'); doc.setFontSize(7)
            let rx = ML + 3
            doc.setTextColor(...C.s300); doc.text(m.col.length > 22 ? m.col.slice(0, 22) + '..' : m.col, rx, y + 4.5)
            rx += colWidths[0]
            doc.setTextColor(...C.s200); doc.text(fmt(m.count), rx, y + 4.5)
            rx += colWidths[1]
            // Percentage bar
            const barW = Math.max(1, (m.percent / 100) * maxBar)
            doc.setFillColor(...sevColor); doc.rect(rx, y + 1.5, barW, 3, 'F')
            doc.setTextColor(...C.s200); doc.text(`${m.percent.toFixed(1)}%`, rx + maxBar + 2, y + 4.5)
            rx += colWidths[2]
            doc.setTextColor(...sevColor); doc.text(sevLabel, rx, y + 4.5)
            y += 6.5
        })
        y += 4

        // Null distribution insight
        y = ensureSpace(doc, y, 16, ctx)
        const affected = mv.length
        const totalCols = eda.overview?.cols || 1
        const affectedPct = ((affected / totalCols) * 100).toFixed(1)
        const worst = mv[0]
        const spread = (affected / totalCols) >= 0.2 ? 'spread broadly across' : 'isolated to a few columns of'

        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.s300)
        doc.text('Null Distribution Insight', ML, y)
        doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.s400)
        const insight = `${affected} of ${totalCols} columns (${affectedPct}%) have missing values. Worst: "${worst.col}" at ${worst.percent.toFixed(1)}%. Missing values are ${spread} the dataset.`
        const insightLines = doc.splitTextToSize(insight, CW - 4)
        doc.text(insightLines, ML, y + 5)
        y += 5 + insightLines.length * 3 + 4
    }

    // Duplicate row analysis
    y = ensureSpace(doc, y, 14, ctx)
    const dupes = eda.overview?.duplicateRows ?? 0
    const totalRows = eda.overview?.rows ?? metadata?.rows ?? 0
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.s300)
    doc.text('Duplicate Row Analysis', ML, y)
    doc.setFont('courier', 'normal'); doc.setFontSize(7)
    if (dupes === 0) {
        doc.setTextColor(...C.green); doc.text('[OK]  No duplicate rows detected.', ML, y + 5)
    } else {
        const dp = totalRows > 0 ? ((dupes / totalRows) * 100).toFixed(1) : '?'
        doc.setTextColor(...C.amber)
        doc.text(`${fmt(dupes)} duplicate rows (${dp}% of total). Removing these is recommended before statistical analysis.`, ML, y + 5)
    }
    return y + 12
}

function renderSection4(doc, y, risks, ctx) {
    y = ensureSpace(doc, y, 40, ctx)
    drawChromeLine(doc, ML, y, CW)
    y = drawSectionHeading(doc, y + 4, 'SECTION 04', 'Data Risk Factors')

    if (risks.length === 0) {
        y = ensureSpace(doc, y, 16, ctx)
        doc.setFillColor(...C.surface); doc.roundedRect(ML, y, CW, 14, 2, 2, 'F')
        doc.setFillColor(...C.green); doc.rect(ML, y + 2, 2.5, 10, 'F')
        doc.setFont('courier', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.green)
        doc.text('[OK]  No significant risk factors detected in this dataset.', ML + 8, y + 9)
        return y + 20
    }

    risks.forEach(r => {
        y = drawRiskCard(doc, y, r.title, r.severity, r.details, r.explanation, r.action, ctx)
    })
    return y + 4
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════ */
export default async function generateReport(edaResults, metadata) {
    if (!edaResults) return

    const doc = new jsPDF('p', 'mm', 'a4')
    const filename = metadata?.filename || edaResults.overview?.filename || 'Unknown'
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const ctx = { filename, dateStr }

    // Page 1
    initPage(doc, filename, dateStr)
    let y = CONTENT_TOP

    y = renderTitle(doc, y, filename, ctx)
    y = renderSection1(doc, y, edaResults, metadata, ctx)

    const findings = computeFindings(edaResults)
    if (findings.length > 0) {
        y = renderSection2(doc, y, findings, ctx)
    }

    y = renderSection3(doc, y, edaResults, metadata, ctx)

    const risks = computeRisks(edaResults)
    y = renderSection4(doc, y, risks, ctx)

    // Final pass — footers with page numbers
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        drawFooter(doc, i, totalPages)
    }

    // Download
    const cleanName = filename.replace(/\.[^.]+$/, '')
    const dateFile = new Date().toISOString().split('T')[0]
    doc.save(`DATUM-Summary-Report-${cleanName}-${dateFile}.pdf`)
}
