type PdfTextAlign = "left" | "right";

export type PdfReportTableColumn = {
  label: string;
  widthChars: number;
  align?: PdfTextAlign;
};

export type PdfReportTableSection = {
  title: string;
  columns: PdfReportTableColumn[];
  rows: string[][];
};

function escapePdfText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function formatPdfDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `D:${year}${month}${day}${hour}${minute}${second}`;
}

function toUint8Array(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

function clipText(value: string, widthChars: number): string {
  if (value.length <= widthChars) return value;
  if (widthChars <= 1) return value.slice(0, widthChars);
  return `${value.slice(0, widthChars - 1)}~`;
}

function estimateMonospaceTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

function pushRect(
  commands: string[],
  input: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: [number, number, number];
    stroke?: [number, number, number];
  }
) {
  commands.push("q");
  if (input.fill) {
    commands.push(`${input.fill[0]} ${input.fill[1]} ${input.fill[2]} rg`);
  }
  if (input.stroke) {
    commands.push(`${input.stroke[0]} ${input.stroke[1]} ${input.stroke[2]} RG`);
  }
  commands.push(`${input.x.toFixed(2)} ${input.y.toFixed(2)} ${input.width.toFixed(2)} ${input.height.toFixed(2)} re`);
  if (input.fill && input.stroke) commands.push("B");
  else if (input.fill) commands.push("f");
  else commands.push("S");
  commands.push("Q");
}

function pushText(
  commands: string[],
  input: {
    x: number;
    y: number;
    text: string;
    font: "F1" | "F2" | "F3";
    size: number;
    colorRgb?: [number, number, number];
  }
) {
  commands.push("BT");
  if (input.colorRgb) {
    commands.push(`${input.colorRgb[0]} ${input.colorRgb[1]} ${input.colorRgb[2]} rg`);
  } else {
    commands.push("0 0 0 rg");
  }
  commands.push(`/${input.font} ${input.size} Tf`);
  commands.push(`${input.x.toFixed(2)} ${input.y.toFixed(2)} Td`);
  commands.push(`(${escapePdfText(input.text)}) Tj`);
  commands.push("ET");
}

function finalizePdf(input: {
  title: string;
  generatedAt?: Date;
  pageStreams: string[];
}): Uint8Array {
  const pageWidth = 595;
  const pageHeight = 842;

  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const pagesCount = input.pageStreams.length;

  const pagesRootId = 2;
  const firstPageObjectId = 3;
  const firstContentObjectId = firstPageObjectId + pagesCount;
  const fontRegularObjectId = firstContentObjectId + pagesCount;
  const fontBoldObjectId = fontRegularObjectId + 1;
  const fontMonoObjectId = fontRegularObjectId + 2;
  const infoObjectId = fontRegularObjectId + 3;

  for (let i = 0; i < pagesCount; i += 1) {
    const pageObjectId = firstPageObjectId + i;
    const contentObjectId = firstContentObjectId + i;
    pageObjectIds.push(pageObjectId);

    const stream = input.pageStreams[i];
    objects[contentObjectId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageObjectId] =
      `<< /Type /Page /Parent ${pagesRootId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /Font << /F1 ${fontRegularObjectId} 0 R /F2 ${fontBoldObjectId} 0 R /F3 ${fontMonoObjectId} 0 R >> >> ` +
      `/Contents ${contentObjectId} 0 R >>`;
  }

  objects[1] = `<< /Type /Catalog /Pages ${pagesRootId} 0 R >>`;
  objects[pagesRootId] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pagesCount} >>`;
  objects[fontRegularObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  objects[fontMonoObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";
  objects[infoObjectId] =
    `<< /Title (${escapePdfText(input.title)}) /Producer (NekoGym) /CreationDate (${formatPdfDate(input.generatedAt ?? new Date())}) >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let id = 1; id < objects.length; id += 1) {
    const body = objects[id];
    if (!body) continue;
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${body}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id < objects.length; id += 1) {
    const offset = offsets[id] ?? 0;
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return toUint8Array(pdf);
}

