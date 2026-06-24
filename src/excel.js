(function () {
  const LABEL_HEIGHT = 8;
  const GAP_ROWS = 1;

  function applyBorder(cell, border) {
    cell.border = border;
  }

  function setOuterBorder(worksheet, startRow, endRow, startCol, endCol) {
    const medium = { style: "medium", color: { argb: "FF000000" } };
    const thin = { style: "thin", color: { argb: "FF000000" } };

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        const cell = worksheet.getCell(row, col);
        applyBorder(cell, {
          top: row === startRow ? medium : thin,
          left: col === startCol ? medium : thin,
          bottom: row === endRow ? medium : thin,
          right: col === endCol ? medium : thin
        });
      }
    }
  }

  function styleTextCell(cell, options = {}) {
    cell.font = {
      name: "Microsoft JhengHei",
      size: options.size || 14,
      bold: Boolean(options.bold)
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true
    };
  }

  function setupWorksheet(worksheet) {
    worksheet.name = "標籤";
    worksheet.properties.defaultRowHeight = 22;
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1
      }
    };

    worksheet.columns = [
      { key: "a", width: 9 },
      { key: "b", width: 18 },
      { key: "c", width: 18 },
      { key: "d", width: 11 },
      { key: "e", width: 11 },
      { key: "f", width: 11 }
    ];
  }

  function writeLabelText(worksheet, startRow, labelData) {
    const rows = [
      { row: 0, label: "工單：", value: labelData.workOrder },
      { row: 1, label: "數量：", value: labelData.quantity },
      { row: 2, label: "料號：", value: labelData.partNo },
      { row: 3, label: "下一製程：", value: "" },
      { row: 4, label: "", value: labelData.nextProcess, size: 16, bold: true },
      { row: 6, label: "列印日期：", value: labelData.dateDisplay }
    ];

    rows.forEach((item) => {
      const rowNumber = startRow + item.row;
      worksheet.mergeCells(rowNumber, 1, rowNumber, 3);
      const cell = worksheet.getCell(rowNumber, 1);
      cell.value = `${item.label}${item.value}`;
      styleTextCell(cell, { size: item.size, bold: item.bold });
    });
  }

  function writeQrImage(workbook, worksheet, startRow, qrDataUrl) {
    const imageId = workbook.addImage({
      base64: qrDataUrl,
      extension: "png"
    });

    worksheet.mergeCells(startRow, 4, startRow + LABEL_HEIGHT - 1, 6);
    worksheet.addImage(imageId, {
      tl: { col: 3.25, row: startRow - 0.75 },
      ext: { width: 132, height: 132 }
    });
  }

  function writeOneLabel(workbook, worksheet, labelData, qrDataUrl, index) {
    const startRow = 1 + index * (LABEL_HEIGHT + GAP_ROWS);
    const endRow = startRow + LABEL_HEIGHT - 1;

    for (let row = startRow; row <= endRow; row += 1) {
      worksheet.getRow(row).height = 22;
    }

    writeLabelText(worksheet, startRow, labelData);
    writeQrImage(workbook, worksheet, startRow, qrDataUrl);
    setOuterBorder(worksheet, startRow, endRow, 1, 6);
  }

  async function buildWorkbook(labelData, serials) {
    const workbook = new window.ExcelJS.Workbook();
    workbook.creator = "QR Code Excel Label Generator";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("標籤", {
      views: [{ showGridLines: false }]
    });
    setupWorksheet(worksheet);

    for (let index = 0; index < serials.length; index += 1) {
      const serial = serials[index];
      const payload = window.QRCodeBuilder.buildPayload(labelData, serial);
      const qrDataUrl = await window.QRCodeBuilder.createQrDataUrl(payload);
      writeOneLabel(workbook, worksheet, labelData, qrDataUrl, index);
    }

    return workbook;
  }

  async function downloadWorkbook(labelData, serials) {
    const workbook = await buildWorkbook(labelData, serials);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const safeWorkOrder = labelData.workOrder.replace(/[\\/:*?"<>|]+/g, "_");
    const fileName = `QRCode_Labels_${safeWorkOrder}_${labelData.dateCompact}.xlsx`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  window.ExcelLabelBuilder = {
    buildWorkbook,
    downloadWorkbook
  };
})();
