"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FileExport, FileTypeCsv, FileTypePdf, FileTypeXls, X } from "@/lib/icons";
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

async function imageDataUrl(src: string): Promise<string> {
  const image = new Image();
  image.src = src;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load report header image: ${src}`));
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

async function fontBase64(src: string): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Could not load PDF font: ${src}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function ExportReportButtons({
  rows,
  baseFilename,
  eventTitle,
  includeEvent = false,
  customHeaders,
  customRows,
  reportTitle,
  sheetName = "Attendance",
  compact = false,
  exportLabel = "Export report",
}: {
  rows: ExportRow[];
  baseFilename: string;
  eventTitle?: string;
  includeEvent?: boolean;
  customHeaders?: string[];
  customRows?: string[][];
  reportTitle?: string;
  sheetName?: string;
  compact?: boolean;
  exportLabel?: string;
}) {
  const [formatPickerOpen, setFormatPickerOpen] = useState(false);
  const headers = customHeaders ?? getExportHeaders(includeEvent);
  const matrix = customRows ?? exportRowsToMatrix(rows, includeEvent);

  function exportCsv() {
    const lines = matrix.map((line) =>
      line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${baseFilename}.csv`);
  }

  function exportExcel() {
    const generatedAt = new Date().toLocaleString();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Republic of the Philippines"],
      ["Laguna State Polytechnic University"],
      ["Province of Laguna"],
      [reportTitle ?? (eventTitle ? `Attendance: ${eventTitle}` : "Attendance Report")],
      [`Generated ${generatedAt}`],
      [],
      headers,
      ...matrix,
    ]);
    const lastColumn = XLSX.utils.encode_col(headers.length - 1);
    worksheet["!merges"] = [0, 1, 2, 3, 4].map((row) => ({
      s: { r: row, c: 0 },
      e: { r: row, c: headers.length - 1 },
    }));
    worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(13, header.length + 3) }));
    worksheet["!rows"] = [{ hpt: 16 }, { hpt: 20 }, { hpt: 16 }, { hpt: 18 }, { hpt: 15 }];
    for (let column = 0; column < headers.length; column += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 6, c: column })];
      if (cell) cell.s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2563EB" } } };
    }
    for (const row of [0, 1, 2]) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      if (cell) cell.s = { alignment: { horizontal: "center" }, font: { bold: row === 1, sz: row === 1 ? 14 : 10 } };
    }
    const reportTitleCell = worksheet["A4"];
    if (reportTitleCell) reportTitleCell.s = { alignment: { horizontal: "center" }, font: { bold: true, sz: 12 } };
    const generatedCell = worksheet["A5"];
    if (generatedCell) generatedCell.s = { alignment: { horizontal: "center" }, font: { italic: true, sz: 9 } };
    worksheet["!autofilter"] = { ref: `A7:${lastColumn}${matrix.length + 7}` };
    worksheet["!freeze"] = { xSplit: 0, ySplit: 7 };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${baseFilename}.xlsx`);
  }

  async function exportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    const [seal, collegeLogo] = await Promise.all([
      imageDataUrl("/report-header/seal.png"),
      imageDataUrl("/report-header/college-logo.jpeg"),
    ]);
    const oldEnglishFont = await fontBase64("/fonts/UnifrakturCook-Bold.ttf");
    doc.addFileToVFS("UnifrakturCook-Bold.ttf", oldEnglishFont);
    doc.addFont("UnifrakturCook-Bold.ttf", "UnifrakturCook", "bold");

    const drawHeader = () => {
      const width = doc.internal.pageSize.getWidth();
      doc.addImage(seal, "PNG", 14, 7, 17, 17);
      doc.addImage(collegeLogo, "PNG", width - 31, 7, 17, 17);
      doc.setTextColor(0, 0, 0);
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text("Republic of the Philippines", width / 2, 10, { align: "center" });
      doc.setFont("UnifrakturCook", "bold");
      doc.setFontSize(12);
      doc.text("Laguna State Polytechnic University", width / 2, 15, { align: "center" });
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text("Province of Laguna", width / 2, 19, { align: "center" });
      doc.setDrawColor(191, 78, 20);
      doc.setLineWidth(0.45);
      doc.line(14, 26, width - 14, 26);
    };

    autoTable(doc, {
      head: [headers],
      body: matrix,
      startY: 39,
      margin: { top: 39, left: 14, right: 14 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        drawHeader();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(reportTitle ?? (eventTitle ? `Attendance: ${eventTitle}` : "Attendance Report"), 14, 33);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Generated ${new Date().toLocaleString()}`, 14, 37);
      },
    });

    doc.save(`${baseFilename}.pdf`);
  }

  const disabled = rows.length === 0;
  const btn =
    "rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50";

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setFormatPickerOpen(true)}
          disabled={disabled}
          aria-label={exportLabel}
          title={exportLabel}
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileExport size={19} aria-hidden="true" />
          <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {exportLabel}
          </span>
        </button>
        {formatPickerOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-label="Choose report format" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-blue-700">MEMBERSHIP EXPORT</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Generate report</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose a file format to download.</p>
                </div>
                <button type="button" onClick={() => setFormatPickerOpen(false)} aria-label="Close report format options" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X size={18} /></button>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                <button type="button" onClick={() => { exportCsv(); setFormatPickerOpen(false); }} aria-label="Download as CSV spreadsheet" className="group flex min-h-28 flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-200"><FileTypeCsv size={23} aria-hidden="true" /></span>
                  <span><span className="block text-sm font-semibold text-slate-900">CSV</span><span className="mt-0.5 block text-xs text-slate-500">Spreadsheet data</span></span>
                </button>
                <button type="button" onClick={() => { exportExcel(); setFormatPickerOpen(false); }} aria-label="Download as Excel workbook" className="group flex min-h-28 flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-green-300 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-green-100 text-green-700 transition group-hover:bg-green-200"><FileTypeXls size={23} aria-hidden="true" /></span>
                  <span><span className="block text-sm font-semibold text-slate-900">Excel</span><span className="mt-0.5 block text-xs text-slate-500">Formatted workbook</span></span>
                </button>
                <button type="button" onClick={() => { void exportPdf().then(() => setFormatPickerOpen(false)); }} aria-label="Download as PDF document" className="group flex min-h-28 flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-100 text-red-700 transition group-hover:bg-red-200"><FileTypePdf size={23} aria-hidden="true" /></span>
                  <span><span className="block text-sm font-semibold text-slate-900">PDF</span><span className="mt-0.5 block text-xs text-slate-500">Print-ready report</span></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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
