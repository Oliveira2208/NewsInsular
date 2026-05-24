# Mobile Assets

The app icon and splash screen are SVG files that should be converted to PNG for production.

## Required Files

| File | Size | Format |
|------|------|--------|
| `icon.png` | 1024x1024 | PNG |
| `splash.png` | 1284x1284 | PNG |

## Conversion

Use a tool like:
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Sharp](https://sharp.pixelpoint.io/)
- Figma/Illustrator export

Or run:
```bash
# If you have ImageMagick
convert icon.svg -resize 1024x1024 icon.png
convert splash.svg -resize 1284x1284 splash.png
```

## Design Guidelines

- Background: #1A56DB (primary blue)
- Icon: White "N" letter, bold, centered
- Corner radius: 128px on icon
- Safe area: Keep "N" within central 80% to avoid clipping on rounded corners