import "./serial.js";
import "./qrcode.js";
import "./excel.js";

(function () {
  const form = document.getElementById("labelForm");
  const message = document.getElementById("message");
  const statusText = document.getElementById("statusText");
  const generateButton = document.getElementById("generateButton");
  const resetButton = document.getElementById("resetButton");
  let vendorLoadPromise;

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

  function setMessage(text, type) {
    message.textContent = text;
    message.dataset.type = type || "";
    statusText.textContent = text || "待輸入資料";
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

  async function ensureVendorLibraries() {
    if (window.ExcelJS && window.QRious) {
      return;
    }

    if (!vendorLoadPromise) {
      const baseUrl = getBaseUrl();
      vendorLoadPromise = Promise.all([
        loadScript(`${baseUrl}vendor/exceljs.min.js`),
        loadScript(`${baseUrl}vendor/qrious.min.js`)
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

  function formatDateParts(dateValue) {
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

  function collectLabelData() {
    const formData = new FormData(form);
    const dateParts = formatDateParts(requireText(trimValue(formData, "labelDate"), "日期"));

    return {
      workOrder: requireText(trimValue(formData, "workOrder"), "工單號碼"),
      receiptNo: requireText(trimValue(formData, "receiptNo"), "入庫異動單號"),
      quantity: requireText(trimValue(formData, "quantity"), "數量"),
      dateCompact: dateParts.compact,
      dateDisplay: dateParts.display,
      partNo: requireText(trimValue(formData, "partNo"), "料號"),
      nextProcess: requireText(trimValue(formData, "nextProcess"), "下一製程"),
      labelCount: trimValue(formData, "labelCount"),
      startSerial: trimValue(formData, "startSerial")
    };
  }

  function updatePreview() {
    try {
      const labelData = collectLabelData();
      const serials = window.SerialGenerator.generateSerials(labelData.startSerial, labelData.labelCount);

      preview.workOrder.textContent = labelData.workOrder;
      preview.quantity.textContent = labelData.quantity;
      preview.partNo.textContent = labelData.partNo;
      preview.nextProcess.textContent = labelData.nextProcess;
      preview.date.textContent = labelData.dateDisplay;
      preview.firstSerial.textContent = serials[0];
      preview.lastSerial.textContent = serials[serials.length - 1];
      preview.count.textContent = String(serials.length);
    } catch (error) {
      preview.firstSerial.textContent = "-";
      preview.lastSerial.textContent = "-";
      preview.count.textContent = "-";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("", "");

    try {
      await ensureVendorLibraries();

      const labelData = collectLabelData();
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

  form.addEventListener("input", updatePreview);
  form.addEventListener("submit", handleSubmit);
  resetButton.addEventListener("click", () => setMessage("", ""));

  updatePreview();
})();
