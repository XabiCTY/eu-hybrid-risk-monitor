# Rule: Editorial Design System ("Zero-AI Aesthetic")

All user interface development, styling, and copy across the European Hybrid & Geopolitical Risk Monitor (`eu-hybrid-risk-monitor`) must adhere strictly to these non-negotiable institutional design standards.

---

## 1. Palette & Color Token Enforcement
Only the following color values and tokens are permitted:
- **`--bg-paper: #FAF9F6`**: Root page canvas background.
- **`--bg-surface: #FFFFFF`**: Primary card and panel surface.
- **`--bg-stone: #F4F4F1`**: Secondary section containers, code callouts, alternating table rows.
- **`--border-rule: #D4D4D0`**: 1px architectural hairline dividers and borders.
- **`--ink-primary: #161616`**: Primary headline, high-contrast body typography, and prominent marks.
- **`--ink-muted: #525252`**: Captions, timestamps, secondary metadata, and inactive labels.
- **`--accent-oxford: #1C2836`**: Naval/diplomatic deep blue-gray for active tabs, primary badges, links, and focused borders.
- **`--accent-alert: #7A1C1C`**: Reserved exclusively for `HIGH` NIS2 exposure, active KEV exploitation flags, and severe kinetic alerts. Never use for decorative accents.

---

## 2. Universal Architectural Rules
1. **Zero Border Radius (`border-radius: 0px`):**
   - Every UI element—including buttons, cards, tags, inputs, dialogs, drawers, and badges—must have sharp corners (`rounded-none` / `border-radius: 0px !important`).
2. **Hairline Rules:**
   - Section separation and container definition must use crisp `1px solid #D4D4D0` lines.
3. **Zero Drop Shadows:**
   - Never apply `box-shadow` or blur filters. Depth is conveyed strictly via background contrast (`#FFFFFF` on `#FAF9F6`) and hairline borders.
4. **Zero Gradients:**
   - Linear or radial gradients are strictly prohibited on surfaces, borders, or text.
5. **Zero Neon / Dark Mode:**
   - Do not implement dark neon themes, synthetic cyan/green glows, or black-light cyber aesthetics. The platform uses an editorial daytime paper aesthetic.
6. **Zero Emojis:**
   - Never use consumer emojis (e.g., 🚨, ⚠️, 🛡️, 🌐) in headers, badges, or feed signals. Use textual monospaced markers (e.g., `[ALERT]`, `[TLP:CLEAR]`, `[KEV]`).
7. **Zero Synthetic / Placeholder Data:**
   - Never write `Lorem Ipsum` or fictitious mock signals in committed files. All displayed data must originate from the validated JSON contracts.

---

## 3. Typographic System
- **Editorial Masthead & Section Headlines:** Classic Serif (`Newsreader`, `Source Serif Pro`, or system `Georgia`).
- **UI Elements, Form Controls & Body Text:** Neutral, crisp Sans-serif (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`).
- **Technical Metadata & Telemetry:** Monospace (`JetBrains Mono`, `Consolas`, `ui-monospace`) for `CVE`, `EPSS`, `Doc ID`, `TLP`, timestamps, counts, and tags.
