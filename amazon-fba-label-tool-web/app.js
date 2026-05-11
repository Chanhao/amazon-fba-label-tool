const CODE128_PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112",
];

const TEMPLATE = {
  fnsku: "",
  title: "",
  contents: "",
  condition: "New",
  origin: "Made in China",
  quantity: 1,
  verticalOffset: 2,
};

const els = {
  singleForm: document.querySelector("#singleForm"),
  batchForm: document.querySelector("#batchForm"),
  fnsku: document.querySelector("#fnsku"),
  titleText: document.querySelector("#titleText"),
  contentsText: document.querySelector("#contentsText"),
  conditionText: document.querySelector("#conditionText"),
  originText: document.querySelector("#originText"),
  quantity: document.querySelector("#quantity"),
  verticalOffset: document.querySelector("#verticalOffset"),
  batchInput: document.querySelector("#batchInput"),
  batchConditionText: document.querySelector("#batchConditionText"),
  batchOriginText: document.querySelector("#batchOriginText"),
  batchVerticalOffset: document.querySelector("#batchVerticalOffset"),
  validationMessage: document.querySelector("#validationMessage"),
  previewHolder: document.querySelector("#previewHolder"),
  previewMeta: document.querySelector("#previewMeta"),
  printArea: document.querySelector("#printArea"),
  printButton: document.querySelector("#printButton"),
  downloadButton: document.querySelector("#downloadButton"),
  resetButton: document.querySelector("#resetButton"),
  segments: [...document.querySelectorAll(".segment")],
};

let activeMode = "single";
let measureContext;

const PRODUCT_TEXT_LAYOUTS = [
  {
    titleMaxLines: 1,
    contentsMaxLines: 1,
    titleBasePt: 3.7,
    titleMinPt: 2.3,
    contentsBasePt: 3.9,
    contentsMinPt: 2.4,
  },
  {
    titleMaxLines: 1,
    contentsMaxLines: 2,
    titleBasePt: 3.5,
    titleMinPt: 2.2,
    contentsBasePt: 3.5,
    contentsMinPt: 2.25,
  },
  {
    titleMaxLines: 1,
    contentsMaxLines: 3,
    titleBasePt: 3.25,
    titleMinPt: 2.1,
    contentsBasePt: 3.15,
    contentsMinPt: 2.05,
  },
  {
    titleMaxLines: 2,
    contentsMaxLines: 2,
    titleBasePt: 3.2,
    titleMinPt: 2.05,
    contentsBasePt: 3.05,
    contentsMinPt: 2.05,
  },
];

const PRODUCT_TEXT_LEFT_MM = 1.5;
const PRODUCT_TEXT_TOP_MM = 20.15;
const PRODUCT_TEXT_WIDTH_MM = 57;
const PRODUCT_TEXT_HEIGHT_MM = 8.65;
const TEXT_MEASURE_SAFETY = 0.92;

function normalizeBarcode(value) {
  return String(value || "").trim().toUpperCase();
}

function clampQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(500, Math.max(1, parsed));
}

function clampVerticalOffset(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return TEMPLATE.verticalOffset;
  return Math.min(5, Math.max(-2, parsed));
}

