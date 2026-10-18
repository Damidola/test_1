# Chessity fidelity review

Source: user attachments `1000025508.png` (level 2) and `1000025507.png` (king lesson after collecting the coin). Original 1080×2400 captures were cropped to (0,90)-(1080,2330), excluding Android status/navigation bars, and normalized to 390×809. Browser screenshots use 390×809 CSS pixels at device scale 1.

Comparison evidence: [level](chessity/review/compare-levels.png), [exercise](chessity/review/compare-exercise.png). Source and implementation appear together in each image. Original puzzle 36012 was selected, then played d3-e4-d5 through board gestures to match the source position and state.

## Findings

- P1 — Complete application parity is not established. The browser uses adapted lesson introductions and its own MiniChess opponent logic. Source captures for every original game, profile, explanation and animation are unavailable. These must be compared against the Android app before calling the entire port 1:1.
- P2 — Original lesson 1704 is referenced by the framework but its puzzle API returns HTTP 500, including an authorized user session. Its tasks were not invented. The other seven previously omitted lessons were recovered.
- P3 — Browser and Flutter font rasterization differ slightly. Original fonts, piece PNGs, icon font, badge PNGs and original coach SVG components are used.

## Comparison history

Initial capture found a different palette, generic artwork, missing icons, misplaced coach glasses and mismatched vertical spacing. These were corrected using the APK's assets and font, original icon glyph mappings, coach component order, normalized viewport geometry, original board/piece images and source text. Final evidence is linked above. Missing category images in the source are intentionally replaced with the requested original badge artwork.

Typography: original Montserrat Semibold/Bold; checked header, lesson text, coach and footer. Layout: matched category rows, level silhouette, panel, board, numbered task buttons and footer. Colors: native blue palette and cream/blue board. Assets: original PNGs, fonts and coach paths, without generated replacements. Copy: existing Ukrainian strings retained; newly recovered lesson titles localized. Focused inspection covered labels, icons, figure edges and coach face in the combined images.

Browser checks: 390×866, 450×855 and 1440×900; navigation, 18 levels, five distinct tasks, saved unfinished session, four green answers awarding three stars, profile persistence and no page JavaScript errors. Additional 390×809 captures match the supplied references. Offline check downloaded the lesson manifest, disabled all network access and cold-reloaded a lesson with tasks and graphics.

Implementation checklist: compare remaining original app flows; recover lesson 1704 if the source service becomes available. The two supplied views are substantially matched, but this review does not certify a complete app clone.

final result: blocked
