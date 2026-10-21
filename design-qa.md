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

## Mobile completion and journey repair — 20 October 2026

The native journey order and 31%-of-lower-pane-height lesson-row height were checked against `new_journey.dart` and `journey_page_state.dart` in the APK AOT disassembly, using REA's `inspect-dart-aot`. The 129 original lesson artwork mappings were recovered from the object pool. A real source journey screenshot has now been captured through REA; the earlier width interpretation was corrected after identifying BoxConstraints.maxHeight. Full application parity remains unverified.

The default Chessity route now opens the bottom-to-top lesson journey directly. Touch checks at 360×640, 390×700 and 450×855 complete all five original king exercises, remove the captured flag, automatically advance, resume an interrupted completion, open the next lesson and retain earned stars after reload. The full board stays above the footer. A separate real-service-worker upgrade check reproduces the previous stale-code cache, then verifies new code, retained lesson data/session/stars and an offline cold reload. Navigation is dispatched without awaiting it inside service-worker activation, avoiding an activation/navigation deadlock.


## Native journey, result and sound correction — 20 October 2026

REA was used to inspect the APK AOT and capture the running Android application. [Android journey capture](design-review/chessity/native-journey.png) shows the actual native hierarchy, rectangular connected lesson cards, numbered badges and absence of unearned star rows. [Browser journey](design-review/chessity/browser-journey.png) shows the revised implementation at 390×809. These captures have different viewport sizes and are evidence of structure, not a pixel-difference certification. Original thumbnails are shown in the browser as requested; PNG decoding failed in the Android emulator after the native map loaded.

The completed lesson remains behind a centred dialog instead of being replaced by a separate result page. Layout follows LessonCompleteDialog.build at 0x85fb1c: 80% width, 30×50 content padding, original rounded-star glyph, raised centre star, original star.json Lottie animation and 780 ms stagger. Replay restarts the lesson; Continue returns to the lesson journey. [One star](design-review/chessity/result-1-star.png), [two stars](design-review/chessity/result-2-stars.png) and [three stars](design-review/chessity/result-3-stars.png) are browser captures from actual completion of the final original king task. The dialog is source-derived; a native completed-lesson capture has not been obtained.

All 62 original MP3 files and star.json were independently checked byte-for-byte against the supplied APK. Original move, coin, captureFlag, capture, mistake, solved, retry and one/two/threeStars samples replace generic effects. The shared audio context and decoded samples survive route changes; focus/touch resumes an interrupted context, and ended voices release their nodes. The additional Chessity profile and its journey navigation were removed; progress remains available in the existing site profile. Original fonts, star animation and the audio player bundle are included in the offline core.

Targeted Playwright checks cover three mobile journey sizes, all five original king tasks, flag consumption, automatic progression, saved stars after reload, 1/2/3-star dialog geometry and animation timing, non-silent decoded original samples, and audio resuming after profile navigation and forced context suspension. The service-worker migration check covers retained lesson data/session/stars and a cold offline reload. Automated audio checks confirm PCM playback scheduling on a running context; they do not replace listening on a physical phone.

Remaining limitations: lesson introductions still use the shared website explanation player, MiniChess uses the browser opponent implementation, and native result/explanation captures remain blocked by emulator renderer/ARM translation incompatibilities. Source screenshots for every original flow and a physical-device audio endurance check are still needed. Lesson 1704 remains unavailable from the source service. The changes correct specific mismatches and do not certify a complete 1:1 port.

Validation: `npm run build`, offline manifest generation and the complete `npm run check` finished successfully, including all unit, lesson, page, Chessity, service-worker upgrade and responsive layout checks.

final result: blocked


## Persistent site navigation — user clarification

[Mobile lesson with all five site tabs](design-review/chessity/persistent-navigation.png).

The site's five navigation buttons stay visible while Chessity is selected, including the journey, lesson, level and explanation views. The previous mobile-only hide rule was removed. A ResizeObserver measures the real navigation height, including safe-area padding; the Chessity viewport, lesson footers and explanation overlay fit above it. The completion dialog is centred in that available content area. Desktop keeps the existing side navigation.

Mobile regression checks now click Profile and the bottom-left Chessity button, confirm all five buttons remain visible, and ensure the journey, full board, lesson controls and explanation do not overlap the site navigation. Source-app fidelity applies inside the available Chessity area; persistent site navigation is the user's explicit requirement.


## Optional fifth Chessity tab and hidden-view repair — 21 October 2026

Reproduced the reported broken navigation: after opening Chessity's journey, clicking Lessons changed the selected tab and hidden attribute, but `#view-chessity.ct-journey { display:flex }` overrode `.ap-view[hidden]`. The inactive Chessity screen remained in layout above Lessons, including on desktop. [Before at 1440×900](design-review/navigation/desktop-before.png) and [after returning to Lessons](design-review/navigation/desktop-after.png) show the same transition. The shared hidden-view rule now has priority, so only the selected view occupies space.

The core tab order is Lessons, Game, Practice, Profile. Chessity is hidden by default, including for previously used accounts with no explicit enabling preference. Profile's “Показувати Chessity” switch adds it as the fifth tab, and remembers the choice across reloads. Disabling hides its profile links and direct Chessity routes return to Lessons without deleting progress. Navigation layout is owned by app.css rather than the Chessity stylesheet. Offline-download status handling lives in the app shell, so it also works when enabled from Profile before opening Chessity.

The new navigation regression test covers 360×640, 390×809, 1366×768 and 1920×1080: default-hidden and persisted opt-in/out states; all four real navigation buttons after journey, level and exercise screens; exactly one visible view at the viewport top; all lesson-map sections inside the viewport; and opening a real lesson. Existing Chessity tests explicitly enable the optional tab, retaining their task, stars, audio and offline upgrade coverage.

The historical desktop attachment requested by the user was not present in the accessible uploads. The desktop bug above was reproduced from the current app and corrected; these captures are implementation evidence, not a comparison against that missing attachment. No unrelated redesign was inferred from the missing image.


## Desktop lesson board and button proportions — clarified by user

The desktop complaint concerns the board and bottom controls inside lessons. Removed the fixed 640px board cap from the shared lesson layout. The board now uses available viewport height/width while reserving the explanation column and compact controls. At 1920×1080 it measures 984×984; at 1440×900, 804×804. The bottom toolbar is 48px high; buttons are at most 116×36, with icon and text on one line, aligned beneath the board. [Desktop lesson at 1920×1080](design-review/navigation/desktop-lesson-size.png).

The shared desktop rule covers maze, mini-lesson, Lichess Learn and lesson puzzle engines. Targeted checks passed at 1024×768, 1366×768, 1440×900, 1844×809 and 1920×1080. They assert that the board fits above controls, uses the available height, the right-hand panel stays separate, and the bottom buttons stay compact. The 343×651 mobile board and 62px mobile toolbar retain their prior geometry. This change follows the user's explicit size clarification and does not depend on reconstructing the unavailable historical image.