function getMeasureContext() {
  if (!measureContext) {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  return measureContext;
}

function mmToCssPx(mm) {
  return (mm * 96) / 25.4;
}

function fitPt(text, basePt, minPt, widthMm, weight = "400") {
  const value = String(text || "");
  if (!value) return basePt;
  const ctx = getMeasureContext();
  let size = basePt;
  const maxWidth = mmToCssPx(widthMm);
  while (size > minPt) {
    ctx.font = `${weight} ${size}pt Arial, Helvetica, sans-serif`;
    if (ctx.measureText(value).width <= maxWidth) break;
    size -= 0.1;
  }
  return Math.max(minPt, Number(size.toFixed(1)));
}

function estimateTextWidthMm(text, fontPt) {
  return measureTextWidth(text, fontPt) / mmToCssPx(1);
}

function measureTextWidth(text, fontPt, weight = "400") {
  const ctx = getMeasureContext();
  ctx.font = `${weight} ${fontPt}pt Arial, Helvetica, sans-serif`;
  return ctx.measureText(String(text || "")).width;
}

function splitLongWord(word, fontPt, maxWidthPx) {
  const chunks = [];
  let current = "";

  for (const char of word) {
    const next = `${current}${char}`;
    if (current && measureTextWidth(next, fontPt) > maxWidthPx) {
      chunks.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function wrapTextLines(text, fontPt, widthMm, maxLines, safety = TEXT_MEASURE_SAFETY) {
  const maxWidthPx = mmToCssPx(widthMm) * safety;
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let current = "";
  let overflow = false;

  function pushLine(line) {
    if (!line) return true;
    if (lines.length >= maxLines) {
      overflow = true;
      return false;
    }
    lines.push(line);
    return true;
  }

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextWidth(candidate, fontPt) <= maxWidthPx) {
      current = candidate;
      continue;
    }

    if (current) {
      if (!pushLine(current)) break;
      current = "";
    }

    if (measureTextWidth(word, fontPt) <= maxWidthPx) {
      current = word;
      continue;
    }

    const chunks = splitLongWord(word, fontPt, maxWidthPx);
    for (const chunk of chunks) {
      if (!pushLine(chunk)) break;
    }
    if (overflow) break;
  }

  if (!overflow && current) pushLine(current);
  return { lines, overflow };
}

function fitWrappedText(text, basePt, minPt, widthMm, maxLines, safety = TEXT_MEASURE_SAFETY) {
  for (let size = basePt; size >= minPt; size -= 0.1) {
    const fontPt = Number(size.toFixed(1));
    const wrapped = wrapTextLines(text, fontPt, widthMm, maxLines, safety);
    if (!wrapped.overflow) {
      return { ...wrapped, fontPt };
    }
  }

  const fontPt = minPt;
  return { ...wrapTextLines(text, fontPt, widthMm, maxLines, safety), fontPt };
}

function lineHeightForFont(fontPt) {
  return Math.max(1.62, Number((fontPt * 0.57).toFixed(2)));
}

function layoutProductText(record) {
  const widthMm = PRODUCT_TEXT_WIDTH_MM;
  const title = String(record.title || "").trim();
  const contents = String(record.contents || "").trim();

  for (const option of PRODUCT_TEXT_LAYOUTS) {
    const titleLayout = fitWrappedText(
      title,
      option.titleBasePt,
      option.titleMinPt,
      widthMm,
      option.titleMaxLines,
      0.98
    );
    const contentsLayout = fitWrappedText(
      contents,
      option.contentsBasePt,
      option.contentsMinPt,
      widthMm,
      option.contentsMaxLines,
      0.94
    );

    if (titleLayout.overflow || contentsLayout.overflow) continue;

    const plannedLines = [
      ...titleLayout.lines.map((line) => ({
        text: line,
        role: "title",
        fontPt: titleLayout.fontPt,
        lineHeightMm: lineHeightForFont(titleLayout.fontPt),
      })),
      ...contentsLayout.lines.map((line) => ({
        text: line,
        role: "contents",
        fontPt: contentsLayout.fontPt,
        lineHeightMm: lineHeightForFont(contentsLayout.fontPt),
      })),
    ];
    const totalHeightMm = plannedLines.reduce((total, line) => total + line.lineHeightMm, 0);
    if (totalHeightMm > PRODUCT_TEXT_HEIGHT_MM) continue;

    let cursorMm = PRODUCT_TEXT_TOP_MM + Math.max(0, (PRODUCT_TEXT_HEIGHT_MM - totalHeightMm) / 2);
    const lines = [];
    for (const line of plannedLines) {
      lines.push({ ...line, topMm: cursorMm });
      cursorMm += line.lineHeightMm;
    }

    return {
      lines,
      topMm: PRODUCT_TEXT_TOP_MM,
      overflow: false,
    };
  }

  const fallback = PRODUCT_TEXT_LAYOUTS[PRODUCT_TEXT_LAYOUTS.length - 1];
  const titleLayout = fitWrappedText(
    title,
    fallback.titleBasePt,
    fallback.titleMinPt,
    widthMm,
    fallback.titleMaxLines,
    0.98
  );
  const contentsLayout = fitWrappedText(
    contents,
    fallback.contentsBasePt,
    fallback.contentsMinPt,
    widthMm,
    fallback.contentsMaxLines,
    0.94
  );
  const plannedLines = [
    ...titleLayout.lines.map((line) => ({
      text: line,
      role: "title",
      fontPt: titleLayout.fontPt,
      lineHeightMm: lineHeightForFont(titleLayout.fontPt),
    })),
    ...contentsLayout.lines.map((line) => ({
      text: line,
      role: "contents",
      fontPt: contentsLayout.fontPt,
      lineHeightMm: lineHeightForFont(contentsLayout.fontPt),
    })),
  ];
  const totalHeightMm = plannedLines.reduce((total, line) => total + line.lineHeightMm, 0);
  let cursorMm = PRODUCT_TEXT_TOP_MM + Math.max(0, (PRODUCT_TEXT_HEIGHT_MM - totalHeightMm) / 2);
  const lines = [];
  for (const line of plannedLines) {
    lines.push({ ...line, topMm: cursorMm });
    cursorMm += line.lineHeightMm;
  }

  return {
    lines,
    topMm: PRODUCT_TEXT_TOP_MM,
    overflow: titleLayout.overflow || contentsLayout.overflow,
  };
}

function validateBarcode(value) {
  if (!value) return "FNSKU 不能为空。";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126) {
      return "条码只能使用英文、数字和常见半角符号。";
    }
  }
  return "";
}

