# Formula Fortnite — Deploy Folder

Everything here runs on ONE JSON database (JSONBin). Site + admin share it.

## Files
- **index.html** — main site
- **styles.css** — styling
- **app.js** — main site logic (reads the database)
- **manage.html** — admin page (add/edit drivers & teams)
- **manifest.json** / **sw.js** — PWA (installable, offline)

---

## SETUP (do once, ~5 min)

### 1. Make your database
1. Sign up free at **jsonbin.io**
2. **API Keys** → copy your **Master Key** (`$2a$...`)
3. **Bins → Create a Bin**, paste this, click Create:
   ```json
   { "drivers": [], "teams": [], "races": [] }
   ```
4. Copy the **Bin ID** (from the URL / bin info)

### 2. Make a read-only key (for the public site)
- **API Keys → Access Keys → Create** → give it **read** permission
- Copy that **Access Key**

### 3. Plug the keys in
- **manage.html** → top of the script:
  ```javascript
  const BIN_ID = "your_bin_id";
  const MASTER_KEY = "your_master_key";   // full access — admin only
  ```
- **app.js** → top of the file:
  ```javascript
  const BIN_ID = "your_bin_id";
  const ACCESS_KEY = "your_access_key";   // read-only — safe for public site
  ```

---

## DEPLOY (GitHub Pages)

1. Upload all these files to your repo (drag & drop works on mobile)
2. Repo **Settings → Pages → Deploy from branch → main**
3. Live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

---

## USE IT

- **Add drivers/teams:** open `.../manage.html`
- **Update points after a race:** manage.html → Edit on a driver → change points → Save
- Main site updates automatically (it reads the same database)

---

## Notes
- Until you add your keys, the site shows **sample data** so you can preview it.
- Keep the **Master Key** private (it's in manage.html — don't share that URL widely).
- Free JSONBin = 10,000 requests/month. Plenty for a league.
- No Firebase, no 30-day expiry, no login walls.
