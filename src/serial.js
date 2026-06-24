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

  function generateSerials(startSerial, count) {
    const start = toInteger(startSerial, "起始序號");
    const total = toInteger(count, "產生張數");

    if (start < 0) {
      throw new Error("起始序號不可小於 0");
    }

    if (total < 1) {
      throw new Error("產生張數必須大於 0");
    }

    return Array.from({ length: total }, (_, index) => padSerial(start + index));
  }

  window.SerialGenerator = {
    generateSerials,
    padSerial
  };
})();
