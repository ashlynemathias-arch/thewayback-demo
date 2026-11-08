/*
  SYNTHETIC DATA ONLY.
  Every place, story, source, reviewer and boundary below is invented for the prototype.
  Coordinates sit in a general area between Fort Nelson and Fort St. John but do not
  describe any real site, trail, boundary or community record.

  To add a record: copy an entry in RECORDS, give it a new id, then add a matching
  geometry entry in FEATURES (same id). Nothing else needs to change.

  Access levels (lowest to highest): public, member, elder, admin.
  A record's "minTier" decides who sees it on the map at all.
  Each section's "minTier" decides who sees that piece of detail inside the record.

  "Restricted" is NOT one of these levels. It used to sit above admin as a fifth rank, but that
  was backwards: the two Protected Site records still said "Details withheld" even at that top
  level, because Restricted really describes content held for specific named individuals the
  community chooses, not a rank you climb past administrator to unlock. It's modelled per record
  now (see P07/P08's "namedAccess" field) instead of as a tier. TIER_INFO.restricted is kept only
  as a label for the sharing-level dropdown in the Contribute/Attach forms, where "restricted" is
  a sensitivity a submitter can flag, not a rank -- it must never be used as a minTier.
*/

window.WAYBACK = {

  TIERS: ["public", "member", "elder", "admin"],

  TIER_INFO: {
    public:     { label: "Public",                 blurb: "Anyone visiting the site. Sees only what has been approved for general sharing." },
    member:     { label: "Community member",       blurb: "Verified community members. Sees community-level knowledge and locations." },
    elder:      { label: "Elder / Knowledge keeper", blurb: "Elders and knowledge keepers. Sees teachings and place detail held by the community, and can confirm community-reported records." },
    admin:      { label: "Administrator",          blurb: "Platform administrators. Sees review notes and submissions waiting for approval." },
    restricted: { label: "Restricted",             blurb: "Not a rank in the ladder above. A sensitivity flag meaning a record should go only to specific named individuals, decided case by case by the community." }
  },

  VERIFICATION: {
    verified:    { label: "Verified",           icon: "✓", color: "#2e7d32", blurb: "Reviewed by a designated reviewer, with supporting evidence on file." },
    community:   { label: "Community-reported", icon: "◐", color: "#b07d00", blurb: "Shared by community members. Not yet formally reviewed." },
    unverified:  { label: "Unverified",         icon: "?",      color: "#6b6b6b", blurb: "Single source. No review or supporting evidence yet." },
    contested:   { label: "Contested",          icon: "!",      color: "#b3261e", blurb: "Conflicting accounts or evidence. Needs review before it is relied on." }
  },

  /* How confidently a boundary's outline can be pinned to an exact line, separate from
     whether the area's existence or use is verified. A lot of real boundary disputes come
     from treating an estimate as if it were a survey, so the map draws these differently
     instead of giving every outline the same solid-looking line. */
  PRECISION: {
    surveyed: { label: "Surveyed line",        dash: "solid",  blurb: "Fixed by a survey or formal registration. The line on the map is accurate to that record." },
    recalled: { label: "Community-recalled",   dash: "dashed", blurb: "Drawn from description, not a formal survey. Treat the line as a close approximation, not an exact edge." },
    estimate: { label: "Disputed estimate",    dash: "soft",   blurb: "No agreed line exists yet. The soft, blurred edge on the map is deliberate: it marks a zone of uncertainty, not a fixed boundary." }
  },

  CATEGORIES: {
    gathering: { label: "Gathering place",  color: "#b5651d" },
    camp:      { label: "Camp / cabin",     color: "#6b4f3a" },
    harvest:   { label: "Harvest area",     color: "#5f8a2f" },
    story:     { label: "Story place",      color: "#7a4e8c" },
    landmark:  { label: "Landmark",         color: "#2f6690" },
    protected: { label: "Protected site",   color: "#2b2a26" },
    evidence:  { label: "Evidence item",    color: "#a23e48" },
    trail:     { label: "Trail / route",    color: "#4b4b4b" },
    area:      { label: "Area / boundary",  color: "#2f5d50" }
  },

  MAP_VIEW: { center: [-122.72, 58.095], zoom: 9.6 },

  RECORDS: {

    P01: {
      title: "Sample Gathering Ground", category: "gathering", minTier: "public",
      verification: "verified",
      source: "Synthetic: team-written summary of an invented community account",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-08-14",
      verifiedBy: "City Media team (example)", corroboration: 3,
      note: "Two invented accounts and one synthetic archival photo agree on the location. As with every record here, ownership of the real information would sit fully with the community.",
      sections: [
        { minTier: "public", label: "Overview", text: "A flat clearing beside the river where families are said to have met each summer. Shown here as an example of a place that the community has approved for public sharing.", media: [{ type: "photo", caption: "Representative photo of the general region (forest along a river). Not the actual site." }] },
        { minTier: "member", label: "Seasonal use", text: "Used for late-summer gatherings, drying fish and sharing news before families moved to winter camps. This detail is limited to community members in the example." },
        { minTier: "elder", label: "Teaching", text: "An invented teaching about who was welcome to speak at the gathering and how decisions were shared. Placeholder text only.", media: [{ type: "audio", caption: "Synthetic audio placeholder: Elder recollection (no recording)" }] }
      ]
    },

    P02: {
      title: "Old Cabin Site", category: "camp", minTier: "member",
      verification: "community",
      source: "Synthetic: invented submission from a community member",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Awaiting a second account or a photo to support the location.",
      sections: [
        { minTier: "member", label: "Description", text: "Remains of a log cabin described as a stopover on the way to the ridge. The exact age is not known.", media: [{ type: "photo", caption: "Synthetic image: cabin remains" }] },
        { minTier: "admin", label: "Review notes", text: "Reviewer asked for a second account before this can move to Verified." }
      ]
    },

    P03: {
      title: "Berry Flats", category: "harvest", minTier: "public",
      verification: "unverified",
      source: "Synthetic: team-generated example",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Included to show how an unreviewed public item is labelled.",
      sections: [
        { minTier: "public", label: "Overview", text: "An open, sun-facing area described as a reliable place for picking berries once the days start to cool. Shown here as an example of everyday, low-sensitivity knowledge that a community might choose to share publicly.", media: [{ type: "photo", caption: "Representative photo of the general region (a forest clearing). Not the actual site." }] },
        { minTier: "member", label: "Harvest notes", text: "Best picking is said to be after the first cool nights. Placeholder detail." }
      ]
    },

    P04: {
      title: "Ridge Lookout", category: "landmark", minTier: "public",
      verification: "verified",
      source: "Synthetic: team-generated, based on an invented survey photo",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-08-20",
      note: "Photo and two accounts agree.",
      sections: [
        { minTier: "public", label: "Overview", text: "A high point with a wide view of the valley, used as a landmark when travelling.", media: [{ type: "photo", caption: "Representative photo of the general region (a river valley seen from above). Not the actual site." }] },
        { minTier: "elder", label: "Use of the lookout", text: "Invented account of how the ridge was used to watch for weather and animals. Placeholder text." }
      ]
    },

    P05: {
      title: "Where the River Turns", category: "story", minTier: "member",
      verification: "verified",
      source: "Synthetic: invented oral history, recorded as a script by the team",
      reviewer: "Reviewer B (fictional)", reviewed: "2026-08-27",
      note: "Story shared with permission of the (fictional) storyteller.",
      sections: [
        { minTier: "member", label: "Story summary", text: "A short story about a bend in the river where a family once waited out a flood. Told to children as a lesson about patience.", media: [{ type: "video", caption: "Synthetic video placeholder: storyteller (no footage)" }] },
        { minTier: "elder", label: "Full account", text: "Longer invented version with names and dates left out. Placeholder text only." }
      ]
    },

    P06: {
      title: "Winter Camp Location", category: "camp", minTier: "elder",
      verification: "community",
      source: "Synthetic: invented account from a knowledge keeper",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Location is held at elder level in the example.",
      sections: [
        { minTier: "elder", label: "Description", text: "A sheltered spot used as a winter camp by several families. Placeholder text.", media: [{ type: "photo", caption: "Synthetic image: sheltered timber" }] },
        { minTier: "admin", label: "Review notes", text: "Waiting for the knowledge keeper to confirm the exact position." }
      ]
    },

    P07: {
      title: "Protected Site A", category: "protected", minTier: "admin",
      verification: "verified",
      source: "Synthetic placeholder",
      reviewer: "Reviewer B (fictional)", reviewed: "2026-09-02",
      note: "Illustrates a named-individual-only record. Not tied to a rank in the access ladder, so administrator is as far up as this demo can show it from.",
      /* Example names only, standing in for whoever a community would actually name. In a real
         platform this list is what decides visibility, not a role in TIERS. */
      namedAccess: ["(example) a designated Elder", "(example) two named family members"],
      sections: [
        { minTier: "admin", label: "Restricted: named individuals only", text: "This record isn't gated by the role ladder above it. It's restricted to specific people the community names, decided case by case, the same way the Contribute form's \"Restricted\" option describes it. In a real platform, only those named people, not every administrator, would see the content below. This demo view shows what that would look like." },
        { minTier: "admin", label: "Example of what's withheld", text: "A placeholder description of a practice or place that would sit here. No real site or knowledge is described." }
      ]
    },

    P08: {
      title: "Protected Site B", category: "protected", minTier: "admin",
      verification: "community",
      source: "Synthetic placeholder",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Second named-individual-only example, with a different verification status.",
      namedAccess: ["(example) one named knowledge keeper"],
      sections: [
        { minTier: "admin", label: "Restricted: named individuals only", text: "Same idea as Protected Site A: restricted to people the community names, not to a rank in the ladder. Awaiting community review before anyone, named or otherwise, would see real content here." },
        { minTier: "admin", label: "Example of what's withheld", text: "Placeholder for a restricted record awaiting review. No real site is described." }
      ]
    },

    P09: {
      title: "Trapline Cabin", category: "camp", minTier: "member",
      verification: "unverified",
      source: "Synthetic: team-generated example",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Single source only.",
      sections: [
        { minTier: "member", label: "Description", text: "A small cabin said to belong to one family's trapline. Used to show how a single-source record looks.", media: [{ type: "photo", caption: "Synthetic image: cabin in the trees" }] }
      ]
    },

    P10: {
      title: "River Crossing", category: "landmark", minTier: "public",
      verification: "contested",
      source: "Synthetic: two invented accounts that disagree",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-09-05",
      note: "One account places the crossing upstream. Evidence is needed before this is relied on.",
      versions: [
        { date: "2026-08-28", change: "Submitted as Unverified with a single account placing the crossing near the wagon track.", by: "Community member (fictional)" },
        { date: "2026-09-05", change: "A second, conflicting account moved the status to Contested pending further evidence.", by: "Reviewer A (fictional)" }
      ],
      sections: [
        { minTier: "public", label: "Overview", text: "A shallow crossing used to reach the far side of the valley. Accounts disagree on the exact location, which is why it is marked as contested.", media: [{ type: "photo", caption: "Representative photo of the general region (a river crossing a rocky valley). Not the actual site." }] },
        { minTier: "member", label: "Competing accounts", text: "Account 1 places the crossing near the wagon track. Account 2 places it further upstream near the fish camp. Placeholder text." },
        { minTier: "admin", label: "Review notes", text: "Recommend requesting dated photos or a second knowledge keeper before changing the status." }
      ]
    },

    P11: {
      title: "Fish Camp", category: "harvest", minTier: "member",
      verification: "verified",
      source: "Synthetic: invented community account and archival photo",
      reviewer: "Reviewer B (fictional)", reviewed: "2026-08-30",
      verifiedBy: "City Media team (example)", corroboration: 2,
      note: "Photo and account agree.",
      sections: [
        { minTier: "member", label: "Description", text: "A riverside camp used for fishing and drying fish. Racks and a fire ring are described.", media: [{ type: "photo", caption: "Synthetic image: fish drying racks" }] },
        { minTier: "elder", label: "Family use", text: "Invented account of which families used the camp in which season. Placeholder text." }
      ]
    },

    P12: {
      title: "Plant Gathering Area", category: "harvest", minTier: "elder",
      verification: "community",
      source: "Synthetic: invented knowledge keeper account",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Held at elder level so plant locations are not exposed.",
      sections: [
        { minTier: "elder", label: "Description", text: "An area where plants used in traditional practice are gathered. No real plants or locations are described." }
      ]
    },

    P13: {
      title: "New Submission (awaiting review)", category: "evidence", minTier: "admin",
      verification: "unverified",
      source: "Synthetic: invented upload from a community member",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Shows what an administrator sees in the review queue.",
      sections: [
        { minTier: "admin", label: "Submission", text: "A photo and short note submitted through the intake form. Waiting for a reviewer to accept, ask for more detail, or decline.", media: [{ type: "photo", caption: "Synthetic image: submitted photo" }] },
        { minTier: "admin", label: "Reviewer actions", text: "Accept, request more information, or decline. (Buttons are not active in the prototype.)" },
        { minTier: "admin", label: "Try it: confirm before upload", text: "A quick example of catching an accidental upload (a personal photo instead of the intended one) before it goes anywhere.", demo: "upload" }
      ]
    },

    P14: {
      title: "Old Survey Marker (photo evidence)", category: "evidence", minTier: "member",
      verification: "contested",
      source: "Synthetic: invented archival photograph",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-09-08",
      note: "Photo date and position both questioned. Shown as an example of evidence in a boundary discussion.",
      versions: [
        { date: "2026-09-02", change: "Uploaded as supporting evidence for the Overlap Zone boundary question.", by: "Community member (fictional)" },
        { date: "2026-09-08", change: "Flagged Contested after a reviewer noted the photo carries no date.", by: "Reviewer A (fictional)" }
      ],
      sections: [
        { minTier: "member", label: "Description", text: "A weathered marker that one account links to the edge of the overlap area. Another account says it was moved.", media: [{ type: "photo", caption: "Synthetic image: weathered marker" }] },
        { minTier: "admin", label: "Review notes", text: "Photo has no date. Request the original file and any accompanying notes." }
      ]
    },

    P15: {
      title: "Teaching Circle Site", category: "story", minTier: "member",
      verification: "community",
      source: "Synthetic: invented community account",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Included as an example of a Language and Culture record, the kind of site a language revitalization project might document.",
      sections: [
        { minTier: "member", label: "Overview", text: "A gathering spot described as a place where language and oral teachings are passed between generations. Shown as an example of the kind of record a Language and Culture project might build inside the platform.", media: [{ type: "audio", caption: "Synthetic audio placeholder: teaching circle (no recording)" }] },
        { minTier: "elder", label: "Teaching", text: "An invented account of the teachings shared at this site and who carries them forward. Placeholder text only." }
      ]
    },

    T01: {
      title: "River Trail", category: "trail", minTier: "public",
      verification: "verified",
      source: "Synthetic: team-generated route",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-08-18",
      note: "Route drawn from several matching accounts.",
      sections: [
        { minTier: "public", label: "Overview", text: "A trail following the river from the harvest area up toward the story place. Shown as a line that opens into a record." },
        { minTier: "member", label: "Use", text: "Described as the main way families moved between camps in summer. Placeholder text." }
      ],
      /* Walk-the-trail photo journey. Reuses four already-vetted real regional photos (media/P01,
         P03, P04, P10.jpg) rather than sourcing new ground-level imagery for this fictional trail. */
      journey: [
        { img: "P01", caption: "Starting out near the harvest area, the trail follows flat ground along the river." },
        { img: "P03", caption: "Partway along, the trail opens into a sunnier clearing before returning to the treeline." },
        { img: "P04", caption: "A high point partway up gives a wide view back down the valley." },
        { img: "P10", caption: "Nearing the far end, the trail comes down to a shallow crossing." }
      ]
    },

    T02: {
      title: "Winter Trail to the Ridge", category: "trail", minTier: "member",
      verification: "community",
      source: "Synthetic: invented community account",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Route not yet checked against a second account.",
      sections: [
        { minTier: "member", label: "Overview", text: "A winter route that connects the northern camp to the ridge lookout." }
      ]
    },

    T03: {
      title: "Hunting Route", category: "trail", minTier: "elder",
      verification: "unverified",
      source: "Synthetic: team-generated example",
      reviewer: "Not yet reviewed", reviewed: "",
      note: "Single source only.",
      sections: [
        { minTier: "elder", label: "Overview", text: "A route described as leading across the valley toward the far hunting ground. Placeholder text." }
      ]
    },

    T04: {
      title: "Old Wagon Track", category: "trail", minTier: "public",
      verification: "contested",
      source: "Synthetic: two invented accounts that disagree",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-09-05",
      note: "Accounts disagree on where the track crossed the river.",
      sections: [
        { minTier: "public", label: "Overview", text: "An old track crossing the valley. Accounts differ on its path near the river, so it is marked contested." }
      ]
    },

    B01: {
      title: "Pilot Area (illustrative)", category: "area", minTier: "public",
      verification: "verified",
      source: "Synthetic: drawn by the team as a demonstration area",
      reviewer: "Team (fictional)", reviewed: "2026-09-10",
      precision: "surveyed",
      precisionNote: "Drawn deliberately as an exact outline for the demo itself, not meant to represent how a real traditional-use boundary would be captured.",
      note: "This is not a real boundary. It only marks the area used for the demo. Any real boundary data on the platform would remain fully community-owned.",
      sections: [
        { minTier: "public", label: "About this area", text: "The small demonstration area chosen for the prototype, standing in for the kind of pilot boundary a first Social Impact Lab project might use before other communities and project types join the platform. The outline is fictional and illustrative, and does not represent any real boundary or land claim." }
      ]
    },

    B02: {
      title: "Traditional Use Area A (illustrative)", category: "area", minTier: "member",
      verification: "community",
      source: "Synthetic: invented community-drawn outline",
      reviewer: "Not yet reviewed", reviewed: "",
      precision: "recalled",
      precisionNote: "Based on a described area of use, not a survey. The dashed outline on the map reflects that the exact edge was never formally fixed.",
      note: "Illustrative outline only.",
      sections: [
        { minTier: "member", label: "About this area", text: "An invented example of a community-drawn area of traditional use, illustrating the kind of boundary a Health and Wellness project might reference when connecting members to land-based wellness practices. Fictional outline, not a real place." }
      ]
    },

    B03: {
      title: "Overlap Zone (illustrative dispute)", category: "area", minTier: "member",
      verification: "contested",
      source: "Synthetic: invented example of two overlapping accounts",
      reviewer: "Reviewer A (fictional)", reviewed: "2026-09-08",
      precision: "estimate",
      precisionNote: "This is the core of the illustrative dispute: no one has ever agreed on where this line actually sits. The soft, blurred edge on the map is intentional, drawing a hard line here would misrepresent how unsettled the boundary is.",
      note: "Fictional example of an area where two accounts overlap.",
      versions: [
        { date: "2026-08-30", change: "Drawn as a single invented community-use boundary, Unverified.", by: "Community member (fictional)" },
        { date: "2026-09-08", change: "Marked Contested after a second, overlapping account and an external proposed boundary were added.", by: "Reviewer A (fictional)" }
      ],
      sections: [
        { minTier: "member", label: "About this area", text: "An invented example of an area where two groups' oral accounts of use overlap, the kind of boundary question a Language and Culture project might help document and reconcile over time. Used to show how documented evidence and verification status could be laid out when a boundary question comes up." },
        { minTier: "admin", label: "Evidence linked", text: "Linked items: River Crossing, Old Survey Marker, Old Wagon Track. Each has its own verification status. In a real platform, a resolved boundary question like this would be archived and shared with the next community that joins, the same way the Social Impact Lab model carries forward what earlier projects learn." },
        { minTier: "admin", label: "External claim overlapping this zone", text: "A separate proposed industrial boundary (see Proposed Industrial Boundary on the map, visible at this access level) overlaps part of this area. Where the two outlines overlap, the map shows a deeper red, flagging that a conversation between the parties is needed before anything proceeds." }
      ]
    },

    B04: {
      title: "Seasonal Harvest Area (illustrative)", category: "area", minTier: "elder",
      verification: "community",
      source: "Synthetic: invented knowledge keeper account",
      reviewer: "Not yet reviewed", reviewed: "",
      precision: "recalled",
      precisionNote: "Drawn from a knowledge keeper's description of where harvesting happens, which shifts somewhat by season. The dashed outline reflects that it was never meant to be a fixed line.",
      note: "Held at elder level in the example.",
      sections: [
        { minTier: "elder", label: "About this area", text: "An invented seasonal harvest area, the kind of boundary a Food Sovereignty project might map as part of a land-based food systems archive. Shown only at elder level here to demonstrate how a named area can be restricted from public and member view. Fictional outline." }
      ]
    },

    B05: {
      title: "Trapline Registration Area (illustrative)", category: "area", minTier: "member",
      verification: "verified",
      source: "Synthetic: consolidated from several invented historical registration records",
      reviewer: "Reviewer B (fictional)", reviewed: "2026-10-18",
      verifiedBy: "Nation's Lands Office (example)", corroboration: 4,
      precision: "surveyed",
      precisionNote: "Based on formal trapline registration records, which do fix a specific area, unlike most of the boundaries on this map.",
      note: "Built from the trapline reinstatement scenario raised by Prophet River's own legal counsel. Historically, confirming who held a trapline meant searching scattered registration and transfer records one at a time. This record shows what it looks like once that history is pulled into one place.",
      versions: [
        { date: "2026-10-02", change: "Four separate invented registration documents entered as Unverified, scattered across different dates.", by: "Team (fictional)" },
        { date: "2026-10-18", change: "Consolidated into a single Verified timeline after cross-checking the dates against each other.", by: "Reviewer B (fictional)" }
      ],
      /* "Play this trapline's story" (see app.js buildTraplineStory): the same four timeline
         chapters above, as a guided flythrough rather than a table. Reuses the real Trapline
         Cabin photo (P09, itself single-source/unverified -- the story stays honest about
         that) and the existing Winter Trail to the Ridge location. Each chapter keeps its own
         verification status, since not all four are proven the same way. */
      trapline: [
        { period: "1962 to 1984", place: "Trapline Cabin", center: [-122.88, 58.12], zoom: 13.5,
          note: "Registered to Holder A (fictional), passed down within one family.", verification: "unverified", img: "P09" },
        { period: "1984 to 2003", place: "Winter Trail to the Ridge", center: [-122.78, 58.15], zoom: 12.5,
          note: "Transferred to Holder B (fictional) after a formal registration change.", verification: "verified" },
        { period: "2003 to 2019", place: "Across the registration area", center: [-122.85, 58.09], zoom: 12,
          note: "Lapsed and re-registered to Holder C (fictional) following a gap in renewal.", verification: "contested" },
        { period: "2019 to present", place: "The whole trapline area", bounds: true,
          note: "Reinstatement in progress, the kind of process that previously took months of manual record searches.", verification: "community" }
      ],
      sections: [
        { minTier: "member", label: "About this area", text: "An invented trapline area illustrating how BC's real trapline registration system, where licences are registered, transferred and occasionally lapse over decades, could be represented once its history is gathered in one place. The outline and every name below are fictional.", timeline: [
          { period: "1962 to 1984", note: "Registered to Holder A (fictional), passed down within one family." },
          { period: "1984 to 2003", note: "Transferred to Holder B (fictional) after a formal registration change." },
          { period: "2003 to 2019", note: "Lapsed and re-registered to Holder C (fictional) following a gap in renewal." },
          { period: "2019 to present", note: "Reinstatement in progress, the kind of process that previously took months of manual record searches." }
        ] },
        { minTier: "admin", label: "Why this matters", text: "Prophet River's own legal counsel flagged trapline reinstatement, a long manual search through historical registration and transfer records, as a case where a platform like this would save real time. This record is the team's illustration of that, built from an invented but realistic chain of registration events." }
      ]
    },

    B06: {
      title: "Proposed Industrial Boundary (illustrative dispute)", category: "area", minTier: "admin",
      verification: "contested",
      source: "Synthetic: invented external claim, modelled on an oil and gas boundary dispute",
      reviewer: "Not yet reviewed", reviewed: "",
      precision: "surveyed",
      precisionNote: "Proposed industrial boundaries like this are typically surveyed precisely by the company that files them. The contrast with the Overlap Zone's blurred edge just to the west is itself part of the problem: one side arrives with a hard line, the other's boundary was never meant to be one.",
      note: "Visible only to administrators, representing the kind of external industrial claim that can overlap a community's own mapped area.",
      sections: [
        { minTier: "admin", label: "About this area", text: "An invented proposed boundary from an external party (modelled on an oil and gas company's claim), shown only at the administrator level. It overlaps part of the Overlap Zone to the west. Where the two outlines overlap on the map, the fill reads as a deeper red, a visual flag that a conversation between the parties is needed before anything proceeds." }
      ]
    }
  },

  /* Geometry. Each entry uses the same id as its record. Coordinates are [longitude, latitude]. */
  FEATURES: {
    points: {
      P01: [-122.80, 58.10],
      P02: [-122.68, 58.06],
      P03: [-122.84, 58.05],
      P04: [-122.62, 58.14],
      P05: [-122.75, 58.13],
      P06: [-122.85, 58.16],
      P07: [-122.70, 58.17],
      P08: [-122.58, 58.05],
      P09: [-122.88, 58.12],
      P10: [-122.66, 58.11],
      P11: [-122.77, 58.04],
      P12: [-122.82, 58.14],
      P13: [-122.72, 58.09],
      P14: [-122.64, 58.09],
      P15: [-122.81, 58.115]
    },
    lines: {
      T01: [[-122.86, 58.03], [-122.81, 58.05], [-122.79, 58.08], [-122.80, 58.10], [-122.76, 58.12], [-122.75, 58.13]],
      T02: [[-122.85, 58.16], [-122.78, 58.15], [-122.70, 58.15], [-122.62, 58.14]],
      T03: [[-122.88, 58.12], [-122.82, 58.11], [-122.74, 58.09], [-122.66, 58.07], [-122.60, 58.06]],
      T04: [[-122.70, 58.02], [-122.68, 58.06], [-122.66, 58.11], [-122.63, 58.16]]
    },
    polygons: {
      B01: [[-122.90, 58.00], [-122.55, 58.01], [-122.53, 58.17], [-122.88, 58.19], [-122.90, 58.00]],
      B02: [[-122.95, 58.05], [-122.65, 58.03], [-122.60, 58.15], [-122.92, 58.16], [-122.95, 58.05]],
      B03: [[-122.72, 58.08], [-122.58, 58.09], [-122.59, 58.16], [-122.70, 58.15], [-122.72, 58.08]],
      B04: [[-122.86, 58.02], [-122.78, 58.03], [-122.79, 58.08], [-122.87, 58.07], [-122.86, 58.02]],
      B05: [[-122.93, 58.08], [-122.80, 58.06], [-122.78, 58.14], [-122.91, 58.16], [-122.93, 58.08]],
      B06: [[-122.69, 58.085], [-122.56, 58.10], [-122.585, 58.165], [-122.68, 58.155], [-122.69, 58.085]]
    }
  }
};
