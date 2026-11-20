# Workflow: Release Quality Audit (`/release-check`)

Comprehensive validation gate to ensure type safety, build integrity, asset link consistency, zero secret exposure, and strict editorial design compliance prior to any public release or production deployment.

---

## Execution Steps

### 1. Codebase & Build Validation
Run the complete static analysis and build suite in sequence:
```bash
npx tsc --noEmit
npm run lint
npm run build
```
Ensure all commands exit with code `0`. Any TypeScript compiler warning or ESLint violation must be resolved immediately.

---

### 2. PDF Asset & Case-Sensitivity Integrity Check
1. Read `data/briefs.json`.
2. For every entry:
   - Extract `pdf_url` (e.g., `/briefs/EHRM-EB-2026-001.pdf`).
   - Resolve to the physical path on disk: `public/briefs/EHRM-EB-2026-001.pdf`.
   - Verify that the file physically exists.
   - Perform an exact case-sensitive string comparison between the disk filename and the JSON property to eliminate Linux/Vercel 404 deployment regressions.

---

### 3. OPSEC & Secrets Scrub
Verify that no sensitive data or unauthorized files exist in the repository:
1. Scan for any `.env`, `.env.local`, `.env.production`, or credential files:
   - Must return zero files found.
2. Confirm `.gitignore` properly tracks `.env*`, `node_modules/`, `.next/`, `__pycache__/`, and `.venv/`.
3. Check `git status` to ensure untracked temporary files or local tokens are not present.

---

### 4. Visual Compliance Audit (Integrated Browser)
Open the integrated browser and inspect the application across two required viewports:
- **Desktop:** `1440px` width.
- **Mobile:** `390px` width.

Audit the rendered DOM and computed styles against `.agent/rules/editorial-design.md`:
1. **Palette Verification:** Confirm background is `#FAF9F6`, card surfaces are `#FFFFFF`, and accent borders match `#D4D4D0` and `#1C2836`.
2. **Sharp Corners Check:** Verify `border-radius: 0px` across all buttons, filter badges, drawer containers, and inputs.
3. **No Gradients or Box Shadows:** Confirm no element renders soft shadows or color gradients.
4. **No Emojis:** Verify complete absence of graphical emoji icons in UI elements or headers.
5. **Drawer & Keyboard Navigation:** Trigger a card selection to open the Detail Drawer; test pressing `Escape` to ensure immediate dismissal.
