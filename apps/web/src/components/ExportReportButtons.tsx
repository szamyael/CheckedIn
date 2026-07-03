"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  getExportHeaders,
  exportRowsToMatrix,
  type ExportRow,
} from "@/lib/export-report";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportReportButtons({
  rows,
  baseFilename,
  eventTitle,
  includeEvent = false,
}: {
  rows: ExportRow[];
  baseFilename: string;
  eventTitle?: string;
  includeEvent?: boolean;
}) {
  const headers = getExportHeaders(includeEvent);

  function exportCsv() {
    const matrix = exportRowsToMatrix(rows, includeEvent);
    const lines = matrix.map((line) =>
      line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${baseFilename}.csv`);
  }

  function exportExcel() {
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ...exportRowsToMatrix(rows, includeEvent),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `${baseFilename}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(eventTitle ? `Attendance: ${eventTitle}` : "Attendance Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 24);

    autoTable(doc, {
      head: [headers],
      body: exportRowsToMatrix(rows, includeEvent),
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`${baseFilename}.pdf`);
  }

  const disabled = rows.length === 0;
  const btn =
    "rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={exportCsv} disabled={disabled} className={btn}>
        CSV
      </button>
      <button type="button" onClick={exportExcel} disabled={disabled} className={btn}>
        Excel
      </button>
      <button type="button" onClick={exportPdf} disabled={disabled} className={btn}>
        PDF
      </button>
    </div>
  );
}
