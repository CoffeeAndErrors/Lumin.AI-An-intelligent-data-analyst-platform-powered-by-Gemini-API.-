# Lumin.AI — Comprehensive Project Report

> **"Illuminate Your Data"**
>
> Lumin.ai is an AI-powered data analysis platform that lets users upload datasets (CSV/XLSX),
> automatically performs Exploratory Data Analysis (EDA), generates AI-driven narratives
> about the data, and provides a conversational AI chatbot to ask questions about the dataset —
> all from a single, visually premium web interface.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack & Libraries](#3-technology-stack--libraries)
4. [Project Structure — File-by-File Breakdown](#4-project-structure--file-by-file-breakdown)
5. [Feature 1: File Upload & Parsing](#5-feature-1-file-upload--parsing)
6. [Feature 2: Exploratory Data Analysis (EDA)](#6-feature-2-exploratory-data-analysis-eda)
7. [Feature 3: AI Data Story Generation](#7-feature-3-ai-data-story-generation)
8. [Feature 4: Chat with Data](#8-feature-4-chat-with-data)
9. [Feature 5: PDF Summary Report Generation](#9-feature-5-pdf-summary-report-generation)
10. [Feature 6: Database Persistence with Prisma](#10-feature-6-database-persistence-with-prisma)
11. [State Management — Zustand Store](#11-state-management--zustand-store)
12. [Real-Time Streaming (SSE) — End-to-End](#12-real-time-streaming-sse--end-to-end)
13. [UI/UX Design System](#13-uiux-design-system)
14. [Data Flow — Complete End-to-End Pipeline](#14-data-flow--complete-end-to-end-pipeline)
15. [Environment Configuration](#15-environment-configuration)
16. [How to Run the Project](#16-how-to-run-the-project)

---

## 1. Project Overview

Lumin.ai is a **three-tier web application** that allows users to:

| Capability | Description |
|---|---|
| **Upload** | Drag-and-drop or click-to-upload CSV/XLSX files up to 100 MB |
| **Analyze** | Automatically compute 10+ types of statistical analysis on the uploaded data |
| **Narrate** | Generate structured AI-written narratives ("Data Stories") tailored to specific audiences |
| **Chat** | Ask plain-English questions about the data and get AI answers with inline charts |
| **Report** | Download a professional multi-page PDF summary report with findings, risk factors, and quality scores |

The project is split into **three independent services** that communicate over HTTP:

1. **Client** — React frontend (Vite)
2. **Server** — Node.js/Express gateway
3. **AI Engine** — Python/FastAPI backend powered by Google Gemini

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                         │
│                                                              │
│   React Frontend (Vite)        ──── Port 5173               │
│   ┌────────────┐ ┌───────────┐ ┌────────────┐              │
│   │ EDAExplorer│ │ DataStory │ │ChatWithData│              │
│   └─────┬──────┘ └─────┬─────┘ └─────┬──────┘              │
│         │              │              │                      │
│         └──────────────┼──────────────┘                      │
│                        │                                     │
│    Zustand Store <── state management ──> API calls          │
└────────────────────────┼─────────────────────────────────────┘
                         │  HTTP (REST + SSE)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              EXPRESS GATEWAY SERVER                          │
│                                                              │
│   Node.js + Express        ──── Port 3001                   │
│   ┌──────────┐ ┌──────┐ ┌───────┐ ┌──────┐                │
│   │ /upload  │ │ /eda │ │/story │ │/chat │                │
│   └─────┬────┘ └───┬──┘ └───┬───┘ └───┬──┘                │
│         │          │        │         │                      │
│   ┌─────▼──────┐   │        │         │                      │
│   │ parser.js  │   │        │         │                      │
│   │ CSV/XLSX   │   │   SSE pipe-through                     │
│   └────────────┘   │        │         │                      │
│                    │        │         │                      │
│   In-Memory Sessions Map    │         │                      │
│   + Prisma/SQLite (schema)  │         │                      │
└────────────────────┼────────┼─────────┼──────────────────────┘
                     │        │         │
                     │  HTTP  │  SSE    │  SSE
                     ▼        ▼         ▼
┌──────────────────────────────────────────────────────────────┐
│              FASTAPI AI ENGINE                               │
│                                                              │
│   Python + FastAPI         ──── Port 8000                   │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│   │ eda.py   │ │ story.py │ │ chat.py  │                   │
│   │ (pandas) │ │ (Gemini) │ │ (Gemini) │                   │
│   └──────────┘ └──────────┘ └──────────┘                   │
│                                                              │
│   Google Gemini API (generative AI)                         │
└──────────────────────────────────────────────────────────────┘
```

### How the Three Services Work Together

1. The **Client** (port 5173) is what the user sees in their browser. It sends HTTP requests to the **Server**.
2. The **Server** (port 3001) receives those requests, stores session data in memory, and forwards compute-heavy work to the **AI Engine**.
3. The **AI Engine** (port 8000) does the actual number-crunching (EDA with pandas/numpy) and AI generation (stories/chat with Google Gemini).

For AI features (story and chat), the response is **streamed** in real-time using Server-Sent Events (SSE), meaning the user sees text appear word-by-word, just like ChatGPT.

---

## 3. Technology Stack & Libraries

### Frontend (Client)

| Library | Version | Purpose |
|---|---|---|
| **React** | 18.3 | Core UI framework — builds the user interface using reusable components |
| **Vite** | 5.4 | Build tool and dev server — provides instant hot-reload during development |
| **Zustand** | 4.5 | State management — a simple, lightweight alternative to Redux. Stores all app state (session, EDA results, chat messages, etc.) in a single global store |
| **Framer Motion** | 11.0 | Animation library — provides smooth transitions, hover effects, staggered card animations, and the blinking cursor effect |
| **Recharts** | 2.12 | Charting library — renders bar charts, pie charts, line charts, and area charts using React components |
| **jsPDF** | 4.2 | PDF generation — creates the downloadable A4 summary report entirely in the browser (no server needed) |
| **html2canvas** | 1.4 | (Available but not actively used) — can capture DOM elements as images |
| **uuid** | 9.0 | Generates unique IDs for chat messages |
| **TailwindCSS** | 3.4 | Utility-first CSS framework — used alongside custom CSS for styling |
| **@vitejs/plugin-react** | 4.3 | Enables React JSX support in Vite |
| **PostCSS + Autoprefixer** | 8.4 / 10.4 | CSS post-processing — adds vendor prefixes for browser compatibility |

### Backend — Gateway Server

| Library | Version | Purpose |
|---|---|---|
| **Express** | 4.18 | Web framework for Node.js — handles routing, middleware, and HTTP responses |
| **Multer** | 1.4 | File upload middleware — processes multipart form data and stores files in memory buffer |
| **PapaParse** | 5.4 | CSV parser — converts raw CSV text into structured JavaScript objects with automatic type detection |
| **xlsx (SheetJS)** | 0.18 | Excel parser — reads `.xlsx` and `.xls` files and converts them to arrays |
| **cors** | 2.8 | Cross-Origin Resource Sharing — allows the frontend (port 5173) to talk to the server (port 3001) |
| **node-fetch** | 3.3 | HTTP client — the server uses this to forward requests to the AI Engine |
| **uuid** | 9.0 | Generates unique session IDs for each uploaded dataset |
| **dotenv** | 16.0 | Loads environment variables from the `.env` file |
| **Prisma** | 7.4 | ORM (Object-Relational Mapper) — defines and manages the SQLite database schema (7 models) |

### Backend — AI Engine

| Library | Version | Purpose |
|---|---|---|
| **FastAPI** | latest | Modern Python web framework — handles async HTTP endpoints with automatic OpenAPI documentation |
| **Uvicorn** | latest | ASGI server — runs the FastAPI app with hot-reload support |
| **Pandas** | latest | Data manipulation library — the core tool for all EDA computations (means, medians, correlations, etc.) |
| **NumPy** | latest | Numerical computing — used for histograms, handling infinity values, and array operations |
| **google-generativeai** | latest | Official Google SDK — connects to the Google Gemini API for AI text generation |
| **python-dotenv** | latest | Loads the Gemini API key from `.env` |
| **python-multipart** | latest | Required by FastAPI for form data parsing |
| **openpyxl** | latest | Excel file support for pandas |
| **httpx** | latest | Async HTTP client for Python |

---

## 4. Project Structure — File-by-File Breakdown

```
Lumin-ai/
├── .env                              # Shared environment variables
├── .gitignore                        # Git ignore rules
│
├── ai_engine/                        # Python AI Engine (FastAPI)
│   ├── main.py                       # FastAPI app entry point, routes, CORS
│   ├── eda.py                        # EDA computation logic (pandas/numpy)
│   ├── chat.py                       # Conversational AI with Gemini
│   ├── story.py                      # Data narrative generator with Gemini
│   └── requirements.txt              # Python dependencies
│
├── server/                           # Node.js Gateway Server (Express)
│   ├── index.js                      # Express app, routes, session management
│   ├── parser.js                     # CSV/XLSX file parsing + type inference
│   ├── routes.js                     # (Empty — routes are in index.js)
│   ├── package.json                  # Node.js dependencies
│   ├── dev.db                        # SQLite database file
│   ├── prisma.config.ts              # Prisma configuration
│   ├── prisma/
│   │   └── schema.prisma             # Database schema (7 models)
│   └── generated/                    # Auto-generated Prisma client
│
└── client/                           # React Frontend (Vite)
    ├── package.json                  # Frontend dependencies
    └── src/
        ├── main.jsx                  # React entry point
        ├── App.jsx                   # Root component, feature routing
        ├── index.css                 # Global styles, design system
        ├── store.js                  # Zustand global state store
        ├── store/                    # (Store directory, unused)
        ├── utils/
        │   └── generateReport.js     # PDF report generation (710 lines)
        └── components/
            ├── Sidebar.jsx           # Navigation sidebar + upload zone
            ├── Topbar.jsx            # Header bar with logo + status
            ├── UploadZone.jsx        # Drag-and-drop file upload widget
            ├── EDAExplorer.jsx       # EDA dashboard (7 chart cards)
            ├── DataStory.jsx         # AI narrative generator UI
            ├── ChatWithData.jsx      # Chat interface with messages
            ├── ChartCard.jsx         # Reusable chart component
            └── LoadingOrb.jsx        # Animated loading indicator
```

---

## 5. Feature 1: File Upload & Parsing

### What It Does

The user drops a CSV or XLSX file onto the upload zone (or clicks to browse). The system parses the file, extracts column headers, data rows, and sample rows, then infers the data type of each column.

### Step-by-Step Flow

```
User drops file → UploadZone.jsx → POST /upload (multipart) → server/index.js
                                                                      │
                                                          ┌───────────▼───────────┐
                                                          │     parser.js         │
                                                          │                       │
                                                          │  Is it XLSX?          │
                                                          │  ├─ Yes → parseXLSX() │
                                                          │  └─ No  → parseCSV()  │
                                                          │                       │
                                                          │  Then: inferDtypes()  │
                                                          └───────────┬───────────┘
                                                                      │
                                                          Returns: sessionId + metadata
```

### How CSV Parsing Works (`parseCSV`)

1. The raw file buffer is converted to a UTF-8 string.
2. **PapaParse** parses it with three key options:
   - `header: true` — treats the first row as column names.
   - `dynamicTyping: true` — automatically converts "42" to the number `42`, "true" to `true`, etc.
   - `skipEmptyLines: true` — ignores blank rows.
3. The parsed "array of objects" is converted to "array of arrays" for efficient transfer to the AI Engine.
4. The first 5 rows are saved as `sampleRows` for display in the UI.

### How XLSX Parsing Works (`parseXLSX`)

1. The **SheetJS (xlsx)** library reads the binary buffer.
2. It selects the **first sheet** of the workbook.
3. Converts the sheet to a raw 2D array using `sheet_to_json` with `header: 1` mode.
4. The first array becomes column headers; the rest become data rows.
5. Each row is padded/trimmed to match the header count.

### How Data Type Inference Works (`inferDtypes`)

For each column, the function samples up to 100 non-null values and checks:

1. **Numeric**: If more than 80% of sample values can be parsed as finite numbers → `numeric`.
2. **Datetime**: If any sample values match ISO date format (`YYYY-MM-DD`) or US date format (`MM/DD/YYYY`) → `datetime`.
3. **Otherwise**: → `categorical`.

### Session Management

After parsing, the server:
- Generates a unique **session ID** using `uuid`.
- Stores the complete dataset (headers, rows, filename, dtypes, metadata) in an **in-memory JavaScript `Map`**.
- Returns the `sessionId` and `metadata` to the client.
- This session is used for all subsequent operations (EDA, Story, Chat).

---

## 6. Feature 2: Exploratory Data Analysis (EDA)

### What It Does

Once the file is uploaded, the system automatically sends the data to the AI Engine for comprehensive statistical analysis. The results are displayed as 7 interactive chart cards on the EDA Explorer page.

### EDA Computation Pipeline (eda.py)

The `compute_eda()` function performs the following computations in order:

#### Step 1: Sampling (for large datasets)
```python
if len(df) > 50_000:
    df = df.sample(n=50_000, random_state=42).reset_index(drop=True)
```
If the dataset has more than 50,000 rows, it randomly samples 50,000 rows to keep computation fast. The `random_state=42` ensures the same sample every time (reproducibility).

#### Step 2: Clean Infinity Values
```python
df = df.replace([np.inf, -np.inf], np.nan)
```
Replaces positive/negative infinity with `NaN` (missing value) so they don't crash calculations.

#### Step 3: Column Classification
The system classifies every column into one of three types:

| Type | Detection Method |
|---|---|
| **Numeric** | Pandas' `select_dtypes(include=[np.number])` — detects `int`, `float`, etc. |
| **Categorical** | Pandas' `select_dtypes(include=["object", "bool"])` — detects text and boolean columns |
| **Datetime** | First checks native `datetime64` columns. Then tries `pd.to_datetime()` on categorical columns — if >70% of a sample of 200 values parse successfully, it's classified as datetime |

#### Step 4: Overview Statistics

| Metric | How It's Computed |
|---|---|
| Total rows | `len(df)` |
| Total columns | `len(df.columns)` |
| Memory footprint (KB) | `df.memory_usage(deep=True).sum() / 1024` |
| Null percentage | `(total_nulls / total_cells) * 100` |
| Duplicate rows | `df.duplicated().sum()` |

#### Step 5: Missing Values Analysis
For every column that has at least one null value:
- Count of missing values
- Percentage of missing values
- Sorted by count (worst columns first)

#### Step 6: Descriptive Statistics (max 15 numeric columns)
For each numeric column, computes:

| Statistic | Method | Meaning |
|---|---|---|
| **Mean** | `series.mean()` | The average value |
| **Median** | `series.median()` | The middle value when sorted |
| **Standard Deviation (Std)** | `series.std()` | How spread out the values are |
| **Min** | `series.min()` | Smallest value |
| **Max** | `series.max()` | Largest value |
| **Q25 (25th percentile)** | `series.quantile(0.25)` | Value below which 25% of data falls |
| **Q75 (75th percentile)** | `series.quantile(0.75)` | Value below which 75% of data falls |
| **Null count** | `df[col].isnull().sum()` | Number of missing values in this column |

#### Step 7: Top Correlations (Pearson)
- Builds a **correlation matrix** using `df[numeric_cols].corr()`.
- This uses the **Pearson correlation coefficient**, which measures linear relationships between two variables on a scale of -1 to +1:
  - `+1.0` = perfect positive correlation (when one goes up, the other goes up)
  - `-1.0` = perfect negative correlation (when one goes up, the other goes down)
  - `0` = no linear relationship
- Extracts all unique column pairs using `itertools.combinations`.
- Sorts by absolute value and returns the top 15 strongest correlations.

#### Step 8: Distributions (Histograms)
- For the top 5 numeric columns, creates a histogram with 20 bins using `np.histogram()`.
- Returns the bin edges and counts — the frontend renders these as bar charts.

#### Step 9: Categorical Frequency
- For the top 5 categorical columns, counts the frequency of each unique value using `value_counts()`.
- Returns the top 10 most common values per column.

#### Step 10: Full Correlation Matrix
- Builds the full correlation matrix for up to 12 numeric columns.
- Returns both the column names and the 2D array of values — the frontend renders this as a heatmap.

### Frontend Display: EDA Explorer (EDAExplorer.jsx)

The EDA results are displayed in a responsive grid of 7 card types:

| Card | What It Shows | Chart Type |
|---|---|---|
| **Dataset Overview** | Rows, columns, memory KB, null % | Metric tiles |
| **Column Types** | Numeric vs categorical vs datetime breakdown | Donut pie chart |
| **Missing Values** | Which columns have missing data and how much | Horizontal bar chart |
| **Statistical Summary** | Mean, median, std, min, max for all numeric columns | Sortable table |
| **Column Deep Dive** | Distribution of any selected column | Vertical bar chart with dropdown |
| **Correlation Matrix** | Heatmap of all pairwise correlations | Custom CSS grid with color-coded cells |
| **Strongest Correlations** | Ranked list of most correlated column pairs | Styled list with color-coded badges |

Every card uses Framer Motion's staggered animation (`fadeVariant(delay)`) to fade in sequentially when the page loads.

---

## 7. Feature 3: AI Data Story Generation

### What It Does

The "Data Story" feature uses Google Gemini (a large language model) to write a structured narrative about the dataset — like an analyst's report, but automatically generated. The user can choose the **audience** and **depth**.

### Configuration Options

| Setting | Options | Effect |
|---|---|---|
| **Audience** | EXECUTIVE, TECHNICAL, GENERAL | Changes the tone and vocabulary. Executive focuses on business impact; Technical focuses on statistics; General uses everyday language. |
| **Depth** | Brief, Standard, Deep Dive | Controls how many sections are generated. Brief = 2 sections, Standard = 4, Deep Dive = 6. |

### Sections Generated

| Section Tag | Title | When Included |
|---|---|---|
| `[OVERVIEW]` | Overview | All depths |
| `[KEY_FINDING_1]` | Key Finding 1 | All depths |
| `[KEY_FINDING_2]` | Key Finding 2 | Standard + Deep Dive |
| `[KEY_FINDING_3]` | Key Finding 3 | Standard + Deep Dive |
| `[ANOMALY]` | Anomaly Detected | Deep Dive only |
| `[RECOMMENDATION]` | Recommendation | Deep Dive only |

### How the AI Prompt Works (`story.py`)

The system constructs a detailed prompt that includes:

1. **Format rules**: Exact section tags to use, sentence length limits, formatting instructions.
2. **Audience guide**: Instructions specific to the chosen audience.
3. **Example**: A concrete example of what correct output looks like.
4. **Dataset metadata**: Filename, row count, column count.
5. **EDA results**: The entire EDA JSON (up to 4000 characters) — this gives the AI real numbers to cite.

The prompt forces the AI to:
- Use EXACTLY the specified section tags.
- Keep sentences under 25 words.
- State specific facts with numbers in every sentence.

### Gemini Model Selection

The `_get_model()` function tries multiple Gemini models in order of preference:
1. `gemini-2.5-flash` (first choice — fast and free-tier available)
2. `gemini-1.5-flash` (fallback)
3. `gemini-2.0-flash` (last resort)

If one model fails (e.g., not available in the user's region), it silently tries the next.

### Streaming Mechanism

The story is **streamed** in real-time:

1. **AI Engine (Python)**: Calls `model.generate_content(prompt, stream=True)` which returns chunks.
2. Each chunk is formatted as `data: <text>\n\n` (SSE format) and yielded from an async generator.
3. **Server (Node.js)**: Opens a fetch connection to the AI Engine and pipes the SSE stream directly to the client using `for await (const chunk of aiRes.body)`.
4. **Client (React)**: Uses `res.body.getReader()` to read chunks in real-time and accumulates text.
5. The `setStoryContent()` function parses section tags with a regex and updates the UI after every chunk.

The user sees text appearing word-by-word, and once all sections are received, they display as separate collapsible cards.

### Section Parsing Logic (store.js)

```javascript
const tagPattern = /\[(OVERVIEW|KEY_FINDING_\d+|ANOMALY|RECOMMENDATION)\]\s*([\s\S]*?)(?=\[(?:OVERVIEW|KEY_FINDING_\d+|ANOMALY|RECOMMENDATION)\]|$)/g
```

This regex:
- Finds tags like `[OVERVIEW]`, `[KEY_FINDING_1]`, `[ANOMALY]`, etc.
- Captures all text between one tag and the next.
- Stores them in a `parsedSections` object (e.g., `{ OVERVIEW: "...", KEY_FINDING_1: "..." }`).

---

## 8. Feature 4: Chat with Data

### What It Does

A conversational AI interface where the user can ask plain-English questions about their uploaded dataset. The AI responds with data-backed answers and can embed inline charts. It also suggests follow-up questions.

### Chat Message Format

Each message has:
- `role`: Either `"user"` or `"assistant"`
- `content`: The text of the message
- `id`: A unique UUID for React key management

### How a Chat Message is Processed

```
User types question → ChatWithData.jsx → POST /chat (with full message history)
                                               │
                              Server validates session, forwards to AI Engine
                                               │
                              AI Engine builds Gemini prompt with:
                              ├── System instruction (who is Lumin, rules, dataset context)
                              ├── Full conversation history (Gemini format)
                              └── Latest user question
                                               │
                              Gemini streams response → SSE → Client
```

### The AI's System Instruction (`chat.py`)

The chat AI is given a system instruction that defines its behavior:

```
You are Lumin, an expert AI data analyst embedded directly into a dataset.

Dataset Info: { filename, rows, cols, dtypes, ... }
EDA Summary: { overview, statistics[:8], topCorrelations[:5], numericCols, categoricalCols }

Rules:
1. Always answer using specific numbers from the dataset
2. Keep answers to 3-5 sentences unless asked for more
3. When a chart would help, include ONE tag:
   [CHART:bar:columnName] OR [CHART:line:columnName] OR [CHART:pie:columnName]
4. After every answer add [SUGGEST] with a smart follow-up question
5. If the question can't be answered from available data, say so
```

### Inline Chart Rendering

When the AI includes a tag like `[CHART:bar:Revenue]` in its response, the frontend:

1. **Parses it** using regex: `/\[CHART:(bar|line|pie):([^\]]+)\]/g`
2. **Looks up the data** for that column from the EDA results:
   - For numeric columns: uses the distribution histogram data (bins + counts).
   - For categorical columns: uses the frequency data (value → count).
3. **Renders the chart** using the `ChartCard` component (Recharts).

### Suggested Follow-up Questions

The AI is instructed to add a `[SUGGEST]` line after each answer. The frontend:
1. Extracts it with regex: `/\[SUGGEST]\s*(.+)/`
2. Removes it from the visible text.
3. Renders it as a clickable pill button below the message.

Additionally, when EDA first completes, the Zustand store generates **initial suggestion questions** based on the data:
- "What is the distribution of {first numeric column}?"
- "Show me statistics for all numeric columns"
- "What are the top values in {first categorical column}?"
- "Explain the correlation between {most correlated pair}"
- "Are there any outliers or anomalies?"
- "Summarize this dataset in 3 key points"
- "Which columns have the most missing data?"

### Conversation History

The full conversation history is sent with every request:
- All previous messages are converted to Gemini's format (`user`/`model` roles).
- Gemini uses this history to maintain context across the conversation.
- The chat can be cleared using the "Clear" button.

---

## 9. Feature 5: PDF Summary Report Generation

### What It Does

The user can download a professional-looking A4 PDF report summarizing the EDA results. This report is generated **entirely in the browser** using jsPDF — no server call needed.

### Report Structure (4 Sections)

#### Section 1: Dataset Overview
A grid of 6 metric cards showing:
- Total rows and columns
- Column composition (numeric/categorical/datetime with percentages)
- Memory footprint
- Data completeness percentage (color-coded: green/amber/red)
- Duplicate row count

#### Section 2: Key EDA Findings
Automatically computed insights (not AI-generated), including:

| Finding Type | Logic |
|---|---|
| **Strongest Correlation** | Finds the pair with highest absolute Pearson r value and classifies it (Strong Positive/Negative, Moderate, Weak) |
| **Most Variable Column** | Computes Coefficient of Variation (CV = std/mean) for each column and picks the highest. CV tells you how "spread out" data is relative to its average. |
| **Widest Range** | Finds the column with the biggest max-min difference |
| **Skewed Distributions** | Compares mean vs median — if `(mean - median) / |median|` exceeds ±15%, the column is classified as right-skewed or left-skewed |
| **Dominant Category** | If any single value makes up >50% of a categorical column, it's flagged |
| **Correlation Hub** | If 3+ column pairs have correlation >0.6, finds the column that appears most often (the "hub") |

#### Section 3: Missing Values & Data Quality

**Data Quality Score** (0–100):
```
Start at 100
  −(null percentage)           e.g., 5% nulls → score = 95
  −5 if any duplicate rows
  −5 if any column has >30% missing
  −5 if >50% of columns have some nulls
Minimum score: 0
```

Classification:
- 90–100: EXCELLENT (green)
- 75–89: GOOD (gray)
- 50–74: NEEDS ATTENTION (amber)
- 0–49: CRITICAL (red)

Also includes:
- A detailed missing values table with severity levels (TRACE, LOW, MODERATE, HIGH, CRITICAL) and visual bars
- Null distribution insight paragraph
- Duplicate row analysis

#### Section 4: Data Risk Factors
Automatically detects and explains data quality risks:

| Risk | Severity Logic | Explanation |
|---|---|---|
| High Null Exposure | >10% nulls (MEDIUM), >20% (HIGH), >40% (CRITICAL) | Missing values can bias aggregations |
| Duplicate Data Contamination | Duplicates >10% of rows → HIGH | Inflates counts and distorts averages |
| Extreme Outlier Exposure | If `max - Q75 > 3 × IQR` for any column | Outliers distort mean-based metrics |
| Skewed Distribution Impact | Columns with mean/median ratio >15% | Mean becomes unreliable |
| High Cardinality Categorical | >20 distinct values (MEDIUM), >100 (HIGH) | Expensive to encode for models |
| Dominant Category Bias | Single value >70% (MEDIUM), >90% (HIGH) | Causes class imbalance |
| Multicollinearity Warning | 3+ pairs with r > 0.85 | Destabilizes model coefficients |
| Sparse Dataset Warning | <500 rows (MEDIUM), <100 (HIGH) | Findings may lack statistical significance |

### PDF Visual Design

The report uses a **dark theme** matching the web app:
- Background: near-black (#080808)
- Text: silver/gray tones
- Chrome gradient lines as section dividers
- Hexagonal logo drawn with SVG coordinates
- Color-coded severity badges and progress bars
- Automatic page breaks when content exceeds page height

---

## 10. Feature 6: Database Persistence with Prisma

### What It Does

The Prisma schema defines a relational database structure for persisting all platform data. Currently, the application uses an **in-memory session store** (`Map` in `index.js`), but the Prisma schema is designed to replace it.

### Database Provider

**SQLite** — a zero-configuration, file-based database. The database file is `server/dev.db`.

### Schema Models (7 Tables)

| Model | Purpose | Key Fields |
|---|---|---|
| **User** | Future authentication — each user owns datasets | `email` (unique), `name`, `avatarUrl` |
| **Dataset** | Represents an uploaded file and its parsed metadata | `sessionId` (unique), `filename`, `rows`, `cols`, `headers` (JSON), `dtypes` (JSON), `sampleRows` (JSON), `nullCounts` (JSON) |
| **EdaResult** | Stores the computed EDA output (1:1 with Dataset) | Overview metrics as individual fields, complex objects stored as JSON strings (`statistics`, `topCorrelations`, `distributions`, etc.) |
| **DataStory** | AI-generated narrative (many per Dataset) | `audience`, `depth`, `content`, `sections` (JSON) |
| **ChatSession** | Groups a conversation thread about a dataset | `title`, linked to Dataset |
| **ChatMessage** | Individual message in a chat | `role`, `content`, linked to ChatSession |
| **Report** | Tracks generated PDF reports | `reportType`, `filename`, `qualityScore`, `riskCount`, `findingCount` |

### Relationships

```
User ──< Dataset ──< DataStory
                 ├── EdaResult (1:1)
                 ├──< ChatSession ──< ChatMessage
                 └──< Report
```

All child records use `onDelete: Cascade` — deleting a dataset automatically deletes all its EDA results, stories, chat sessions, and reports.

---

## 11. State Management — Zustand Store

### What is Zustand?

Zustand is a lightweight state management library for React. Unlike Redux, it doesn't need reducers, action types, or providers. You create a store with `create()` and access it with a hook (`useStore()`).

### Store Structure (`store.js`)

| State Variable | Type | Purpose |
|---|---|---|
| `sessionId` | string | Current active session identifier |
| `metadata` | object | File info: filename, rows, cols, dtypes, sampleRows, nullCounts |
| `edaResults` | object | Full EDA computation results |
| `activeFeature` | string | Which tab is active: `'eda'`, `'story'`, or `'chat'` |
| `sidebarCollapsed` | boolean | Whether the sidebar is minimized |
| `uploadStatus` | string | Upload state: `'idle'` → `'uploading'` → `'processing'` → `'ready'` (or `'error'`) |
| `uploadError` | string | Error message if upload fails |
| `story` | object | Contains `content`, `parsedSections`, `isStreaming`, `audience`, `depth`, `generated` |
| `messages` | array | Chat conversation history |
| `isThinking` | boolean | Whether the AI is currently generating a response |
| `suggestedQuestions` | array | Context-aware question suggestions |

### Key Actions

| Action | What It Does |
|---|---|
| `setSession(sessionId, metadata)` | Stores session info after upload |
| `setEDA(edaResults)` | Stores EDA results and auto-generates suggested questions based on the data |
| `setActiveFeature(feature)` | Switches between EDA/Story/Chat tabs |
| `toggleSidebar()` | Collapses/expands the sidebar |
| `updateStory(patch)` | Merges partial story updates |
| `setStoryContent(content)` | Parses section tags from raw story text |
| `addMessage(msg)` | Appends a message to chat history |
| `updateLastMessage(content)` | Updates the content of the last message (used during streaming) |
| `clearChat()` | Resets chat history |
| `clearAll()` | Resets everything to initial state (like a fresh page load) |

---

## 12. Real-Time Streaming (SSE) — End-to-End

### What is Server-Sent Events (SSE)?

SSE is a standard for servers to push real-time updates to the browser over a single HTTP connection. Unlike WebSockets, SSE is:
- One-directional (server → client only)
- Uses plain HTTP (no special protocol)
- Automatically handles reconnection
- Each message follows the format: `data: <content>\n\n`

### How SSE Works in Lumin.ai

```
1. Client sends POST request to /story or /chat
                                │
2. Server sets SSE headers:     │
   Content-Type: text/event-stream
   Cache-Control: no-cache      │
   Connection: keep-alive       │
                                │
3. Server forwards to AI Engine │
   AI Engine returns SSE stream │
                                │
4. Server pipes the stream:     │
   for await (chunk of body) {  │
     res.write(chunk)           │ ──── raw bytes piped through
   }                            │
                                │
5. Client reads with:           │
   const reader = res.body.getReader()
   while (true) {               │
     const { done, value } = await reader.read()
     // decode chunk             │
     // parse "data: " lines    │
     // accumulate text          │
     // update UI                │
   }                            │
                                │
6. Special tokens:
   "data: [DONE]\n\n"  → stream complete, stop reading
   "data: [ERROR]\n\n" → something went wrong
```

### Why Stream Instead of Wait?

Without streaming, the user would see **nothing** for 5-15 seconds while Gemini generates the full response. With SSE streaming:
- Text appears word-by-word in ~100ms intervals
- The user immediately knows the system is working
- The blinking cursor animation provides visual feedback
- If the AI is saying something wrong, the user can see it early

---

## 13. UI/UX Design System

### Design Philosophy

Lumin.ai uses a **dark monochrome design** with silver/chrome accents. The aesthetic is inspired by premium developer tools (like Vercel, Linear, Raycast).

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `void` | `#080808` | Deepest background |
| `surface` | `#0f0f0f` | Card and panel backgrounds |
| `elevated` | `#141414` | Hover states, alternating table rows |
| `silver-100` | `#e8e8e8` | Primary text |
| `silver-200` | `#d4d4d4` | Secondary text, button text |
| `silver-300` | `#b8b8b8` | Default body text |
| `silver-400` | `#8c8c8c` | Muted text |
| `silver-500` | `#646464` | Labels, placeholders |
| `silver-600` | `#404040` | Borders, subtle elements |
| `silver-700` | `#2a2a2a` | Card borders |
| `silver-800` | `#1a1a1a` | Darkest borders |
| Chrome | `linear-gradient(135deg, #d4d4d4, #707070, #d4d4d4)` | Logo text, accent elements |

### Typography

| Usage | Font | Weight |
|---|---|---|
| Body text, data values | IBM Plex Mono | Regular (400) |
| Headings, navigation labels | System font (Inter/Helvetica via Tailwind `font-display`) | Bold (700) |

### Animations

| Animation | Technology | Where Used |
|---|---|---|
| Page transitions | Framer Motion `AnimatePresence` | Switching between EDA/Story/Chat |
| Card stagger | Framer Motion `fadeVariant(delay)` | EDA cards fade in 0.07s apart |
| Sidebar expand/collapse | Framer Motion spring animation | Sidebar width smooth transition |
| Thinking dots | CSS `@keyframes thinking-dot` | Chat "AI is thinking" indicator |
| Blinking cursor | Framer Motion opacity animation | Story generation text cursor |
| Upload dashed border | CSS `@keyframes dash-move` | Animated dashed border on drag zone |
| Loading orb | Framer Motion scale + opacity | Pulsing orb during EDA computation |
| Float animation | CSS `@keyframes float-up` | Empty state icons gentle bobbing |
| Card hover lift | CSS `transform: translateY(-2px)` | Cards lift slightly on hover |
| Noise overlay | SVG `feTurbulence` filter | Subtle grain texture over entire UI |

### Responsive Layout

- **Desktop**: 3-column EDA grid, sidebar visible, chat with side panel
- **Tablet**: 2-column EDA grid
- **Mobile**: 1-column EDA grid, sidebar collapsed, chat panel hidden

---

## 14. Data Flow — Complete End-to-End Pipeline

Here is the complete journey of data from upload to chat:

```
Step 1: USER UPLOADS FILE
───────────────────────────────────────────────────────────
  UploadZone.jsx → FormData → POST /upload → parser.js
  Result: sessionId + metadata (filename, rows, cols, dtypes, sampleRows, nullCounts)
  State: uploadStatus = 'uploading' → 'ready'


Step 2: EDA COMPUTATION (automatic after upload)
───────────────────────────────────────────────────────────
  UploadZone.jsx → POST /eda { sessionId }
  Server → POST AI_ENGINE/eda { headers, rows, filename }
  AI Engine → pandas/numpy computation → JSON result
  Result: overview, dtypeCounts, statistics, distributions,
          categoricalFrequency, correlationMatrix, topCorrelations, missingValues
  State: edaResults populated, suggestedQuestions generated


Step 3: USER VIEWS EDA
───────────────────────────────────────────────────────────
  EDAExplorer.jsx reads edaResults from Zustand store
  Renders 7 chart cards using Recharts
  Each card animates in with staggered delay


Step 4: USER GENERATES STORY (optional)
───────────────────────────────────────────────────────────
  User selects audience + depth → clicks "Generate"
  DataStory.jsx → POST /story { sessionId, audience, depth }
  Server → POST AI_ENGINE/story { eda, metadata, audience, depth }
  AI Engine → Gemini prompt → SSE stream
  Server pipes SSE → Client reads stream
  Text appears word-by-word → parsed into section cards


Step 5: USER CHATS (optional)
───────────────────────────────────────────────────────────
  User types question in ChatWithData.jsx
  POST /chat { sessionId, messages: [...history, newMessage] }
  Server → POST AI_ENGINE/chat { messages, metadata, eda }
  AI Engine → Gemini with system instruction + conversation history → SSE stream
  Response may contain [CHART:type:col] → rendered as inline chart
  Response may contain [SUGGEST] → rendered as clickable suggestion pill


Step 6: USER DOWNLOADS PDF (optional)
───────────────────────────────────────────────────────────
  User clicks "Download Summary Report" in EDAExplorer
  generateReport.js runs entirely in browser
  Computes findings + risks + quality score from edaResults
  Generates multi-page A4 PDF using jsPDF
  Browser auto-downloads the PDF file
```

---

## 15. Environment Configuration

### Root `.env` File

```env
GEMINI_API_KEY=<your-google-gemini-api-key>
VITE_GATEWAY_URL=http://localhost:3001
AI_ENGINE_URL=http://localhost:8000
```

| Variable | Used By | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | AI Engine (Python) | Authenticates with Google's Gemini API for text generation |
| `VITE_GATEWAY_URL` | Client (Vite) | The `VITE_` prefix makes it available in frontend code (Vite convention) — tells the frontend where the server is |
| `AI_ENGINE_URL` | Server (Node.js) | Tells the gateway server where to find the AI Engine |

### CORS Configuration

- **Client → Server**: The server allows requests from `http://localhost:5173` (Vite dev server port).
- **Server → AI Engine**: The AI Engine allows requests from both `http://localhost:3001` (server) and `http://localhost:5173` (client).
- **Vite Proxy**: Vite is configured to proxy `/upload`, `/eda`, `/story`, and `/chat` to the gateway server, so the client can make requests without specifying the full URL.

---

## 16. How to Run the Project

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **Google Gemini API key** (free tier available at https://aistudio.google.com/)

### Step 1: Configure Environment

Create a `.env` file in the `Lumin-ai/` root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GATEWAY_URL=http://localhost:3001
AI_ENGINE_URL=http://localhost:8000
```

### Step 2: Install Dependencies

```bash
# Install Python dependencies (AI Engine)
cd ai_engine
pip install -r requirements.txt

# Install Node.js dependencies (Server)
cd ../server
npm install

# Install Node.js dependencies (Client)
cd ../client
npm install
```

### Step 3: Start All Three Services

Open 3 separate terminals:

**Terminal 1 — AI Engine (port 8000):**
```bash
cd ai_engine
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Server (port 3001):**
```bash
cd server
npm run dev
```

**Terminal 3 — Client (port 5173):**
```bash
cd client
npm run dev
```

### Step 4: Open in Browser

Navigate to **http://localhost:5173** and upload a CSV or XLSX file to start analyzing.

---

> **Report generated on:** March 9, 2026
> **Project:** Lumin.ai v1.0
> **Total source files analyzed:** 20+
> **Total lines of code:** ~3,000+
