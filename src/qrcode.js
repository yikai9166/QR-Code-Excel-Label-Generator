(function () {
  function buildPayload(labelData, serial) {
    return [
      `${labelData.workOrder}@@${labelData.receiptNo}`,
      labelData.quantity,
      labelData.dateCompact,
      serial
    ].join("@");
  }

  async function createQrDataUrl(payload) {
    const qr = new window.QRious({
      value: payload,
      size: 180,
      level: "M",
      padding: 8,
      foreground: "#000000",
      background: "#ffffff"
    });

    return qr.toDataURL("image/png");
  }

  window.QRCodeBuilder = {
    buildPayload,
    createQrDataUrl
  };
})();
