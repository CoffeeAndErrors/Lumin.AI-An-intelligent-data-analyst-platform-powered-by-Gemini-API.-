/**
 * parser.js — File parsing utilities for Lumin.ai gateway.
 * Exports parseCSV, parseXLSX, and inferDtypes.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse a CSV buffer into Lumin's internal data format.
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} filename - Original filename for metadata
 * @returns {{ headers, rows, rowCount, colCount, sampleRows, filename }}
 */
export function parseCSV(buffer, filename) {
    const text = buffer.toString('utf-8');

    const result = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });

    const headers = result.meta.fields || [];
    // Convert array of objects to array of arrays
    const rows = result.data.map((obj) => headers.map((h) => obj[h] ?? null));
    const rowCount = rows.length;
    const colCount = headers.length;
    const sampleRows = rows.slice(0, 5);

    return { headers, rows, rowCount, colCount, sampleRows, filename };
}

/**
 * Parse an XLSX/XLS buffer into Lumin's internal data format.
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} filename - Original filename for metadata
 * @returns {{ headers, rows, rowCount, colCount, sampleRows, filename }}
 */
export function parseXLSX(buffer, filename) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (!rawData || rawData.length === 0) {
        return { headers: [], rows: [], rowCount: 0, colCount: 0, sampleRows: [], filename };
    }

    const headers = (rawData[0] || []).map((h) => (h !== null && h !== undefined ? String(h) : ''));
    const rows = rawData.slice(1).map((row) => {
        // Ensure each row has the same length as headers
        const normalized = [];
        for (let i = 0; i < headers.length; i++) {
            normalized.push(row[i] !== undefined ? row[i] : null);
        }
        return normalized;
    });

    const rowCount = rows.length;
    const colCount = headers.length;
    const sampleRows = rows.slice(0, 5);

    return { headers, rows, rowCount, colCount, sampleRows, filename };
}

/**
 * Infer data types for each column by sampling up to 100 values.
 * @param {string[]} headers - Column names
 * @param {Array[]} rows - Data as array of arrays
 * @returns {Object} { colName: 'numeric'|'categorical'|'datetime' }
 */
export function inferDtypes(headers, rows) {
    const dtypes = {};

    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
    const US_DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const header = headers[colIdx];
        const sampleValues = [];

        for (let rowIdx = 0; rowIdx < Math.min(100, rows.length); rowIdx++) {
            const val = rows[rowIdx][colIdx];
            if (val !== null && val !== undefined && val !== '') {
                sampleValues.push(val);
            }
        }

        if (sampleValues.length === 0) {
            dtypes[header] = 'categorical';
            continue;
        }

        // Check numeric
        const numericCount = sampleValues.filter((v) => {
            const n = typeof v === 'number' ? v : parseFloat(v);
            return isFinite(n);
        }).length;

        if (numericCount / sampleValues.length > 0.8) {
            dtypes[header] = 'numeric';
            continue;
        }

        // Check datetime
        const dateCount = sampleValues.filter((v) => {
            const str = String(v);
            return ISO_DATE_RE.test(str) || US_DATE_RE.test(str);
        }).length;

        if (dateCount > 0) {
            dtypes[header] = 'datetime';
            continue;
        }

        dtypes[header] = 'categorical';
    }

    return dtypes;
}
