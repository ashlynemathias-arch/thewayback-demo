# Dropping in real photos

Every photo on a record currently shows a generated placeholder (clearly labelled "SYNTHETIC IMAGE"). You can
replace any of them with a real photo without touching any code.

## How it works

Put a file named `<record id>.jpg` in this folder, for example `P01.jpg` for the "Sample Gathering Ground"
record, or `B05.jpg` for the trapline area. The record IDs are the same ones used in `data.js` (P01, P02, T01,
B01, and so on). When that file exists, the record card loads it. When it doesn't, the page quietly falls back
to the synthetic placeholder, so nothing breaks if a folder is only partly filled in.

This only works for the downloaded folder version of the prototype. The hosted link version is a single file
with no separate media folder, so it will keep showing placeholders no matter what, that's expected.

## Where real photos could come from

This sandbox can't fetch files from the open internet itself, so sourcing anything has to happen on your end.
A few options, roughly in order of how safe they are to use:

- **General landscape photography of the actual region** (boreal forest, the Peace River valley, northern BC
  terrain), captioned honestly as representative scenery rather than a specific site. Wikimedia Commons is a
  good source for CC0 or CC-BY images, just keep the attribution if the licence asks for it.
- **The real basemap itself.** The map already pulls real OpenStreetMap-based tiles (via OpenFreeMap, no
  Google, no API key), so "an actual map" is already working in your own browser. If you want a satellite look
  instead of street-style tiles, Esri's World Imagery is a free, keyless alternative worth asking about.
- **Public administrative or historical record material**, like how BC's trapline registration system works,
  which is public process information, not restricted cultural knowledge. That's what the trapline record
  (B05) is built around.

## What not to add here

Don't drop in anything presented as Prophet River's own cultural material, specific sacred or ceremonial
sites, a real photo of a named community member, or drumming and songs attributed to the Nation, unless that
content was actually given by the Nation itself for this purpose. That's the same boundary the rest of this
prototype already holds to (synthetic data only, no real community knowledge), and it's the same reason OCAP
exists: real community content has to come from the community's own consent, not from whatever turns up in a
search. The real version of this content is meant to arrive once Prophet River opts into a project, not before.

Audio and video aren't wired up to a drop-in folder yet, since no legitimate "real" source for either fits this
prototype's synthetic-only rule the way a landscape photo does. The same `<id>.jpg` pattern could be extended
to `<id>.mp3` or `<id>.mp4` later if that ever becomes appropriate.