function encodeCode128B(value) {
  const barcode = normalizeBarcode(value);
  const error = validateBarcode(barcode);
  if (error) throw new Error(error);

  const codes = [104];
  let checksum = 104;
  for (let index = 0; index < barcode.length; index += 1) {
    const valueCode = barcode.charCodeAt(index) - 32;
    codes.push(valueCode);
    checksum += valueCode * (index + 1);
  }
  codes.push(checksum % 103);
  codes.push(106);
  return codes;
}

function getBarcodeBars(value) {
  const codes = encodeCode128B(value);
  const quiet = 10;
  const bars = [];
  let cursor = quiet;

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    for (let index = 0; index < pattern.length; index += 1) {
      const width = Number(pattern[index]);
      if (index % 2 === 0) {
        bars.push({ x: cursor, width });
      }
      cursor += width;
    }
  }

  return { bars, totalWidth: cursor + quiet };
}

function barcodeSvg(value) {
  if (!normalizeBarcode(value)) {
    return `<svg class="barcode-svg empty" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>`;
  }

  try {
    const { bars, totalWidth } = getBarcodeBars(value);
    const rects = bars
      .map((bar) => `<rect x="${bar.x}" y="0" width="${bar.width}" height="100"></rect>`)
      .join("");
    return [
      `<svg class="barcode-svg" viewBox="0 0 ${totalWidth} 100" preserveAspectRatio="none"`,
      ` role="img" aria-label="Code 128 barcode">`,
      rects,
      `</svg>`,
    ].join("");
  } catch (error) {
    return [
      `<svg class="barcode-svg invalid" viewBox="0 0 100 100" role="img" aria-label="Invalid barcode">`,
      `<text x="50" y="55" text-anchor="middle" font-size="10" fill="#000">INVALID</text>`,
      `</svg>`,
    ].join("");
  }
}

function makeRecordFromSingle() {
  return {
    fnsku: normalizeBarcode(els.fnsku.value),
    title: els.titleText.value.trim(),
    contents: els.contentsText.value.trim(),
    condition: els.conditionText.value.trim() || "New",
    origin: els.originText.value.trim() || "Made in China",
    quantity: clampQuantity(els.quantity.value),
    verticalOffset: clampVerticalOffset(els.verticalOffset.value),
  };
}

