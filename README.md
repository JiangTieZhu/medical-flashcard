# 中医方剂学 · 执业医师考试闪卡

一个纯静态的方剂记忆闪卡：正面是**方名 + 出处 + 方歌**，背面是**组成（含每味药用量）、功用、主治、配伍要点、易错点**。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构，**双击这个文件即可使用** |
| `style.css` | 样式 |
| `app.js` | 交互逻辑（翻面、筛选、搜索、掌握记录） |
| `formulas.json` | 方剂数据（唯一数据源，JSON 格式，可自行编辑） |
| `formulas.js` | `formulas.json` 的 JS 包装副本，用于让浏览器在 `file://` 下也能读到数据 |
| `preview-front.png` | 界面预览 |

## 使用方法

1. 双击 `index.html`（推荐 Chrome / Edge）。
2. 点击卡片或按 **空格** 翻面；**←/→** 切换；**M** 标记已掌握。
3. 勾选顶部 **先藏方歌**：正面只显示方名与出处，方歌被遮住，点击方歌区域才显示（不会翻面），适合先默背再核对；该选择会被记住。
4. 顶部可按章节、重点级别筛选，或直接搜索方名、药物、主治关键词。
5. 「已掌握」记录保存在浏览器 localStorage，可随时清空。

## 数据说明

- 共 **172 首**方剂，覆盖大纲方剂学全部章节：解表、泻下、和解、清热、祛暑、温里、补益、固涩、安神、开窍、理气、理血、治风、治燥、祛湿、祛痰、消食、驱虫、涌吐、治痈疡。
- **方歌**：每首一句四言（七言四句，32 字），以《汤头歌诀》与规划教材通用歌诀为主，无通用歌诀者按组成功用编写，仅供记诵，界面按“；”自动分两行。
- **重点级别**：`重点` 94 首（大纲要求掌握，高频必考）、`次重点` 59 首（要求熟悉，常考）、`了解` 19 首（要求了解，低频）。
- 字段含义见 `formulas.json` 里的 `fieldNote`；用量为教材原方用量（散剂、丸剂多为原方比例，用法要点写在「要点」中）。

> 依据《中医执业医师资格考试大纲》方剂学部分及规划教材《方剂学》整理，供复习记忆使用；临床用药请遵医嘱。

## 部署到 GitHub Pages

全部是静态文件、路径均为相对路径，**无需改动代码**，直接上传即可。

```bash
git init
git add .
git commit -m "中医方剂学闪卡"
git branch -M main
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

然后在仓库 **Settings → Pages → Build and deployment** 选择 `Deploy from a branch`，分支 `main`、目录 `/ (root)`，保存后访问：

```
https://<用户名>.github.io/<仓库名>/
```

注意：
- 仓库名建议用英文（如 `tcm-fangji-flashcards`），URL 更干净；页面内部路径是相对的，放在子目录 `/仓库名/` 下也能正常工作。
- `formulas.js` 必须一起提交，否则页面读不到数据。
- 更新 `formulas.js`、`app.js` 或 `style.css` 后，请把 `index.html` 引用地址末尾的 `?v=...` 改成一个新值，避免浏览器和 GitHub Pages 继续使用缓存中的旧文件。
- 私有仓库发布 Pages 通常需要付费计划（Pro/Team 及以上），公开仓库免费。
- 已包含 `.nojekyll`，跳过 Jekyll 构建，部署更快且不会被误处理。

## 修改数据

直接编辑 `formulas.json`（保持字段结构不变），然后在 PowerShell 中执行下面一行，重新生成浏览器可读的副本：

```powershell
$j=[IO.File]::ReadAllText('formulas.json',[Text.Encoding]::UTF8); [IO.File]::WriteAllText('formulas.js',"window.FORMULA_DATA = "+$j.Trim()+";`n",(New-Object Text.UTF8Encoding($false)))
```
