# Launch presentation

Generates `WETCF_Launch_Presentation.pptx` — the bilingual (English /
Amharic) deck for the launch of the public website, the members portal and
the fellowship library.

## Rebuilding it

```bash
cd presentation
npm install pptxgenjs react react-dom react-icons sharp   # first time only
node build.js
```

The file appears in this folder. Open it in PowerPoint or Keynote.

## What is in here

| File | Purpose |
|---|---|
| `build.js` | The whole deck — 14 slides, content and layout |
| `assets/logo-transparent.png` | Logo cropped out of its padded canvas, gold on transparent — for dark slides |
| `assets/logo-onlight.png` | Same shape recoloured dark brown — for light slides |
| `assets/qr-register.png` | QR code to `wetcf.com/register` |
| `assets/qr-site.png` | QR code to `wetcf.com` |

## Editing

Slides are numbered blocks in `build.js`, each in its own `{ ... }` scope
with a comment header. Change the text in a block, re-run `node build.js`.

Speaker notes are the `s.addNotes(...)` call at the end of each block.

The palette lives in the `C` object at the top. `C.onDark` exists because
`C.muted` only reaches about 3.6:1 contrast against the dark brown, which
disappears on a projector.

### Regenerating a QR code

```python
import qrcode
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,
                   box_size=16, border=2)
qr.add_data("https://wetcf.com/register")
qr.make(fit=True)
qr.make_image(fill_color="#1C0F07", back_color="white").save("assets/qr-register.png")
```

High error correction (`ERROR_CORRECT_H`) matters — it keeps the code
scannable from across a room and at an angle.

## A note on Amharic

Amharic renders correctly in PowerPoint on macOS and Windows, which ship
Ethiopic fonts. It may show as empty boxes in LibreOffice or in a PDF
preview on a machine without those fonts — that is a font issue on the
previewing machine, not a problem with the file.
