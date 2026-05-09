# Amazon FBA 商品标签工具在线版

这是一个纯静态网页工具，可以部署到 GitHub Pages、Netlify、Cloudflare Pages、Vercel 或任意静态网站服务器。

## 功能

- 生成 `60 x 40 mm` 美国 Amazon FBA 商品标签
- FNSKU `Code 128` 条码
- 商品标题和套装内容自动适配字号
- 支持单个和批量输入
- 支持浏览器打印
- 支持导出 DLabel `.ddl` 文件

## 部署方式

### Netlify

1. 登录 Netlify。
2. 选择 `Add new site`。
3. 上传本文件夹，或连接 Git 仓库。
4. Publish directory 使用当前目录 `.`。

### Vercel

1. 登录 Vercel。
2. 导入本文件夹所在 Git 仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 留空或填写 `.`。

### Cloudflare Pages

1. 登录 Cloudflare Pages。
2. 连接 Git 仓库或直接上传文件夹。
3. Framework preset 选择 `None`。
4. Build command 留空。
5. Build output directory 填写 `.`。

### GitHub Pages

1. 新建一个公开或私有 GitHub 仓库。
2. 上传本文件夹内的所有文件。
3. 在仓库 `Settings > Pages` 里选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。

## 本地预览

```bash
python3 -m http.server 8765
```

然后打开：

```text
http://127.0.0.1:8765
```

## 注意

这个工具全部在浏览器本地运行，不会上传 FNSKU、标题或套装内容到服务器。
