import "./serial.js";
import "./qrcode.js";
import "./excel.js";

(function () {
  const form = document.getElementById("labelForm");
  const message = document.getElementById("message");
  const statusText = document.getElementById("statusText");
  const generateButton = document.getElementById("generateButton");
  const resetButton = document.getElementById("resetButton");
  const previewQr = document.getElementById("previewQr");
  const previewQrCanvas = document.getElementById("previewQrCanvas");
  const previewQrFallback = document.getElementById("previewQrFallback");
  let vendorLoadPromise;
  let qrLoadPromise;
  let previewRenderId = 0;

  const preview = {
    workOrder: document.getElementById("previewWorkOrder"),
    quantity: document.getElementById("previewQuantity"),
    partNo: document.getElementById("previewPartNo"),
    nextProcess: document.getElementById("previewNextProcess"),
    date: document.getElementById("previewDate"),
    firstSerial: document.getElementById("previewFirstSerial"),
    lastSerial: document.getElementById("previewLastSerial"),
    count: document.getElementById("previewCount")
  };

  const previewFieldIds = [
    "workOrder",
    "receiptNo",
    "quantity",
    "partNo",
    "labelDate",
    "nextProcess",
    "labelCount",
    "startSerial"
  ];

  function setMessage(text, type) {
    const hasText = Boolean(text);
    message.textContent = text;
    message.dataset.type = type || "";
    message.hidden = !hasText;

    statusText.textContent = text;
    statusText.hidden = !hasText;
  }

  function clearMessages() {
    setMessage("", "");
  }

  function getBaseUrl() {
    const viteEnv = import.meta.env;
    return (viteEnv && viteEnv.BASE_URL) || "/";
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        if (existing.dataset.loaded === "true") {
          resolve();
        }
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error(`無法載入 ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadScriptFromCandidates(paths) {
    let lastError;

    for (const path of paths) {
      try {
        await loadScript(path);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("套件載入失敗");
  }

  async function ensureQrLibrary() {
    if (window.QRious) {
      return;
    }

    if (!qrLoadPromise) {
      const baseUrl = getBaseUrl();
      qrLoadPromise = loadScriptFromCandidates([
        `${baseUrl}vendor/qrious.min.js`,
        `${baseUrl}public/vendor/qrious.min.js`
      ]);
    }

    await qrLoadPromise;

    if (!window.QRious) {
      throw new Error("QR Code 套件尚未載入，請重新整理頁面後重試");
    }
  }

  async function ensureVendorLibraries() {
    if (window.ExcelJS && window.QRious) {
      return;
    }

    if (!vendorLoadPromise) {
      const baseUrl = getBaseUrl();
      vendorLoadPromise = Promise.all([
        loadScriptFromCandidates([
          `${baseUrl}vendor/exceljs.min.js`,
          `${baseUrl}public/vendor/exceljs.min.js`
        ]),
        ensureQrLibrary()
      ]);
    }

    await vendorLoadPromise;

    if (!window.ExcelJS || !window.QRious) {
      throw new Error("Excel 或 QR Code 套件尚未載入，請重新整理頁面後重試");
    }
  }

  function trimValue(formData, key) {
    return String(formData.get(key) || "").trim();
  }

  function formatDateParts(dateValue, required = true) {
    if (!dateValue) {
      if (required) {
        throw new Error("日期為必填");
      }
      return { compact: "", display: "" };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      throw new Error("日期格式不正確");
    }

    const [year, month, day] = dateValue.split("-");
    return {
      compact: `${year}${month}${day}`,
      display: `${year}/${month}/${day}`
    };
  }

  function requireText(value, fieldName) {
    if (!value) {
      throw new Error(`${fieldName}為必填`);
    }
    return value;
  }

  function readFormData(required = true) {
    const formData = new FormData(form);
    const dateParts = formatDateParts(trimValue(formData, "labelDate"), required);

    const data = {
      workOrder: trimValue(formData, "workOrder"),
      receiptNo: trimValue(formData, "receiptNo"),
      quantity: trimValue(formData, "quantity"),
      dateCompact: dateParts.compact,
      dateDisplay: dateParts.display,
      partNo: trimValue(formData, "partNo"),
      nextProcess: trimValue(formData, "nextProcess"),
      labelCount: trimValue(formData, "labelCount"),
      startSerial: trimValue(formData, "startSerial")
    };

    if (required) {
      requireText(data.workOrder, "製令單號");
      requireText(data.receiptNo, "單據號");
      requireText(data.quantity, "數量");
      requireText(data.partNo, "料號");
      requireText(data.nextProcess, "下一製程");
      requireText(data.labelCount, "產生張數");
      requireText(data.startSerial, "起始序號");
    }

    return data;
  }

  function resetQrPreview() {
    const context = previewQrCanvas.getContext("2d");
    context.clearRect(0, 0, previewQrCanvas.width, previewQrCanvas.height);
    previewQr.classList.remove("has-qr");
    previewQrCanvas.hidden = true;
    previewQrFallback.hidden = false;
  }

  async function renderQrPreview(labelData, serial, renderId) {
    if (!labelData.dateCompact || !serial) {
      resetQrPreview();
      return;
    }

    try {
      await ensureQrLibrary();
      if (renderId !== previewRenderId) {
        return;
      }

      const payload = window.QRCodeBuilder.buildPayload(labelData, serial);
      new window.QRious({
        element: previewQrCanvas,
        value: payload,
        size: 112,
        level: "M",
        padding: 6,
        foreground: "#000000",
        background: "#ffffff"
      });

      previewQrCanvas.hidden = false;
      previewQrFallback.hidden = true;
      previewQr.classList.add("has-qr");
    } catch (error) {
      resetQrPreview();
    }
  }

  function updatePreview() {
    const renderId = ++previewRenderId;
    let labelData;
    let serials = [];

    try {
      labelData = readFormData(false);
      preview.workOrder.textContent = labelData.workOrder;
      preview.quantity.textContent = labelData.quantity;
      preview.partNo.textContent = labelData.partNo;
      preview.nextProcess.textContent = labelData.nextProcess || "";
      preview.date.textContent = labelData.dateDisplay;

      if (labelData.labelCount && labelData.startSerial) {
        serials = window.SerialGenerator.generateSerials(labelData.startSerial, labelData.labelCount);
      }
    } catch (error) {
      preview.date.textContent = "";
      serials = [];
    }

    preview.firstSerial.textContent = serials[0] || "-";
    preview.lastSerial.textContent = serials[serials.length - 1] || "-";
    preview.count.textContent = serials.length ? String(serials.length) : "-";

    if (labelData) {
      void renderQrPreview(labelData, serials[0], renderId);
    } else {
      resetQrPreview();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    try {
      await ensureVendorLibraries();

      const labelData = readFormData(true);
      const serials = window.SerialGenerator.generateSerials(labelData.startSerial, labelData.labelCount);

      generateButton.disabled = true;
      generateButton.textContent = "產生中...";
      setMessage(`正在產生 ${serials.length} 張標籤`, "working");

      await window.ExcelLabelBuilder.downloadWorkbook(labelData, serials);
      setMessage(`已產生 ${serials.length} 張標籤 Excel`, "success");
    } catch (error) {
      setMessage(error.message || "產生失敗，請檢查輸入資料", "error");
    } finally {
      generateButton.disabled = false;
      generateButton.textContent = "產生標籤 Excel";
      updatePreview();
    }
  }

  previewFieldIds.forEach((id) => {
    const field = document.getElementById(id);
    field.addEventListener("input", updatePreview);
    field.addEventListener("change", updatePreview);
  });

  form.addEventListener("submit", handleSubmit);
  resetButton.addEventListener("click", clearMessages);

  clearMessages();
  updatePreview();
})();