function parseCsvLine(line) {
  if (line.includes("\t")) {
    return line.split("\t").map((part) => part.trim());
  }

  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function makeRecordsFromBatch() {
  const condition = els.batchConditionText.value.trim() || "New";
  const origin = els.batchOriginText.value.trim() || "Made in China";
  const verticalOffset = clampVerticalOffset(els.batchVerticalOffset.value);
  const lines = els.batchInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map(parseCsvLine)
    .filter((parts, index) => {
      if (index !== 0) return true;
      return !/^(fnsku|sku|asin|条码|fba)$/i.test(parts[0] || "");
    })
    .map((parts) => ({
      fnsku: normalizeBarcode(parts[0]),
      title: (parts[1] || "").trim(),
      contents: (parts[2] || "").trim(),
      condition,
      origin,
      quantity: clampQuantity(parts[3] || 1),
      verticalOffset,
    }));
}

function getRecords() {
  return activeMode === "batch" ? makeRecordsFromBatch() : [makeRecordFromSingle()];
}

function getExpandedRecords(records) {
  return records.flatMap((record) =>
    Array.from({ length: clampQuantity(record.quantity) }, () => ({ ...record, quantity: 1 }))
  );
}

function productSvgElement(productLayout) {
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("class", "product-svg");
  svg.setAttribute("viewBox", `0 0 ${PRODUCT_TEXT_WIDTH_MM} ${PRODUCT_TEXT_HEIGHT_MM}`);
  svg.setAttribute("aria-hidden", "true");

  for (const line of productLayout.lines) {
    const text = document.createElementNS(svgNs, "text");
    text.setAttribute("class", `product-line product-line-${line.role}`);
    text.setAttribute("x", String(PRODUCT_TEXT_WIDTH_MM / 2));
    text.setAttribute(
      "y",
      String(Number((line.topMm - PRODUCT_TEXT_TOP_MM + line.lineHeightMm / 2).toFixed(2)))
    );
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "Arial, Helvetica, sans-serif");
    text.setAttribute("font-size", String(Number((line.fontPt * 0.3527777778).toFixed(2))));
    text.textContent = line.text;
    svg.append(text);
  }

  return svg;
}

function labelElement(record) {
  const productLayout = layoutProductText(record);
  const verticalOffset = clampVerticalOffset(record.verticalOffset);
  const label = document.createElement("article");
  label.className = "fba-label";
  label.innerHTML = `
    <div class="barcode-zone">
      ${barcodeSvg(record.fnsku)}
      <span class="code-text"></span>
    </div>
    <div class="label-product"></div>
    <div class="label-line label-condition"></div>
    <div class="label-line label-origin"></div>
  `;

  const code = label.querySelector(".code-text");
  const product = label.querySelector(".label-product");
  const condition = label.querySelector(".label-condition");
  const origin = label.querySelector(".label-origin");

  code.textContent = record.fnsku;
  condition.textContent = record.condition;
  origin.textContent = record.origin;

  label.querySelector(".barcode-zone").style.top = `${2.35 + verticalOffset}mm`;
  code.style.fontSize = `${fitPt(record.fnsku, 6, 4.2, 54.43)}pt`;
  product.style.top = `${productLayout.topMm + verticalOffset}mm`;
  product.replaceChildren(productSvgElement(productLayout));
  condition.style.fontSize = `${fitPt(record.condition, 9, 5, 15)}pt`;
  condition.style.top = `${29.98387 + verticalOffset}mm`;
  origin.style.fontSize = `${fitPt(record.origin, 9, 5, 23.28)}pt`;
  origin.style.top = `${29.98387 + verticalOffset}mm`;

  return label;
}

function printPage(record) {
  const page = document.createElement("div");
  page.className = "print-page";
  page.append(labelElement(record));
  return page;
}

function isBlankSingleDraft(records) {
  return (
    activeMode === "single" &&
    records.length === 1 &&
    !records[0].fnsku &&
    !records[0].title &&
    !records[0].contents
  );
}

function hasRequiredFields(records) {
  return records.length > 0 && records.every((record) => record.fnsku && record.title);
}

function validationFor(records) {
  if (isBlankSingleDraft(records)) return "";

  if (!records.length) return "批量模式下至少需要一行数据。";

  const firstInvalid = records.find((record) => validateBarcode(record.fnsku));
  if (firstInvalid) return `${firstInvalid.fnsku || "空条码"}：${validateBarcode(firstInvalid.fnsku)}`;

  const missingTitle = records.find((record) => !record.title);
  if (missingTitle) return `${missingTitle.fnsku}：商品标题不能为空。`;

  const overflowingText = records.find((record) => layoutProductText(record).overflow);
  if (overflowingText) return `${overflowingText.fnsku}：标题或套装内容过长，请缩短后再打印。`;

  const longBarcode = records.find((record) => record.fnsku.length > 20);
  if (longBarcode) return `${longBarcode.fnsku}：条码偏长，打印后请先扫描确认。`;

  return "";
}

