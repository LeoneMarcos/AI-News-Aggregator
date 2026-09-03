# Approved showcase capture script

- Browser: dedicated Playwright-managed Chromium, independent from the in-app browser and any user browser profile.
- Route: `http://127.0.0.1:3000/`
- Viewport: 1440×900 at device scale factor 1.
- Opening state: the source-selection modal is visible with no personal session or credentials.
- Take 1: select TechCrunch, MarkTechPost, MIT Tech Review, VentureBeat, and The Verge; show the selected state; start reading and preserve the beginning of loading.
- Take 2: preserve the loading state and progress bar while the selected feeds complete.
- Take 3: preserve the loaded feed with All Sources selected.
- Take 4: select the TechCrunch filter and preserve the filtered result.
- Waits: allow the modal animation, source selection, feed loading, result stabilization, and filter transition to complete before each state is recorded.
- Edit contract: dry cut from take 1 to take 2; one subtle transition from take 2 to take 3; dry cut from take 3 to take 4.
- Rejected effects: no captions, music, zooms, flashes, or additional transitions.
