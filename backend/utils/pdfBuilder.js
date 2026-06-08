const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const A4 = { width: 595.28, height: 841.89 };
const margin = 36;

const addImagePage = async (pdfDoc, bytes, ext) => {
  const image = ext === ".png" ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  const page = pdfDoc.addPage([A4.width, A4.height]);
  const availableWidth = A4.width - margin * 2;
  const availableHeight = A4.height - margin * 2;
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  page.drawImage(image, {
    x: (A4.width - width) / 2,
    y: (A4.height - height) / 2,
    width,
    height,
  });
};

const appendFile = async (targetPdf, absolutePath) => {
  const bytes = fs.readFileSync(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".pdf") {
    const sourcePdf = await PDFDocument.load(bytes);
    const pages = await targetPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => targetPdf.addPage(page));
    return;
  }

  if ([".jpg", ".jpeg", ".png"].includes(ext)) {
    await addImagePage(targetPdf, bytes, ext);
    return;
  }

  throw new Error(`Unsupported file type: ${ext}`);
};

const createCombinedPdf = async ({ files, outputDir, outputName }) => {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    await appendFile(pdfDoc, file);
  }

  if (pdfDoc.getPageCount() === 0) {
    throw new Error("No files available to combine.");
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, outputName);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
};

module.exports = { createCombinedPdf };