function render() {
  const records = getRecords();
  const expanded = getExpandedRecords(records);
  const validation = validationFor(records);

  els.validationMessage.textContent = validation;
  const canOutput = hasRequiredFields(records) && (!validation || validation.includes("偏长"));
  els.printButton.disabled = !canOutput;
  els.downloadButton.disabled = !canOutput;

  const previewRecord = records[0] || TEMPLATE;
  els.previewHolder.replaceChildren(labelElement(previewRecord));
  els.printArea.replaceChildren(...expanded.map(printPage));

  const total = expanded.length || 0;
  els.previewMeta.textContent = `${total} 张标签`;
}

function setMode(mode) {
  activeMode = mode;
  els.singleForm.classList.toggle("hidden", mode !== "single");
  els.batchForm.classList.toggle("hidden", mode !== "batch");
  els.segments.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  render();
}

function resetTemplate() {
  els.fnsku.value = TEMPLATE.fnsku;
  els.titleText.value = TEMPLATE.title;
  els.contentsText.value = TEMPLATE.contents;
  els.conditionText.value = TEMPLATE.condition;
  els.originText.value = TEMPLATE.origin;
  els.quantity.value = TEMPLATE.quantity;
  els.verticalOffset.value = TEMPLATE.verticalOffset.toFixed(1);
  els.batchInput.value = "";
  els.batchConditionText.value = TEMPLATE.condition;
  els.batchOriginText.value = TEMPLATE.origin;
  els.batchVerticalOffset.value = TEMPLATE.verticalOffset.toFixed(1);
  setMode("single");
}

function ptToCanvasPx(pt, pxPerMm) {
  return pt * 0.3527777778 * pxPerMm;
}

function fitCanvasPt(ctx, text, basePt, minPt, widthPx, pxPerMm) {
  let size = basePt;
  while (size > minPt) {
    ctx.font = `${ptToCanvasPx(size, pxPerMm)}px Arial, Helvetica, sans-serif`;
    if (ctx.measureText(text).width <= widthPx) break;
    size -= 0.1;
  }
  return Math.max(minPt, Number(size.toFixed(1)));
}

function drawBarcodeCanvas(ctx, value, x, y, width, height) {
  const { bars, totalWidth } = getBarcodeBars(value);
  const moduleWidth = width / totalWidth;
  ctx.fillStyle = "#000000";
  for (const bar of bars) {
    ctx.fillRect(x + bar.x * moduleWidth, y, Math.max(1, bar.width * moduleWidth), height);
  }
}

