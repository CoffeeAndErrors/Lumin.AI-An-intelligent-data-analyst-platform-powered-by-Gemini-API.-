"""
EDA computation module for Lumin.ai.
Computes comprehensive exploratory data analysis statistics from a pandas DataFrame.
"""

import pandas as pd
import numpy as np
import json
import math
from itertools import combinations


def _safe_float(val):
    """Convert a value to a JSON-serializable float."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, 4)
    except (TypeError, ValueError):
        return None


def _safe_int(val):
    """Convert a value to a JSON-serializable int."""
    if val is None:
        return None
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def compute_eda(df: pd.DataFrame, filename: str) -> dict:
    """
    Compute comprehensive EDA statistics from a DataFrame.

    Args:
        df: Input DataFrame (may be modified in-place for sampling/cleaning)
        filename: Original filename shown in the overview

    Returns:
        dict with all EDA results, fully JSON-serializable
    """
    # --- Sampling ---
    if len(df) > 50_000:
        df = df.sample(n=50_000, random_state=42).reset_index(drop=True)

    # --- Clean inf values ---
    df = df.replace([np.inf, -np.inf], np.nan)

    total_rows = len(df)
    total_cols = len(df.columns)
    total_cells = total_rows * total_cols
    total_nulls = int(df.isnull().sum().sum())
    null_percent = round((total_nulls / total_cells * 100) if total_cells > 0 else 0.0, 2)
    duplicate_rows = int(df.duplicated().sum())
    memory_kb = round(df.memory_usage(deep=True).sum() / 1024, 2)

    # --- Column classification ---
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []

    initial_numeric = list(df.select_dtypes(include=[np.number]).columns)
    initial_categorical = list(df.select_dtypes(include=["object", "bool"]).columns)
    initial_datetime = list(df.select_dtypes(include=["datetime64[ns]", "datetime64"]).columns)

    datetime_cols.extend(initial_datetime)

    # Try to parse object/bool columns as datetime
    for col in initial_categorical:
        non_null = df[col].dropna()
        if len(non_null) == 0:
            categorical_cols.append(col)
            continue
        sample = non_null.head(200)
        try:
            parsed = pd.to_datetime(sample, infer_datetime_format=True, errors="coerce")
            success_rate = parsed.notna().sum() / len(sample)
            if success_rate > 0.70:
                datetime_cols.append(col)
            else:
                categorical_cols.append(col)
        except Exception:
            categorical_cols.append(col)

    numeric_cols = initial_numeric

    # --- Overview ---
    overview = {
        "rows": total_rows,
        "cols": total_cols,
        "memoryKB": memory_kb,
        "nullPercent": null_percent,
        "duplicateRows": duplicate_rows,
        "filename": filename,
    }

    # --- Dtype counts ---
    dtype_counts = {
        "numeric": len(numeric_cols),
        "categorical": len(categorical_cols),
        "datetime": len(datetime_cols),
    }

    # --- Missing values ---
    missing_series = df.isnull().sum()
    missing_list = []
    for col, count in missing_series.items():
        if count > 0:
            missing_list.append({
                "col": str(col),
                "count": int(count),
                "percent": round(float(count) / total_rows * 100, 2) if total_rows > 0 else 0.0,
            })
    missing_list.sort(key=lambda x: x["count"], reverse=True)

    # --- Statistics (max 15 numeric cols) ---
    stats_cols = numeric_cols[:15]
    statistics = []
    for col in stats_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        q25 = _safe_float(series.quantile(0.25))
        q75 = _safe_float(series.quantile(0.75))
        statistics.append({
            "col": str(col),
            "mean": _safe_float(series.mean()),
            "median": _safe_float(series.median()),
            "std": _safe_float(series.std()),
            "min": _safe_float(series.min()),
            "max": _safe_float(series.max()),
            "q25": q25,
            "q75": q75,
            "nullCount": int(df[col].isnull().sum()),
        })

    # --- Top correlations ---
    top_correlations = []
    if len(numeric_cols) >= 2:
        numeric_df = df[numeric_cols].select_dtypes(include=[np.number])
        try:
            corr_matrix = numeric_df.corr()
            pairs = []
            cols = list(corr_matrix.columns)
            for c1, c2 in combinations(cols, 2):
                val = corr_matrix.loc[c1, c2]
                if pd.notna(val):
                    pairs.append((str(c1), str(c2), float(val)))
            pairs.sort(key=lambda x: abs(x[2]), reverse=True)
            top_correlations = [
                {"col1": c1, "col2": c2, "value": round(v, 4)}
                for c1, c2, v in pairs[:15]
            ]
        except Exception:
            top_correlations = []

    # --- Distributions (top 5 numeric cols, 20 bins) ---
    distributions = {}
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) < 2:
            continue
        try:
            counts, bin_edges = np.histogram(series, bins=20)
            distributions[str(col)] = {
                "bins": [_safe_float(b) for b in bin_edges[:-1]],
                "counts": [int(c) for c in counts],
            }
        except Exception:
            continue

    # --- Categorical frequency (top 5 categorical cols, top 10 values) ---
    categorical_frequency = {}
    for col in categorical_cols[:5]:
        try:
            freq = df[col].value_counts().head(10)
            categorical_frequency[str(col)] = {
                str(k): int(v) for k, v in freq.items()
            }
        except Exception:
            continue

    # --- Correlation matrix (top 12 numeric cols) ---
    correlation_matrix = {"columns": [], "values": []}
    matrix_cols = numeric_cols[:12]
    if len(matrix_cols) >= 2:
        try:
            sub_df = df[matrix_cols].select_dtypes(include=[np.number])
            corr = sub_df.corr()
            col_names = [str(c) for c in corr.columns]
            values = []
            for row_label in corr.index:
                row = []
                for col_label in corr.columns:
                    v = corr.loc[row_label, col_label]
                    row.append(round(float(v), 3) if pd.notna(v) else None)
                values.append(row)
            correlation_matrix = {"columns": col_names, "values": values}
        except Exception:
            correlation_matrix = {"columns": [], "values": []}

    return {
        "overview": overview,
        "dtypeCounts": dtype_counts,
        "numericCols": [str(c) for c in numeric_cols],
        "categoricalCols": [str(c) for c in categorical_cols],
        "missingValues": missing_list,
        "statistics": statistics,
        "topCorrelations": top_correlations,
        "distributions": distributions,
        "categoricalFrequency": categorical_frequency,
        "correlationMatrix": correlation_matrix,
    }
