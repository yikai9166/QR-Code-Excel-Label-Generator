# QR-Code-Excel-Label-Generator

網頁版 QR Code Excel 標籤產生器。使用者輸入製令單號、單據號、數量、日期、料號、下一製程、產生張數與起始序號後，可在瀏覽器端產生含多張 QR Code 標籤的 `.xlsx` 檔案。

## 開發

```powershell
npm install
npm run dev
```

## 建置

```powershell
npm run build
```

建置後會產生 `dist/`，正式部署時只需要提供 `dist/` 內的靜態檔案。

## 使用 Node.js 部署 Server

此專案提供一個簡單的 Node.js 靜態檔案伺服器，可用來部署建置後的 `dist/`。

1. 安裝依賴：

```powershell
npm install
```

2. 建置前端：

```powershell
npm run build
```

3. 啟動 Node.js server：

```powershell
npm run serve
```

4. 開啟瀏覽器：

```text
http://localhost:3000
```

可用 `PORT` 指定不同連接埠：

```powershell
$env:PORT=8080
npm run serve
```

注意：`server.mjs` 只會服務 `dist/`，因此啟動前必須先執行 `npm run build`。

## GitHub Pages

此專案也使用 GitHub Actions 部署 `dist` 到 GitHub Pages。推送到 `main` 後會自動執行 `.github/workflows/deploy.yml`。

部署網址：

```text
https://yikai9166.github.io/QR-Code-Excel-Label-Generator/
```

## QR Code 格式

```text
工單號碼@@入庫異動單號@數量@日期@序號
```

日期使用 `YYYYMMDD`。序號格式為產生當下時間 `yyyyMMddHHmmss` 加上 4 碼流水碼，例如 `202606241435120001`。
