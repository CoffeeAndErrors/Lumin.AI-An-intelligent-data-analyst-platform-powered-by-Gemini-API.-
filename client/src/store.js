import { create } from 'zustand'

export const useStore = create((set, get) => ({
    // ── Session ──────────────────────────────────────────────────────────────
    sessionId: null,
    metadata: null,
    edaResults: null,

    // ── UI ───────────────────────────────────────────────────────────────────
    activeFeature: 'eda',
    sidebarCollapsed: false,
    uploadStatus: 'idle',   // idle | uploading | processing | ready | error
    uploadError: null,

    // ── Story ────────────────────────────────────────────────────────────────
    story: {
        content: '',
        parsedSections: {},
        isStreaming: false,
        audience: 'EXECUTIVE',
        depth: 'Standard',
        generated: false,
    },

    // ── Chat ─────────────────────────────────────────────────────────────────
    messages: [],
    isThinking: false,
    suggestedQuestions: [],

    // ── Actions ──────────────────────────────────────────────────────────────
    setSession: (sessionId, metadata) =>
        set({ sessionId, metadata, uploadStatus: 'ready', uploadError: null }),

    setEDA: (edaResults) => {
        const questions = []
        const eda = edaResults
        if (eda.numericCols?.length > 0) {
            questions.push(`What is the distribution of ${eda.numericCols[0]}?`)
            questions.push(`Show me statistics for all numeric columns`)
        }
        if (eda.categoricalCols?.length > 0) {
            questions.push(`What are the top values in ${eda.categoricalCols[0]}?`)
        }
        if (eda.topCorrelations?.length > 0) {
            const c = eda.topCorrelations[0]
            questions.push(`Explain the correlation between ${c.col1} and ${c.col2}`)
        }
        questions.push('Are there any outliers or anomalies in this dataset?')
        questions.push('Summarize this dataset in 3 key points')
        questions.push('Which columns have the most missing data?')
        set({ edaResults, suggestedQuestions: questions })
    },

    setActiveFeature: (f) => set({ activeFeature: f }),

    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    setUploadStatus: (uploadStatus, uploadError = null) =>
        set({ uploadStatus, uploadError }),

    updateStory: (patch) =>
        set((s) => ({ story: { ...s.story, ...patch } })),

    setStoryContent: (content) => {
        const sections = {}
        const tagPattern =
            /\[(OVERVIEW|KEY_FINDING_\d+|ANOMALY|RECOMMENDATION)\]\s*([\s\S]*?)(?=\[(?:OVERVIEW|KEY_FINDING_\d+|ANOMALY|RECOMMENDATION)\]|$)/g
        let match
        while ((match = tagPattern.exec(content)) !== null) {
            sections[match[1]] = match[2].trim()
        }
        set((s) => ({
            story: { ...s.story, content, parsedSections: sections },
        }))
    },

    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

    updateLastMessage: (content) =>
        set((s) => {
            const msgs = [...s.messages]
            if (msgs.length > 0) {
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
            }
            return { messages: msgs }
        }),

    setThinking: (isThinking) => set({ isThinking }),

    clearChat: () => set({ messages: [], isThinking: false }),

    clearAll: () =>
        set({
            sessionId: null,
            metadata: null,
            edaResults: null,
            uploadStatus: 'idle',
            uploadError: null,
            story: {
                content: '',
                parsedSections: {},
                isStreaming: false,
                audience: 'EXECUTIVE',
                depth: 'Standard',
                generated: false,
            },
            messages: [],
            isThinking: false,
            suggestedQuestions: [],
        }),
}))
