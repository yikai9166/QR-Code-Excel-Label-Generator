# QR-Code-Excel-Label-Generator

網頁版 QR Code Excel 標籤產生器。使用者輸入工單資料後，可在瀏覽器端產生含多張 QR Code 標籤的 `.xlsx` 檔案。

## 開發

```powershell
npm install
npm run dev
```

## 建置

```powershell
npm run build
```

## GitHub Pages

此專案使用 GitHub Actions 部署 `dist` 到 GitHub Pages。推送到 `main` 後會自動執行 `.github/workflows/deploy.yml`。

部署網址：

```text
https://yikai9166.github.io/QR-Code-Excel-Label-Generator/
```

## QR Code 格式

```text
工單號碼@@入庫異動單號@數量@日期@序號
```

日期使用 `YYYYMMDD`。序號格式為產生當下時間 `yyyyMMddHHmmss` 加上 4 碼流水碼，例如 `202606241435120001`。
