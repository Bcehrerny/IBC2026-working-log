# Deploying to Vercel from a private repository

## 1 · Private repo on GitHub
On github.com: **New repository** → name it (e.g. `booth-log`) → **Private** → Create.
Don't add a README, you already have one.

Then, in the folder containing these files:

    git init
    git add .
    git commit -m "Booth log for IBC2026"
    git branch -M main
    git remote add origin https://github.com/<your-user>/booth-log.git
    git push -u origin main

(Or use GitHub Desktop, or the web uploader — but the web uploader hides
dotfiles, so `.nojekyll` won't upload that way. It's only needed for GitHub
Pages, so on Vercel you can ignore it.)

## 2 · Import into Vercel
vercel.com → **Add New… → Project → Import Git Repository**.
First time only, click **Adjust GitHub App Permissions** and grant access to the
private repo — Vercel can't see private repos until you do.

Then:

- Framework Preset: **Other**
- Build Command: **leave empty**
- Output Directory: **leave empty**
- Install Command: **leave empty**

Deploy. About thirty seconds. You get `https://<project>.vercel.app`.

`vercel.json` is already in the folder — it stops the browser caching `sw.js` and
`index.html`, so when you push a fix the phones actually pick it up.

## 3 · Updating later
`git add . && git commit -m "fix" && git push` — Vercel redeploys on its own.
If the phones keep showing the old version, bump `CACHE` in `sw.js` (`boothlog-v2`
→ `v3`) in the same push; that's what forces the installed app to refresh.

## 4 · Custom domain (optional)
Project → Settings → Domains → add `booth.promptergo.com`, then create the CNAME
record Vercel shows you at your DNS provider.

## Two things to know

**The repo is private; the deployed page is not.** Anyone with the `.vercel.app`
URL can open it. That's fine — the page is an empty shell. Your visitor data lives
in the Google Sheet, and the Sheet URL and token are typed into each phone's Setup
screen, never stored in this repository. If you want the page itself behind a
login: Project → Settings → **Deployment Protection**. Password protection there is
a paid feature.

**Vercel's free Hobby plan is for non-commercial use.** A trade-show tool for your
employer is commercial, so strictly you want the Pro plan (about $20/month — one
month covers the show). Cloudflare Pages is free, permits commercial use, deploys
private repos, and can put a real email login in front of the page with the free
Zero Trust plan. Same three settings: no build command, no output directory.