export function buildReportPdfDocument(input: {
  title: string;
  subtitle: string;
  generatedAtLabel: string;
  sections: PdfReportTableSection[];
  generatedAt?: Date;
}): Uint8Array {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginLeft = 34;
  const marginRight = 34;
  const marginBottom = 34;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const headerHeight = 72;
  const footerHeight = 24;
  const tableRowHeight = 18;
  const headerRowHeight = 20;

  const pageCommands: string[][] = [];
  let commands: string[] = [];
  let pageNumber = 0;
  let cursorY = pageHeight - marginBottom;

  const startPage = () => {
    pageNumber += 1;
    commands = [];

    pushRect(commands, {
      x: 0,
      y: pageHeight - headerHeight,
      width: pageWidth,
      height: headerHeight,
      fill: [0.09, 0.18, 0.31],
    });
    pushText(commands, {
      x: marginLeft,
      y: pageHeight - 30,
      text: input.title,
      font: "F2",
      size: 16,
      colorRgb: [1, 1, 1],
    });
    pushText(commands, {
      x: marginLeft,
      y: pageHeight - 47,
      text: input.subtitle,
      font: "F1",
      size: 10,
      colorRgb: [0.9, 0.95, 1],
    });
    pushText(commands, {
      x: marginLeft,
      y: pageHeight - 61,
      text: input.generatedAtLabel,
      font: "F1",
      size: 9,
      colorRgb: [0.82, 0.9, 1],
    });
    pushText(commands, {
      x: pageWidth - marginRight - 90,
      y: 16,
      text: `Page ${pageNumber}`,
      font: "F1",
      size: 9,
      colorRgb: [0.35, 0.35, 0.35],
    });

    cursorY = pageHeight - headerHeight - 16;
  };

  const flushPage = () => {
    pageCommands.push(commands);
  };

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight < marginBottom + footerHeight) {
      flushPage();
      startPage();
    }
  };

  const drawSectionTitle = (title: string, isContinuation = false) => {
    const label = isContinuation ? `${title} (cont.)` : title;
    ensureSpace(24);
    pushText(commands, {
      x: marginLeft,
      y: cursorY,
      text: label,
      font: "F2",
      size: 12,
    });
    cursorY -= 16;
  };

  const drawTableHeader = (columns: PdfReportTableColumn[], xOffsets: number[]) => {
    ensureSpace(headerRowHeight);
    const rowBottom = cursorY - headerRowHeight;
    pushRect(commands, {
      x: marginLeft,
      y: rowBottom,
      width: contentWidth,
      height: headerRowHeight,
      fill: [0.9, 0.93, 0.97],
      stroke: [0.74, 0.78, 0.84],
    });

    for (let i = 0; i < columns.length; i += 1) {
      const col = columns[i];
      const x = xOffsets[i];
      const width = xOffsets[i + 1] - xOffsets[i];
      const text = clipText(col.label, col.widthChars);
      pushText(commands, {
        x: x + 4,
        y: rowBottom + 6,
        text,
        font: "F2",
        size: 9,
        colorRgb: [0.1, 0.16, 0.25],
      });
      pushRect(commands, {
        x,
        y: rowBottom,
        width,
        height: headerRowHeight,
        stroke: [0.74, 0.78, 0.84],
      });
    }

    cursorY = rowBottom;
  };

  const drawBodyRow = (
    columns: PdfReportTableColumn[],
    xOffsets: number[],
    row: string[],
    rowIndex: number
  ) => {
    ensureSpace(tableRowHeight);
    const rowBottom = cursorY - tableRowHeight;
    pushRect(commands, {
      x: marginLeft,
      y: rowBottom,
      width: contentWidth,
      height: tableRowHeight,
      fill: rowIndex % 2 === 0 ? [1, 1, 1] : [0.97, 0.98, 0.995],
      stroke: [0.82, 0.85, 0.9],
    });

    for (let i = 0; i < columns.length; i += 1) {
      const col = columns[i];
      const x = xOffsets[i];
      const width = xOffsets[i + 1] - xOffsets[i];
      const value = clipText(row[i] ?? "", col.widthChars);
      if ((col.align ?? "left") === "right") {
        const textWidth = estimateMonospaceTextWidth(value, 9);
        pushText(commands, {
          x: x + width - 4 - textWidth,
          y: rowBottom + 5,
          text: value,
          font: "F3",
          size: 9,
          colorRgb: [0.08, 0.1, 0.13],
        });
      } else {
        pushText(commands, {
          x: x + 4,
          y: rowBottom + 5,
          text: value,
          font: "F3",
          size: 9,
          colorRgb: [0.08, 0.1, 0.13],
        });
      }
      pushRect(commands, {
        x,
        y: rowBottom,
        width,
        height: tableRowHeight,
        stroke: [0.82, 0.85, 0.9],
      });
    }

    cursorY = rowBottom;
  };

  startPage();

  for (const section of input.sections) {
    drawSectionTitle(section.title, false);
    const totalWidthChars = section.columns.reduce((acc, col) => acc + col.widthChars, 0);
    const xOffsets: number[] = [marginLeft];
    for (const col of section.columns) {
      const width = (contentWidth * col.widthChars) / Math.max(1, totalWidthChars);
      xOffsets.push(xOffsets[xOffsets.length - 1] + width);
    }
    xOffsets[xOffsets.length - 1] = marginLeft + contentWidth;

    drawTableHeader(section.columns, xOffsets);
    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex += 1) {
      const needsPageBreak = cursorY - tableRowHeight < marginBottom + footerHeight;
      if (needsPageBreak) {
        flushPage();
        startPage();
        drawSectionTitle(section.title, true);
        drawTableHeader(section.columns, xOffsets);
      }
      drawBodyRow(section.columns, xOffsets, section.rows[rowIndex], rowIndex);
    }
    cursorY -= 12;
  }

  flushPage();

  const streams = pageCommands.map((cmds) => cmds.join("\n"));
  return finalizePdf({
    title: input.title,
    generatedAt: input.generatedAt,
    pageStreams: streams,
  });
}

function splitLines(lines: string[], maxLinesPerPage: number): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }
  return pages.length > 0 ? pages : [[""]];
}

export function buildSimplePdfDocument(input: {
  title: string;
  lines: string[];
  generatedAt?: Date;
}): Uint8Array {
  const marginLeft = 40;
  const topY = 800;
  const lineHeight = 14;
  const maxLinesPerPage = 52;
  const pages = splitLines(input.lines, maxLinesPerPage);

  const streams = pages.map((page) => {
    const textCommands: string[] = [];
    textCommands.push("BT");
    textCommands.push("/F3 11 Tf");
    textCommands.push(`${marginLeft} ${topY} Td`);
    for (const line of page) {
      textCommands.push(`(${escapePdfText(line)}) Tj`);
      textCommands.push(`0 -${lineHeight} Td`);
    }
    textCommands.push("ET");
    return textCommands.join("\n");
  });

  return finalizePdf({
    title: input.title,
    generatedAt: input.generatedAt,
    pageStreams: streams,
  });
}