function drawFittedText(ctx, text, basePt, minPt, x, y, width, align, pxPerMm) {
  const fittedPt = fitCanvasPt(ctx, text, basePt, minPt, width, pxPerMm);
  ctx.fillStyle = "#000000";
  ctx.font = `${ptToCanvasPx(fittedPt, pxPerMm)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const drawX = align === "left" ? x : x + width / 2;
  ctx.fillText(text, drawX, y, width);
}

function drawTextLine(ctx, text, fontPt, x, y, width, align, pxPerMm) {
  ctx.fillStyle = "#000000";
  ctx.font = `${ptToCanvasPx(fontPt, pxPerMm)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const drawX = align === "left" ? x : x + width / 2;
  ctx.fillText(text, drawX, y, width);
}

async function previewPngBase64(record) {
  const verticalOffset = clampVerticalOffset(record.verticalOffset);
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 666;
  const ctx = canvas.getContext("2d");
  const pxPerMm = canvas.width / 60;
  const mm = (value) => value * pxPerMm;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBarcodeCanvas(ctx, record.fnsku, mm(2.82), mm(2.35 + verticalOffset), mm(54.43), mm(12.2));
  drawFittedText(ctx, record.fnsku, 6, 4.2, mm(2.82), mm(16.95 + verticalOffset), mm(54.43), "center", pxPerMm);
  const productLayout = layoutProductText(record);
  productLayout.lines.forEach((line) => {
    drawTextLine(
      ctx,
      line.text,
      line.fontPt,
      mm(PRODUCT_TEXT_LEFT_MM),
      mm(line.topMm + verticalOffset + line.lineHeightMm / 2),
      mm(PRODUCT_TEXT_WIDTH_MM),
      "center",
      pxPerMm
    );
  });
  drawFittedText(ctx, record.condition, 9, 5, mm(6.1), mm(32.23 + verticalOffset), mm(15), "left", pxPerMm);
  drawFittedText(ctx, record.origin, 9, 5, mm(30.5), mm(32.23 + verticalOffset), mm(23.28), "left", pxPerMm);

  return canvas.toDataURL("image/png").split(",")[1];
}

function xmlEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function ddlFont(value, basePt, minPt, widthMm) {
  return fitPt(value, basePt, minPt, widthMm).toFixed(1).replace(/\.0$/, "");
}

function formatNumber(value) {
  return Number(value).toFixed(6);
}

function ddlTextObject({ zvalue, value, fontSize, l, t, w, h, alignment = 1 }) {
  return `      <drawobj memory="0" ellipse="false" textlength="0" lock="false" fontsize="${fontSize}" fontfamily="微软雅黑" stretch="100" zvalue="${zvalue}" datasource="0" minute="0" w="${formatNumber(w)}" second="0" addorsub="0" timeformat="0" alignment="${alignment}" h="${formatNumber(h)}" rotate="0" fontbold="false" l="${formatNumber(l)}" fontunderline="false" blackground="false" startposition="0" repeat="1" hormirror="false" fontletterspacing="0" linespacing="0" hour="0" itemtype="5" currentdata="1" year="0" month="0" fontstrikeout="false" dateformat="0" interval="1" fontitalic="false" t="${formatNumber(t)}" day="0">
        <textlist>
          <text value="${xmlEscape(value)}" promptname="" repeat="1" day="0" addorsub="0" currentdata="1" second="0" interval="1" memory="0" year="0" keyinput="0" datasource="0" dateformat="0" month="0" timeformat="0" hour="0" minute="0"/>
        </textlist>
      </drawobj>`;
}

function ddlXml(record, previewImage) {
  const fnsku = xmlEscape(record.fnsku);
  const condition = xmlEscape(record.condition);
  const origin = xmlEscape(record.origin);
  const verticalOffset = clampVerticalOffset(record.verticalOffset);
  const productLayout = layoutProductText(record);
  const productObjects = productLayout.lines
    .map((line, index) =>
      ddlTextObject({
        zvalue: index + 2,
        value: line.text,
        fontSize: line.fontPt,
        l: PRODUCT_TEXT_LEFT_MM,
        t: line.topMm + verticalOffset,
        w: PRODUCT_TEXT_WIDTH_MM,
        h: line.lineHeightMm,
        alignment: 1,
      })
    )
    .join("\n");
  const conditionZ = productLayout.lines.length + 2;
  const originZ = productLayout.lines.length + 3;
  const conditionFont = ddlFont(record.condition, 9, 5, 15);
  const originFont = ddlFont(record.origin, 9, 5, 23.28);

  return `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<DLabel previewimage="${previewImage}" version="3.2.3" source="pc">
  <paper excelurl="" veroffset="0" datasource="" w="60" h="40" rotate="0" excelhash="" horoffset="0" excelpath="" colspacing="2" zoomfactor="3.7252902984619141" colcount="1" bgcolor="" bgurl="" moreselect="true" background="" databasefile="" excelid="" shapeindex="1">
    <labelobjects>
      <drawobj characterset="0" zvalue="1" addbarcode="false" addorsub="0" hidelanding="false" checkcode="1" textposition="0" fontfamily="微软雅黑" rotate="0" repeat="1" fontbold="false" w="54.434460" currentdata="1" day="0" datasource="0" month="0" thickness="5" subtype="" lock="false" hour="0" barcodetype="CODE_128" textoffset="1.00" addtype="0" quietzone="10" alignment="1" density="0.37541" year="0" timeformat="0" fontsize="6" h="17.200000" t="${formatNumber(2.35 + verticalOffset)}" maskcontent="" minute="0" second="0" fontunderline="false" ucc="false" interval="1" fontitalic="false" l="2.820890" itemtype="7" bearerbar="1" maskcharacter="" dateformat="0" fontstrikeout="false" memory="0">
        <textlist>
          <text value="${fnsku}" promptname="" repeat="1" day="0" addorsub="0" currentdata="1" second="0" interval="1" memory="0" year="0" keyinput="0" datasource="0" dateformat="0" month="0" timeformat="0" hour="0" minute="0"/>
        </textlist>
      </drawobj>
${productObjects}
      <drawobj memory="0" ellipse="false" textlength="0" lock="false" fontsize="${conditionFont}" fontfamily="微软雅黑" stretch="100" zvalue="${conditionZ}" datasource="0" minute="0" w="15.000000" second="0" addorsub="0" timeformat="0" alignment="4" h="4.498040" rotate="0" fontbold="false" l="6.100000" fontunderline="false" blackground="false" startposition="0" repeat="1" hormirror="false" fontletterspacing="0" linespacing="0" hour="0" itemtype="5" currentdata="1" year="0" month="0" fontstrikeout="false" dateformat="0" interval="1" fontitalic="false" t="${formatNumber(29.98387 + verticalOffset)}" day="0">
        <textlist>
          <text value="${condition}" promptname="" repeat="1" day="0" addorsub="0" currentdata="1" second="0" interval="1" memory="0" year="0" keyinput="0" datasource="0" dateformat="0" month="0" timeformat="0" hour="0" minute="0"/>
        </textlist>
      </drawobj>
      <drawobj memory="0" ellipse="false" textlength="0" lock="false" fontsize="${originFont}" fontfamily="微软雅黑" stretch="100" zvalue="${originZ}" datasource="0" minute="0" w="23.283340" second="0" addorsub="0" timeformat="0" alignment="4" h="4.498040" rotate="0" fontbold="false" l="30.500000" fontunderline="false" blackground="false" startposition="0" repeat="1" hormirror="false" fontletterspacing="0" linespacing="0" hour="0" itemtype="5" currentdata="1" year="0" month="0" fontstrikeout="false" dateformat="0" interval="1" fontitalic="false" t="${formatNumber(29.98387 + verticalOffset)}" day="0">
        <textlist>
          <text value="${origin}" promptname="" repeat="1" day="0" addorsub="0" currentdata="1" second="0" interval="1" memory="0" year="0" keyinput="0" datasource="0" dateformat="0" month="0" timeformat="0" hour="0" minute="0"/>
        </textlist>
      </drawobj>
    </labelobjects>
  </paper>
</DLabel>
`;
}

function safeFileName(value) {
  return String(value || "label")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadDdl() {
  const records = getRecords();
  const validation = validationFor(records);
  if (validation && !validation.includes("偏长")) return;

  const record = records[0];
  const previewImage = await previewPngBase64(record);
  const xml = ddlXml(record, previewImage);
  const fileName = `${safeFileName(`${record.fnsku} ${record.title}`)}.ddl`;
  downloadFile(fileName, xml, "application/xml;charset=utf-8");
}

function printLabels() {
  const records = getRecords();
  const validation = validationFor(records);
  if (validation && !validation.includes("偏长")) return;
  render();
  window.print();
}

for (const input of document.querySelectorAll("input, textarea")) {
  input.addEventListener("input", render);
}

els.segments.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

els.printButton.addEventListener("click", printLabels);
els.downloadButton.addEventListener("click", downloadDdl);
els.resetButton.addEventListener("click", resetTemplate);

function applyUrlDefaults() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("fnsku")) els.fnsku.value = params.get("fnsku");
  if (params.has("title")) els.titleText.value = params.get("title");
  if (params.has("contents")) els.contentsText.value = params.get("contents");
  if (params.has("condition")) els.conditionText.value = params.get("condition");
  if (params.has("origin")) els.originText.value = params.get("origin");
  if (params.has("quantity")) els.quantity.value = params.get("quantity");
  if (params.has("verticalOffset")) {
    els.verticalOffset.value = params.get("verticalOffset");
    els.batchVerticalOffset.value = params.get("verticalOffset");
  }
  if (params.has("offset")) {
    els.verticalOffset.value = params.get("offset");
    els.batchVerticalOffset.value = params.get("offset");
  }
}

applyUrlDefaults();
render();
