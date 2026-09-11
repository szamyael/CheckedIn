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
    const generatedAt = new Date().toLocaleString();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Republic of the Philippines"],
      ["Laguna State Polytechnic University"],
      ["Province of Laguna"],
      [eventTitle ? `Attendance: ${eventTitle}` : "Attendance Report"],
      [`Generated ${generatedAt}`],
      [],
      headers,
      ...exportRowsToMatrix(rows, includeEvent),
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
    worksheet["!autofilter"] = { ref: `A7:${lastColumn}${rows.length + 7}` };
    worksheet["!freeze"] = { xSplit: 0, ySplit: 7 };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `${baseFilename}.xlsx`);
  }

  async function exportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    const [seal, collegeLogo] = await Promise.all([
      imageDataUrl("/report-header/seal.png"),
      imageDataUrl("/report-header/college-logo.jpeg"),
    ]);

    const drawHeader = () => {
      const width = doc.internal.pageSize.getWidth();
      doc.addImage(seal, "PNG", 14, 7, 17, 17);
      doc.addImage(collegeLogo, "PNG", width - 31, 7, 17, 17);
      doc.setTextColor(0, 0, 0);
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text("Republic of the Philippines", width / 2, 10, { align: "center" });
      doc.setFont("times", "bold");
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
      body: exportRowsToMatrix(rows, includeEvent),
      startY: 39,
      margin: { top: 39, left: 14, right: 14 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      didDrawPage: () => {
        drawHeader();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(eventTitle ? `Attendance: ${eventTitle}` : "Attendance Report", 14, 33);
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
