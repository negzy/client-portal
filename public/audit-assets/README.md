# Audit PDF images (optional)

Place image files here to make the Credit Report Analysis PDF more visually appealing. The PDF generator will use them automatically when present.

## Files

| File | Where it appears | Suggested size |
|------|------------------|----------------|
| **logo.png** | Page 1 (cover) and Page 5 (Let's Get Started) | ~280×88 px or similar (will be scaled to 140×44 pt in PDF) |
| **icon-envelope.png** | Page 5 (Let's Get Started), above the "Let's Get Started!" heading | ~96×96 px (displayed at 48×48 pt) |

If a file is missing, the PDF falls back to text (“THE CREDIT HUB” and a ✉ character).

## Where to get images

- **Logo:** Export your The Credit Hub logo from your site (www.thecredithub.io) or design tool as a PNG with a transparent or white background. Use a high-resolution version so it stays sharp in the PDF.
- **Envelope icon:** Use any simple envelope/mail icon:
  - [Heroicons](https://heroicons.com/) (Outline “envelope”)
  - [Flaticon](https://www.flaticon.com/) or [Icons8](https://icons8.com/) (search “envelope”, free for commercial use)
  - Export as PNG, ideally with transparent background.

Save them in this folder as `logo.png` and `icon-envelope.png`. No code changes needed—the audit PDF will pick them up on the next generation.
