(function () {
  function toInteger(value, fieldName) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new Error(`${fieldName}必須為整數`);
    }
    return parsed;
  }

  function padSerial(serialNumber) {
    return String(serialNumber).padStart(4, "0");
  }

  function padDatePart(value) {
    return String(value).padStart(2, "0");
  }

  function formatTimestamp(date) {
    return [
      date.getFullYear(),
      padDatePart(date.getMonth() + 1),
      padDatePart(date.getDate()),
      padDatePart(date.getHours()),
      padDatePart(date.getMinutes()),
      padDatePart(date.getSeconds())
    ].join("");
  }

  function generateSerials(startSerial, count, generatedAt = new Date()) {
    const start = toInteger(startSerial, "起始序號");
    const total = toInteger(count, "產生張數");

    if (start < 0) {
      throw new Error("起始序號不可小於 0");
    }

    if (total < 1) {
      throw new Error("產生張數必須大於 0");
    }

    const timestamp = formatTimestamp(generatedAt);
    return Array.from({ length: total }, (_, index) => `${timestamp}${padSerial(start + index)}`);
  }

  window.SerialGenerator = {
    formatTimestamp,
    generateSerials,
    padSerial
  };
})();
