/**
 * Export data to CSV file
 */

export interface ExportColumn<T = unknown> {
    id: string;
    label: string;
    /** Optional: extract/format value for CSV export. Defaults to row[id] */
    getExportValue?: (row: T) => string | number | null | undefined;
}

/**
 * Get nested value from object by path (e.g. "user.name")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key) => {
        if (acc != null && typeof acc === 'object' && key in acc) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string | number | null | undefined): string {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T>(
    data: T[],
    columns: ExportColumn<T>[],
    filename: string
): void {
    const headers = columns.map((c) => escapeCsvValue(c.label)).join(',');
    const rows = data.map((row) =>
        columns
            .map((col) => {
                let value: string | number | null | undefined;
                if (col.getExportValue) {
                    value = col.getExportValue(row);
                } else {
                    const val = getNestedValue(row as Record<string, unknown>, col.id);
                    value = val != null ? String(val) : '';
                }
                return escapeCsvValue(value);
            })
            .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
