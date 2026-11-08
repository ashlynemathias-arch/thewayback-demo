# Land Knowledge Map (Prototype)

A working demonstration of a Google Maps-style land knowledge platform, built for City Media Collective by Ivey MSc AFP Team 28. Everything shown is synthetic. Locations, trails, boundaries, stories, sources and reviewers are all invented for the demo.

## How to open it

1. Unzip the folder.
2. Double-click `index.html`. It opens in your browser.

No install and no account are needed. The map background (basemap) loads from the internet. If it cannot load, the app switches to a plain background and everything else still works.

## What the demo shows

- An interactive map with places, trails and areas for a fictional pilot area.
- Click any item to open its record (story, image, audio or video placeholder).
- A "View as" switcher for the five access levels: Public, Community member, Elder / Knowledge keeper, Administrator, Restricted. Switching changes which items, and which parts of each record, are visible.
- A verification label on every record (Verified, Community-reported, Unverified, Contested), plus source, reviewer and review date.
- Layer toggles for places, trails and areas.
- A calm, earthy colour palette (deep green, gold, warm cream) meant to feel neutral rather than corporate.
- A banner and tags that state clearly that the content is synthetic.
- Boundary area descriptions and one point record (Teaching Circle Site) that nod to City Media's four Social Impact Lab project types (Language and Culture, Health and Wellness, Food Sovereignty, Engagement), so the demo reads as a first step toward that model rather than a generic map.
- A trapline area record (B05) showing a consolidated licence-holder history, built around the real trapline reinstatement scenario raised in a team meeting, to illustrate what it looks like once scattered historical records are pulled into one place.
- An administrator-only external boundary (B06), modelled on an oil and gas dispute, that overlaps the Overlap Zone. Where the two boundaries overlap on the map, the colour reads visibly darker, flagging that a conversation is needed.
- Deeper verification detail on some records: a corroboration count and which body verified it (the City Media team versus a Nation's own council, as an example), not just a single badge.
- A "Version history" section (visible at Administrator level and above) on a few records showing how their status changed over time.
- A small interactive example on the admin review queue record (New Submission) simulating a confirm-before-upload step, to show how an accidental upload could be caught and corrected.
- A `media/` folder (see `media/README.md`) that lets you drop in real photos without touching any code.
- A richer basemap ("liberty" instead of the plainer "positron"), with real road names, place labels and building footprints, plus a Map/Satellite toggle. The satellite option is real imagery (Esri World Imagery), free, no key, no Google.
- A "Real-world reference" section on most records (skipped on purpose for the two Protected Site records), with a real satellite thumbnail of that exact coordinate and a link that opens the real location on a live map. The coordinates are real; what's described in the record above them is still fictional.
- Boundary precision: every area's outline is drawn and labelled by how confidently it can be pinned to an exact line, not just whether it's verified. A surveyed or formally registered boundary gets a solid line, a community-recalled one gets a dashed line, and a disputed estimate gets a soft, blurred edge instead of a crisp border, so the map doesn't visually claim more precision than the record behind it actually has. The Overlap Zone (disputed estimate) sitting against the Proposed Industrial Boundary (a precisely surveyed company line) is built to show that contrast directly: one side arrives with a hard line, the other's boundary was never meant to be one. A "Boundary precision" legend explains the three line styles, and each area record explains its own in plain language.
- A "Contribute" function (visible to Community member level and above, not to anonymous public visitors) that lets someone add their own photo, story, audio or video. It requires a title and description, a confirm-before-submitting photo preview (the same safeguard as the admin upload-confirmation example), and two checkboxes confirming the submitter has permission to share and has thought about cultural sensitivity for the level they're suggesting. Whatever level they suggest, the submission is visible only to administrators until it's actually reviewed, the same review-queue pattern as the New Submission example, so nothing reaches a wider audience automatically or by mistake.
- "+ Add a photo or memo to this place" on individual records (Community member and above, skipped on Protected Site records). Same form and the same safeguards as the standalone Contribute function, but it attaches to a place that already exists instead of creating a new pin. Submissions sit in a "Pending contributions" section, visible to administrators only, until reviewed.
- A 3D terrain / tilt view ("Tilt to 3D terrain" under Basemap). Toggling it tilts and angles the camera and raises real elevation under the map using free, keyless elevation data, so hills and valleys actually rise and fall. A soft hillshade stays on even when flat, so the terrain reads a little even without tilting. Not a street-view: there's no ground-level photo coverage of this fictional area to pull from, and no Google is used anywhere in this prototype.
- A "Walk the trail" photo-journey on the River Trail record: click through a short series of stops with a caption at each one. It reuses the same real, generically-licensed regional photos already in `media/`, captioned honestly as representative of the terrain, not actual photographs of that trail.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page layout |
| `style.css` | Colours and layout |
| `app.js` | The map, role switcher and record cards |
| `data.js` | **All the content.** Records, locations, access levels, verification labels |
| `live-view.html` | Opens in a new tab from "Open this spot on a live satellite map," a real-time satellite view of one record's coordinates |
| `vendor/` | MapLibre GL JS (the map engine) and its licence |
| `media/` | Optional real photos you can drop in yourself. See `media/README.md`. |

## How to edit the content

Open `data.js` in any text editor.

- Each record lives under `RECORDS`. Copy an entry, give it a new id (P for point, T for trail, B for boundary), and edit the text.
- `minTier` on a record sets who can see it on the map at all.
- `minTier` on each section sets who sees that piece of detail.
- Each record needs a matching location under `FEATURES` with the same id. Coordinates are `[longitude, latitude]`.
- `verification` is one of `verified`, `community`, `unverified`, `contested`.
- On a boundary (B-prefixed) record, `precision` is one of `surveyed` (solid line), `recalled` (dashed line), or `estimate` (soft, blurred line). `precisionNote` is a short sentence explaining that specific record's precision, shown under the legend text in its card.

## Putting it online for free

The app is a static site, so any static host works. Two easy options:

- **Netlify Drop:** drag the folder onto the Netlify drop page and it gives you a link.
- **GitHub Pages:** put the folder in a GitHub repository and turn on Pages in the repository settings.

Check each host's current free-tier terms before relying on it.

## Licensing and costs

- **MapLibre GL JS** is BSD-3-Clause. Free, no account, no API key. Licence text is in `vendor/MAPLIBRE-LICENSE.txt`.
- **Basemap:** the demo requests OpenFreeMap tiles (the "liberty" style), which are built from OpenStreetMap data. OpenStreetMap data requires attribution (the map shows it). Confirm OpenFreeMap's current terms before any production use, or self-host tiles (for example with Protomaps).
- **Satellite toggle, real-world reference thumbnails, and the live satellite view (`live-view.html`):** all three pull from Esri's public World Imagery service, free and keyless for this kind of light use (the map shows the required attribution). Confirm Esri's current terms before any production use or heavier traffic.
- **Images, audio and video:** none are included by default. Images are generated in the browser as labelled placeholders unless you drop a real photo into `media/` (see `media/README.md` for the naming convention, what's safe to add, and why real Prophet River-specific cultural content shouldn't be sourced from the open internet). No third-party media is bundled.
- **This project's own code** (`index.html`, `style.css`, `app.js`, `data.js`) has no licence file yet. City Media Collective should choose one (MIT is a common permissive choice) when they take it over, in line with the SoW's IP terms.
- **Running cost of the demo:** none. A production version would have hosting, database and tile costs. Get current quotes at that point.

## Limits of the prototype (please read)

- **Access levels are a demonstration only.** The role switcher hides and shows content in the browser. Anyone with technical skill could still read the hidden data from the page. A real platform needs logins and a server that only sends each person what they are allowed to see.
- **All content is synthetic.** Do not add real community knowledge to this prototype. It has no security or governance controls.
- **Boundaries are fictional.** They are not tied to any real record, legal source or Nation's territory.
- The layout works on phones, but the bottom record card and menu have had less testing than the desktop view.
- The trapline record's licence-holder chain and the administrator boundary overlay are both invented examples. They illustrate a real kind of problem (scattered historical records, overlapping claims) with fictional specifics, not an actual trapline or an actual dispute.

## What would change to move to real data

1. Authentication and server-side permissions, mapped to the Nation's real governance roles.
2. A hosted database in place of `data.js`, with an intake process for community submissions.
3. A verification workflow: who reviews, what evidence is required, how status changes are recorded.
4. Real boundary and Crown land data, used only with the appropriate permissions.
5. Community approval for every item, with the Nation holding ownership of its own data.
6. Hosting, basemap and data residency decisions made by City Media Collective and the Nations it works with.
7. Legal and governance review before any real data is loaded.

## Tools used

MapLibre GL JS 4.7.1, plain HTML, CSS and JavaScript. No build step.
