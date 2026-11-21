/* Land Knowledge Map prototype. All content comes from data.js (synthetic). */
(function () {
  "use strict";

  var D = window.WAYBACK;
  var TIERS = D.TIERS;
  /* "liberty" carries real road names, place labels and building footprints, unlike the
     plainer "positron" style used before. Still OpenFreeMap: free, no key, no Google. */
  var STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

  var state = { role: "public", roleLocked: false, selected: null, basemap: "map", terrain3d: false, pickingLocation: false, layers: { points: true, trails: true, areas: true } };
  /* The one pending "click the map to set a location" listener, if any -- tracked here (not just
     inside the form that created it) so closing the card mid-pick can cancel it, instead of
     leaving a stray listener that plants an orphaned pin on whatever's clicked next. */
  var pendingLocationPick = null;
  function cancelLocationPick() {
    if (pendingLocationPick && map) map.off("click", pendingLocationPick);
    pendingLocationPick = null;
    state.pickingLocation = false;
    if (map) map.getCanvas().style.cursor = "";
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function rank(t) { return TIERS.indexOf(t); }
  function canSee(minTier) { return rank(state.role) >= rank(minTier); }

  function kindOf(id) { return id.charAt(0) === "P" ? "points" : id.charAt(0) === "T" ? "lines" : "polys"; }

  function badge(verifKey, round) {
    var v = D.VERIFICATION[verifKey];
    var b = el("span", "vbadge" + (round ? " round" : ""));
    b.style.background = v.color;
    b.textContent = round ? v.icon : v.icon + " " + v.label;
    b.title = v.label + ": " + v.blurb;
    return b;
  }

  /* Simple generated placeholder picture so no image files are needed. */
  function placeholderImage(seed, caption) {
    var h = 0, i;
    for (i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + h + ',35%,78%)"/>' +
      '<stop offset="1" stop-color="hsl(' + ((h + 40) % 360) + ',30%,62%)"/></linearGradient></defs>' +
      '<rect width="400" height="220" fill="url(#g)"/>' +
      '<path d="M0 170 L70 110 L120 150 L200 80 L280 150 L330 120 L400 170 L400 220 L0 220Z" fill="hsl(' + h + ',25%,38%)" opacity=".75"/>' +
      '<rect x="0" y="0" width="400" height="26" fill="#000" opacity=".35"/>' +
      '<text x="12" y="18" font-family="sans-serif" font-size="13" fill="#fff">SYNTHETIC IMAGE (not a real photo)</text>' +
      '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function mediaBlock(m, id) {
    /* m.url means a real file the viewer (or a submitter) actually picked on their device --
       shown directly, rather than the id-based media/<id>.jpg convention used for the demo's
       own built-in records. */
    if (m.url) {
      if (m.type === "photo") {
        var fu = el("figure", "media photo");
        var imgu = document.createElement("img");
        imgu.src = m.url;
        imgu.alt = m.caption;
        fu.appendChild(imgu);
        fu.appendChild(el("figcaption", null, m.caption));
        fu.style.margin = "8px 0 0";
        return fu;
      }
      if (m.type === "audio") {
        var fa = el("figure", "media photo");
        var audiou = document.createElement("audio");
        audiou.controls = true;
        audiou.src = m.url;
        audiou.style.width = "100%";
        fa.appendChild(audiou);
        fa.appendChild(el("figcaption", null, m.caption));
        fa.style.margin = "8px 0 0";
        return fa;
      }
      if (m.type === "video") {
        var fv = el("figure", "media photo");
        var videou = document.createElement("video");
        videou.controls = true;
        videou.src = m.url;
        videou.style.width = "100%";
        videou.style.borderRadius = "6px";
        fv.appendChild(videou);
        fv.appendChild(el("figcaption", null, m.caption));
        fv.style.margin = "8px 0 0";
        return fv;
      }
      var fgen = el("div", "media");
      fgen.appendChild(el("span", "ico", "📎"));
      var link = document.createElement("a");
      link.href = m.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = m.caption;
      fgen.appendChild(link);
      return fgen;
    }
    if (m.type === "photo") {
      var f = el("figure", "media photo");
      var img = document.createElement("img");
      var fallback = placeholderImage(id + m.caption);
      /* Drop a real photo in media/<id>.jpg (see media/README.md) and it is used instead.
         If it is missing, this falls back to the synthetic placeholder automatically. */
      img.src = "media/" + id + ".jpg";
      img.alt = m.caption;
      img.addEventListener("error", function onErr() {
        img.removeEventListener("error", onErr);
        img.src = fallback;
      }, { once: true });
      f.appendChild(img);
      f.appendChild(el("figcaption", null, m.caption));
      f.style.margin = "8px 0 0";
      return f;
    }
    var box = el("div", "media");
    box.appendChild(el("span", "ico", m.type === "audio" ? "🔊" : "🎬"));
    box.appendChild(el("span", null, m.caption));
    return box;
  }

  /* ---------- real file picker shared by the Contribute form and the attach-to-record form:
     lets someone actually choose a photo/audio/video file from their device and preview it.
     The file is held only as an in-memory object URL for this browser tab -- never uploaded
     anywhere, since this prototype has no server to upload to. Falls back to a generated
     placeholder image when no file has been picked, so the flow can still be tried instantly. ---------- */
  function buildFileAttach(seedPrefix) {
    var current = null; // { url, name, kind } once a real file is picked
    var wrap = el("div", "uploaddemo");
    var previewHolder = el("div");
    wrap.appendChild(previewHolder);
    var caption = el("p", "uploaddemo-caption", "");
    wrap.appendChild(caption);

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,audio/*,video/*";

    var seedBase = seedPrefix + Date.now();
    var swapCount = 0;

    function showPlaceholder() {
      previewHolder.textContent = "";
      var thumb = document.createElement("img");
      thumb.className = "uploaddemo-img";
      thumb.src = placeholderImage(seedBase + swapCount);
      previewHolder.appendChild(thumb);
      caption.textContent = "Demo placeholder. Choose a file above to preview your own instead.";
    }

    var swapBtn = el("button", "uploaddemo-btn", "Show a different placeholder");
    swapBtn.type = "button";
    swapBtn.addEventListener("click", function () {
      swapCount++;
      showPlaceholder();
    });

    fileInput.addEventListener("change", function () {
      if (current) URL.revokeObjectURL(current.url);
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        current = null;
        showPlaceholder();
        swapBtn.hidden = false;
        return;
      }
      var url = URL.createObjectURL(file);
      var kind = file.type.indexOf("image/") === 0 ? "photo"
        : file.type.indexOf("audio/") === 0 ? "audio"
        : file.type.indexOf("video/") === 0 ? "video"
        : "file";
      current = { url: url, name: file.name, kind: kind };
      previewHolder.textContent = "";
      if (kind === "photo") {
        var img = document.createElement("img");
        img.className = "uploaddemo-img";
        img.src = url;
        previewHolder.appendChild(img);
      } else if (kind === "audio") {
        var audio = document.createElement("audio");
        audio.controls = true;
        audio.style.width = "100%";
        audio.src = url;
        previewHolder.appendChild(audio);
      } else if (kind === "video") {
        var video = document.createElement("video");
        video.controls = true;
        video.style.width = "100%";
        video.style.borderRadius = "6px";
        video.src = url;
        previewHolder.appendChild(video);
      } else {
        previewHolder.appendChild(el("p", null, "Selected: " + file.name));
      }
      caption.textContent = file.name + " -- stays only in this browser tab for this demo. Nothing is uploaded anywhere.";
      swapBtn.hidden = true;
    });

    showPlaceholder();
    var actions = el("div", "uploaddemo-actions");
    actions.appendChild(swapBtn);
    wrap.appendChild(actions);

    return {
      fileInputEl: fileInput,
      previewWrap: wrap,
      getAttached: function () { return current; }
    };
  }

  /* ---------- small interactive demo: confirm before an upload goes live ---------- */
  function buildUploadDemo(id) {
    var wrap = el("div", "uploaddemo");
    var thumb = document.createElement("img");
    thumb.className = "uploaddemo-img";
    var wrongSeed = id + "-wrong", rightSeed = id + "-right";
    var showingWrong = true;
    thumb.src = placeholderImage(wrongSeed);
    thumb.alt = "Photo to confirm";
    var caption = el("p", "uploaddemo-caption", "Is this the photo you meant to upload?");
    var status = el("p", "uploaddemo-status", "");
    var confirmBtn = el("button", "uploaddemo-btn primary", "Yes, use this photo");
    var swapBtn = el("button", "uploaddemo-btn", "No, try a different one");
    confirmBtn.type = "button";
    swapBtn.type = "button";
    swapBtn.addEventListener("click", function () {
      showingWrong = !showingWrong;
      thumb.src = placeholderImage(showingWrong ? wrongSeed : rightSeed);
      status.textContent = "";
    });
    confirmBtn.addEventListener("click", function () {
      status.textContent = showingWrong
        ? "Submission queued for review. (In the real flow this photo would still need a human check before anything is lost.)"
        : "Submission queued for review. An administrator will verify it before it is shown to others.";
      confirmBtn.disabled = true;
      swapBtn.disabled = true;
    });
    var actions = el("div", "uploaddemo-actions");
    actions.appendChild(confirmBtn);
    actions.appendChild(swapBtn);
    wrap.appendChild(thumb);
    wrap.appendChild(caption);
    wrap.appendChild(actions);
    wrap.appendChild(status);
    return wrap;
  }

  /* ---------- speak to contribute: an optional voice draft of the form below, for anyone who'd
     rather talk than type (the note behind this: many Elders won't type into a web form, and
     that could decide whether a platform like this gets used at all). Uses the Web Speech API
     built into Chrome, free and keyless -- but unlike everything else in this prototype, that
     API is NOT purely local: Chrome sends the audio to Google's servers to turn it into text,
     the one place this demo doesn't clear the "no Google" bar the rest of it holds to. Said
     here for transparency, not glossed over. A real platform would need an on-device or
     self-hosted speech model instead. Nothing drafted here is submitted until the person checks
     every field and approves it, the same two checkboxes and Submit button as typing it in
     directly, and the field-filling is a handful of keyword rules, not real understanding --
     both of which this says on screen too. ---------- */
  function buildSpeakToContribute(fields) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var wrap = el("div", "uploaddemo");
    var status = el("p", "uploaddemo-caption", "");
    var heard = el("p", "journey-note", "");
    heard.hidden = true;

    if (!SR) {
      status.textContent = "Voice input isn't supported in this browser (it needs Chrome's built-in speech recognition). Just type into the form below instead.";
      wrap.appendChild(status);
      return wrap;
    }

    var recognizing = false;
    var recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    var micBtn = el("button", "uploaddemo-btn primary", "🎤 Speak to contribute");
    micBtn.type = "button";

    function fillFromTranscript(text) {
      var lower = text.toLowerCase();

      var type = "story";
      if (/\b(photo|picture|image)\b/.test(lower)) type = "photo";
      else if (/\bvideo\b/.test(lower)) type = "video";
      else if (/\b(recording|audio|sound)\b/.test(lower)) type = "audio";

      var tier = "member";
      if (/\b(sacred|ceremonial|private|restricted|named)\b/.test(lower)) tier = "restricted";
      else if (/\b(elder|knowledge keeper)s?\b/.test(lower)) tier = "elder";

      var seasonMatch = lower.match(/\b(spring|summer|fall|autumn|winter)\b/);
      var placeMatch = lower.match(/\b(?:near|at|by|along|up at|down at)\s+([a-z' ]{3,30})/);
      var place = [seasonMatch ? seasonMatch[1] : null, placeMatch ? placeMatch[1].trim() : null].filter(Boolean).join(", ");

      var firstClause = text.split(/[.!?]/)[0].trim();
      var title = firstClause.length > 60 ? firstClause.slice(0, 57) + "..." : firstClause;
      if (title) title = title.charAt(0).toUpperCase() + title.slice(1);

      fields.typeSel.value = type;
      fields.titleInput.value = title;
      if (fields.placeInput) fields.placeInput.value = place;
      fields.descInput.value = text;
      fields.tierSel.value = tier;
      fields.tierSel.dispatchEvent(new Event("change"));
      fields.titleInput.dispatchEvent(new Event("input"));
      fields.descInput.dispatchEvent(new Event("input"));

      heard.hidden = false;
      heard.textContent = "Heard: “" + text + "” — title, type, place/season and sharing level below were drafted from this with a few keyword rules, not real understanding. Check and edit every field, especially the sharing level, before submitting.";
    }

    recog.onresult = function (e) { fillFromTranscript(e.results[0][0].transcript); };
    recog.onerror = function () {
      status.textContent = "Didn't catch that clearly. Tap the button and try again, or just type below.";
      recognizing = false;
      micBtn.textContent = "🎤 Speak to contribute";
    };
    recog.onend = function () {
      recognizing = false;
      micBtn.textContent = "🎤 Speak to contribute";
    };

    micBtn.addEventListener("click", function () {
      if (recognizing) { recog.stop(); return; }
      recognizing = true;
      micBtn.textContent = "🔴 Listening… tap to stop";
      status.textContent = "";
      recog.start();
    });

    wrap.appendChild(micBtn);
    wrap.appendChild(el("p", "uploaddemo-caption", "Describe the place out loud and this drafts the fields below. Nothing is submitted until you check it and press Submit yourself, same as typing it in."));
    wrap.appendChild(el("p", "uploaddemo-caption", "Note: this uses Chrome's built-in speech recognition, which sends the recording to Google to turn it into text. Unlike the rest of this prototype, that step isn't local or Google-free. A real version would need its own speech model instead."));
    wrap.appendChild(status);
    wrap.appendChild(heard);
    return wrap;
  }

  /* ---------- community contribute form: members add their own content, gated by safeguards ---------- */
  var submitCounter = 0;

  /* ---------- where is this?: a new submission used to be dropped at a random spot near the
     map center regardless of what the submitter actually meant. This lets them either point
     right at it (click the map) or say they don't know the exact spot yet, in which case the
     record still goes in, but flagged as approximate so a reviewer knows to confirm the real
     location before anyone relies on it. ---------- */
  function buildLocationPicker(onChange) {
    onChange = onChange || function () {};
    var wrap = el("div", "uploaddemo");
    var mode = null; // "exact" | "unsure"
    var coord = null;
    var marker = null;

    var exactLabel = el("label", "check");
    var exactRadio = document.createElement("input");
    exactRadio.type = "radio"; exactRadio.name = "locMode" + Date.now();
    exactLabel.appendChild(exactRadio);
    exactLabel.appendChild(el("span", null, "I know exactly where this is"));

    var unsureLabel = el("label", "check");
    var unsureRadio = document.createElement("input");
    unsureRadio.type = "radio"; unsureRadio.name = exactRadio.name;
    unsureLabel.appendChild(unsureRadio);
    unsureLabel.appendChild(el("span", null, "I'm not sure of the exact spot yet"));

    var pickBtn = el("button", "uploaddemo-btn", "Click to drop a pin on the map");
    pickBtn.type = "button";
    pickBtn.hidden = true;
    var status = el("p", "uploaddemo-caption", "");

    function clearMarker() { if (marker) { marker.remove(); marker = null; } }

    function startPick() {
      if (!map) { status.textContent = "Map isn't ready yet."; return; }
      cancelLocationPick(); // in case a previous pick on this same form was left hanging
      pickBtn.disabled = true;
      pickBtn.textContent = "Click anywhere on the map…";
      map.getCanvas().style.cursor = "crosshair";
      /* Suppresses the normal click-to-open-a-record behaviour for this one click, so pinning a
         new submission on top of an existing point, trail or boundary doesn't instead open that
         record and wipe out the form in progress. */
      state.pickingLocation = true;
      pendingLocationPick = function (e) {
        map.off("click", pendingLocationPick);
        pendingLocationPick = null;
        state.pickingLocation = false;
        pickBtn.disabled = false;
        pickBtn.textContent = "Change location";
        map.getCanvas().style.cursor = "";
        coord = [e.lngLat.lng, e.lngLat.lat];
        clearMarker();
        marker = new maplibregl.Marker({ color: "#b5533c" }).setLngLat(coord).addTo(map);
        status.textContent = "Location set: " + coord[1].toFixed(4) + ", " + coord[0].toFixed(4) + ". Click the button again to change it.";
        onChange();
      };
      map.on("click", pendingLocationPick);
    }
    pickBtn.addEventListener("click", startPick);

    [exactRadio, unsureRadio].forEach(function (r) {
      r.addEventListener("change", function () {
        mode = r.value || (r === exactRadio ? "exact" : "unsure");
        pickBtn.hidden = r !== exactRadio;
        if (r === unsureRadio) {
          clearMarker();
          coord = null;
          status.textContent = "This will go in as an approximate pin near the general area, flagged for someone to confirm the real spot before it's relied on.";
        } else {
          status.textContent = coord
            ? ("Location set: " + coord[1].toFixed(4) + ", " + coord[0].toFixed(4) + ".")
            : "Click the button below, then click the map where this is.";
        }
        onChange();
      });
    });
    mode = null;
    exactRadio.value = "exact"; unsureRadio.value = "unsure";

    wrap.appendChild(el("p", null, "Where is this?"));
    wrap.appendChild(exactLabel);
    wrap.appendChild(unsureLabel);
    wrap.appendChild(pickBtn);
    wrap.appendChild(status);

    return {
      el: wrap,
      isReady: function () { return mode === "unsure" || (mode === "exact" && !!coord); },
      getLocation: function () {
        if (mode === "exact" && coord) return { coord: coord, exact: true };
        var center = D.MAP_VIEW.center;
        return { coord: [center[0] + (Math.random() - 0.5) * 0.08, center[1] + (Math.random() - 0.5) * 0.08], exact: false };
      },
      removePreviewMarker: clearMarker,
      disable: function () { exactRadio.disabled = true; unsureRadio.disabled = true; pickBtn.disabled = true; }
    };
  }

  /* ---------- optional name + anonymous option, shared by the Contribute and Attach forms: a
     community member raised this directly about sharing good harvesting locations, people may
     want to flag something without their name attached to it, even from administrators. ---------- */
  function buildIdentityField() {
    var wrap = el("div", "uploaddemo");
    wrap.appendChild(el("label", null, "Your name (optional)"));
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Shown to administrators only, never to other members";
    wrap.appendChild(nameInput);

    var anonLabel = el("label", "check");
    var anonCheck = document.createElement("input");
    anonCheck.type = "checkbox";
    anonLabel.appendChild(anonCheck);
    anonLabel.appendChild(el("span", null, "Submit this anonymously (not even administrators will see who submitted it)"));
    wrap.appendChild(anonLabel);

    anonCheck.addEventListener("change", function () {
      nameInput.disabled = anonCheck.checked;
      if (anonCheck.checked) nameInput.value = "";
    });

    return {
      el: wrap,
      getSubmitterLine: function () {
        if (anonCheck.checked) return "Anonymous (identity withheld, even from administrators)";
        var n = nameInput.value.trim();
        return n ? (n + " (visible to administrators only)") : "Not given (visible to administrators only)";
      },
      disable: function () { nameInput.disabled = true; anonCheck.disabled = true; }
    };
  }

  function buildContributeForm() {
    var wrap = el("div", "contribform");

    var typeSel = document.createElement("select");
    [["photo", "A photo"], ["story", "A story or account (text)"], ["audio", "An audio recording"], ["video", "A video"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0]; opt.textContent = o[1];
      typeSel.appendChild(opt);
    });

    var titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Short title";

    var placeInput = document.createElement("input");
    placeInput.type = "text";
    placeInput.placeholder = "Where, or what season (optional)";

    var descInput = document.createElement("textarea");
    descInput.rows = 4;
    descInput.placeholder = "A sentence or two about what this is and where it's from.";

    var tierSel = document.createElement("select");
    [["member", "Community members and above"], ["elder", "Elders and knowledge keepers and above"], ["restricted", "Restricted: named individuals only"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0]; opt.textContent = o[1];
      tierSel.appendChild(opt);
    });

    wrap.appendChild(buildSpeakToContribute({ typeSel: typeSel, titleInput: titleInput, placeInput: placeInput, descInput: descInput, tierSel: tierSel }));

    wrap.appendChild(el("label", null, "What are you sharing?"));
    wrap.appendChild(typeSel);

    wrap.appendChild(el("label", null, "Title"));
    wrap.appendChild(titleInput);

    wrap.appendChild(el("label", null, "Where, or what season"));
    wrap.appendChild(placeInput);

    wrap.appendChild(el("label", null, "Tell us about it"));
    wrap.appendChild(descInput);

    var locationPicker = buildLocationPicker(function () { refreshEnabled(); });
    wrap.appendChild(locationPicker.el);

    var identity = buildIdentityField();
    wrap.appendChild(identity.el);

    /* Reuses the same confirm-before-it-goes-anywhere pattern as the admin review example,
       so a wrong file can be caught before submitting, not after. The file itself is real
       (held only as an in-memory object URL in this tab); nothing is actually uploaded
       anywhere in this prototype, since there's no server to upload it to. */
    wrap.appendChild(el("label", null, "Attach a file (optional)"));
    var attach = buildFileAttach("contrib");
    wrap.appendChild(attach.fileInputEl);
    wrap.appendChild(attach.previewWrap);

    wrap.appendChild(el("label", null, "Who should eventually be able to see this?"));
    wrap.appendChild(tierSel);

    var check1 = document.createElement("input");
    check1.type = "checkbox";
    var check1Label = el("label", "check");
    check1Label.appendChild(check1);
    check1Label.appendChild(el("span", null, "This is mine to share, or I have permission. It doesn't include private details about someone else without their consent."));
    wrap.appendChild(check1Label);

    var check2 = document.createElement("input");
    check2.type = "checkbox";
    var check2Text = el("span", null, "This doesn't include anything sacred, ceremonial, or culturally restricted beyond what I picked above.");
    var check2Label = el("label", "check");
    check2Label.appendChild(check2);
    check2Label.appendChild(check2Text);
    wrap.appendChild(check2Label);

    tierSel.addEventListener("change", function () {
      check2Text.textContent = tierSel.value === "restricted"
        ? "This does include something sensitive, and I want it kept to the Restricted level, named individuals only."
        : "This doesn't include anything sacred, ceremonial, or culturally restricted beyond what I picked above.";
    });

    var status = el("p", "uploaddemo-status", "");
    var submitBtn = el("button", "uploaddemo-btn primary", "Submit for review");
    submitBtn.type = "button";
    submitBtn.disabled = true;

    function refreshEnabled() {
      submitBtn.disabled = !(titleInput.value.trim() && descInput.value.trim() && check1.checked && check2.checked && locationPicker.isReady());
    }
    [titleInput, descInput].forEach(function (f) { f.addEventListener("input", refreshEnabled); });
    [check1, check2].forEach(function (f) { f.addEventListener("change", refreshEnabled); });

    submitBtn.addEventListener("click", function () {
      submitCounter++;
      /* Starts with "P": submitted items are always points, and kindOf() (used for flying the
         map to a record and for the real-world reference block) reads the id's first letter
         to tell points, trails and boundaries apart. */
      var id = "PSUB" + String(submitCounter).padStart(2, "0");
      var attached = attach.getAttached();
      var mediaKind = attached ? attached.kind : (typeSel.value === "story" ? null : typeSel.value);
      var mediaItem = null;
      if (mediaKind) {
        mediaItem = { type: mediaKind, caption: attached ? ("Submitted file: " + attached.name) : "Submitted by a community member through the demo's contribute form." };
        if (attached) mediaItem.url = attached.url;
      }
      var location = locationPicker.getLocation();

      D.RECORDS[id] = {
        title: titleInput.value.trim(), category: "evidence", minTier: "admin",
        verification: "unverified",
        source: "Synthetic: submitted through the demo's own contribute form",
        reviewer: "Not yet reviewed", reviewed: "",
        note: location.exact
          ? "Added just now through the Contribute function, at the exact spot the submitter marked on the map. Visible to administrators only until reviewed, regardless of the level suggested below, which is exactly the safeguard this function demonstrates."
          : "Added just now through the Contribute function. The submitter wasn't sure of the exact spot, so this pin is approximate only and needs someone to confirm the real location before it's relied on or shown more widely.",
        sections: [
          { minTier: "admin", label: "Submission", text: descInput.value.trim(),
            media: mediaItem ? [mediaItem] : [] },
          { minTier: "admin", label: "Submitter", text: identity.getSubmitterLine() },
          { minTier: "admin", label: "Submitter's requested sharing level", text: "Suggested for: " + D.TIER_INFO[tierSel.value].label + ". Stays visible to administrators only until reviewed." },
          { minTier: "admin", label: "Safeguards confirmed at submission", text: "Submitter confirmed permission to share, and confirmed cultural sensitivity was considered for the level picked above." },
          { minTier: "admin", label: "Reviewer actions", text: "Accept, request more information, or decline. (Buttons are not active in the prototype.)" }
        ]
      };
      if (!location.exact) {
        D.RECORDS[id].sections.splice(1, 0, { minTier: "admin", label: "Location needs confirming", text: "Placed near the general pilot area as a stand-in. The submitter didn't have an exact spot, so someone should follow up before this is treated as accurate." });
      }
      if (placeInput.value.trim()) {
        D.RECORDS[id].sections.splice(1, 0, { minTier: "admin", label: "Where, or what season", text: placeInput.value.trim() });
      }
      D.FEATURES.points[id] = location.coord;

      locationPicker.removePreviewMarker();
      refreshMapData();
      renderItems();

      status.textContent = location.exact
        ? "Submitted for review. An administrator will check this before anything here is shared more widely, at whatever level is approved, not necessarily the level suggested above."
        : "Submitted for review as an approximate location. An administrator will need to confirm the real spot before this is shared more widely.";
      [typeSel, titleInput, placeInput, descInput, tierSel, attach.fileInputEl, check1, check2, submitBtn].forEach(function (f) { f.disabled = true; });
      locationPicker.disable();
      identity.disable();
    });

    var actions = el("div", "uploaddemo-actions");
    actions.appendChild(submitBtn);
    wrap.appendChild(actions);
    wrap.appendChild(status);
    return wrap;
  }

  /* ---------- trail photo-journey: click-through stops along a trail using real regional photos ---------- */
  function buildJourney(id, stops) {
    var wrap = el("div", "journey");
    var idx = 0;
    var counter = el("p", "journey-counter", "");
    var imgEl = document.createElement("img");
    imgEl.className = "journey-img";
    var caption = el("p", "journey-caption", "");

    function render() {
      var stop = stops[idx];
      var fallback = placeholderImage(id + "-journey-" + idx);
      imgEl.onerror = null;
      imgEl.src = "media/" + stop.img + ".jpg";
      imgEl.alt = stop.caption;
      imgEl.onerror = function () { imgEl.onerror = null; imgEl.src = fallback; };
      counter.textContent = "Stop " + (idx + 1) + " of " + stops.length;
      caption.textContent = stop.caption;
    }

    var prevBtn = el("button", "uploaddemo-btn", "‹ Back");
    var nextBtn = el("button", "uploaddemo-btn primary", "Forward ›");
    prevBtn.type = "button";
    nextBtn.type = "button";
    prevBtn.addEventListener("click", function () { idx = (idx - 1 + stops.length) % stops.length; render(); });
    nextBtn.addEventListener("click", function () { idx = (idx + 1) % stops.length; render(); });

    var actions = el("div", "uploaddemo-actions");
    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);

    wrap.appendChild(counter);
    wrap.appendChild(imgEl);
    wrap.appendChild(caption);
    wrap.appendChild(actions);
    wrap.appendChild(el("p", "journey-note", "Representative photos of the surrounding terrain, not actual photographs of this trail."));
    render();
    return wrap;
  }

  /* ---------- trapline story: a boundary's own registration timeline, played as a guided
     flythrough instead of read as a table. Tilts into 3D terrain and flies the camera to
     each chapter's place; the AI's only role is sequencing the four scattered records and
     writing the connecting captions, which is why each chapter still carries its own
     verification badge rather than one blanket status for the whole story. ---------- */
  function buildTraplineStory(id, stops) {
    var wrap = el("div", "journey");
    var idx = 0;
    var counter = el("p", "journey-counter", "");
    var imgEl = document.createElement("img");
    imgEl.className = "journey-img";
    var caption = el("p", "journey-caption");
    var badgeHolder = el("div");
    badgeHolder.style.marginTop = "6px";

    function flyToStop(stop) {
      if (!map) return;
      if (!state.terrain3d) setTerrain3D(true);
      if (stop.bounds) {
        var coords = D.FEATURES.polygons[id];
        var b = new maplibregl.LngLatBounds(coords[0], coords[0]);
        coords.forEach(function (c) { b.extend(c); });
        map.fitBounds(b, { padding: 70, maxZoom: 12, pitch: 55, bearing: -17, duration: 1100 });
      } else {
        map.easeTo({ center: stop.center, zoom: stop.zoom || 13, pitch: 55, bearing: -17, duration: 1100 });
      }
    }

    function render(fly) {
      var stop = stops[idx];
      counter.textContent = "Chapter " + (idx + 1) + " of " + stops.length;
      imgEl.onerror = null;
      if (stop.img) {
        imgEl.hidden = false;
        var fallback = placeholderImage(id + "-trapline-" + idx);
        imgEl.src = "media/" + stop.img + ".jpg";
        imgEl.alt = stop.place;
        imgEl.onerror = function () { imgEl.onerror = null; imgEl.src = fallback; };
      } else {
        imgEl.hidden = true;
      }
      caption.textContent = "";
      caption.appendChild(el("strong", null, stop.period + " — " + stop.place + ". "));
      caption.appendChild(document.createTextNode(stop.note));
      badgeHolder.textContent = "";
      if (stop.verification) badgeHolder.appendChild(badge(stop.verification));
      if (fly) flyToStop(stop);
    }

    var prevBtn = el("button", "uploaddemo-btn", "‹ Back");
    var nextBtn = el("button", "uploaddemo-btn primary", "Forward ›");
    prevBtn.type = "button";
    nextBtn.type = "button";
    prevBtn.addEventListener("click", function () { idx = (idx - 1 + stops.length) % stops.length; render(true); });
    nextBtn.addEventListener("click", function () { idx = (idx + 1) % stops.length; render(true); });

    var actions = el("div", "uploaddemo-actions");
    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);

    wrap.appendChild(counter);
    wrap.appendChild(imgEl);
    wrap.appendChild(caption);
    wrap.appendChild(badgeHolder);
    wrap.appendChild(actions);
    wrap.appendChild(el("p", "journey-note",
      "The AI's part here was sequencing these four scattered registration records and writing the captions connecting them. The order was approved before anyone else saw it, every name is fictional, and the photo is the same single-source Trapline Cabin image shown elsewhere, still marked unverified here too."));
    render(true);
    return wrap;
  }

  /* ---------- attach content to an existing record: same safeguards as the standalone Contribute
     form, but adds to a record that already exists instead of creating a new standalone point. ---------- */
  var attachCounter = 0;

  function buildAttachForm(recordId) {
    var wrap = el("div", "contribform");

    wrap.appendChild(el("label", null, "What are you adding?"));
    var typeSel = document.createElement("select");
    [["photo", "A photo"], ["story", "A story or account (text)"], ["audio", "An audio recording"], ["video", "A video"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0]; opt.textContent = o[1];
      typeSel.appendChild(opt);
    });
    wrap.appendChild(typeSel);

    wrap.appendChild(el("label", null, "Title"));
    var titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Short title";
    wrap.appendChild(titleInput);

    wrap.appendChild(el("label", null, "Tell us about it"));
    var descInput = document.createElement("textarea");
    descInput.rows = 4;
    descInput.placeholder = "A sentence or two about what this is and how it relates to this place.";
    wrap.appendChild(descInput);

    /* Same confirm-before-it-goes-anywhere pattern as the standalone Contribute form, with a real
       file picker: nothing is actually uploaded anywhere in this prototype, since there's no
       server to upload it to, but the file itself is real and previewed from this device. */
    wrap.appendChild(el("label", null, "Attach a file (optional)"));
    var attach = buildFileAttach("attach" + recordId);
    wrap.appendChild(attach.fileInputEl);
    wrap.appendChild(attach.previewWrap);

    var identity = buildIdentityField();
    wrap.appendChild(identity.el);

    wrap.appendChild(el("label", null, "Who should eventually be able to see this?"));
    var tierSel = document.createElement("select");
    [["member", "Community members and above"], ["elder", "Elders and knowledge keepers and above"], ["restricted", "Restricted: named individuals only"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0]; opt.textContent = o[1];
      tierSel.appendChild(opt);
    });
    wrap.appendChild(tierSel);

    var check1 = document.createElement("input");
    check1.type = "checkbox";
    var check1Label = el("label", "check");
    check1Label.appendChild(check1);
    check1Label.appendChild(el("span", null, "This is mine to share, or I have permission. It doesn't include private details about someone else without their consent."));
    wrap.appendChild(check1Label);

    var check2 = document.createElement("input");
    check2.type = "checkbox";
    var check2Text = el("span", null, "This doesn't include anything sacred, ceremonial, or culturally restricted beyond what I picked above.");
    var check2Label = el("label", "check");
    check2Label.appendChild(check2);
    check2Label.appendChild(check2Text);
    wrap.appendChild(check2Label);

    tierSel.addEventListener("change", function () {
      check2Text.textContent = tierSel.value === "restricted"
        ? "This does include something sensitive, and I want it kept to the Restricted level, named individuals only."
        : "This doesn't include anything sacred, ceremonial, or culturally restricted beyond what I picked above.";
    });

    var status = el("p", "uploaddemo-status", "");
    var submitBtn = el("button", "uploaddemo-btn primary", "Submit for review");
    submitBtn.type = "button";
    submitBtn.disabled = true;

    function refreshEnabled() {
      submitBtn.disabled = !(titleInput.value.trim() && descInput.value.trim() && check1.checked && check2.checked);
    }
    [titleInput, descInput].forEach(function (f) { f.addEventListener("input", refreshEnabled); });
    [check1, check2].forEach(function (f) { f.addEventListener("change", refreshEnabled); });

    submitBtn.addEventListener("click", function () {
      attachCounter++;
      var r = D.RECORDS[recordId];
      if (!r.pendingContributions) r.pendingContributions = [];
      var attached = attach.getAttached();
      r.pendingContributions.push({
        type: typeSel.value,
        title: titleInput.value.trim(),
        text: descInput.value.trim(),
        suggestedTier: tierSel.value,
        submittedAt: new Date().toISOString().slice(0, 10),
        submittedBy: identity.getSubmitterLine(),
        fileUrl: attached ? attached.url : null,
        fileName: attached ? attached.name : null,
        fileKind: attached ? attached.kind : null
      });

      /* Lands as a pending item on this same record, admin-only, exactly like the standalone
         Contribute form's submissions -- nothing is added to the record a wider audience can see
         until an administrator reviews it, regardless of the level suggested above. Deliberately
         not re-rendering the card here: that would wipe out this success message. */
      status.textContent = "Submitted for review. An administrator will check this before it's added to this record, at whatever level is approved, not necessarily the level suggested above.";
      [typeSel, titleInput, descInput, tierSel, attach.fileInputEl, check1, check2, submitBtn].forEach(function (f) { f.disabled = true; });
      identity.disable();
    });

    var actions = el("div", "uploaddemo-actions");
    actions.appendChild(submitBtn);
    wrap.appendChild(actions);
    wrap.appendChild(status);
    return wrap;
  }

  function openContributeForm() {
    state.selected = null;
    highlight(null);
    cancelLocationPick();
    var c = document.getElementById("card");
    c.textContent = "";
    c.hidden = false;

    var close = el("button", "close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closeCard);
    c.appendChild(close);

    var body = el("div", "body");
    body.appendChild(el("h3", null, "Add a photo or story"));
    body.appendChild(el("p", null,
      "Share something to be reviewed before it's added to the map. Everything submitted here stays visible to administrators only until it's reviewed, no matter what level is suggested below."));
    body.appendChild(buildContributeForm());
    c.appendChild(body);
    c.scrollTop = 0;
    if (window.matchMedia("(max-width: 900px)").matches) document.getElementById("panel").classList.remove("open");
  }

  /* ---------- a small CSV parser: enough for a flat dataset export (quoted fields with embedded
     commas handled), nothing fancier than that. Returns { headers, rows }, each row an array
     aligned to headers; empty if the file had nothing usable in it. ---------- */
  function parseCsv(text) {
    var rows = [], row = [], field = "", inQuotes = false, i = 0;
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    while (i < text.length) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ",") { row.push(field); field = ""; i++; continue; }
      if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += ch; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    rows = rows.filter(function (r) { return r.length > 1 || (r.length === 1 && r[0].trim()); });
    if (!rows.length) return { headers: [], rows: [] };
    var headers = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return { headers: headers, rows: rows.slice(1) };
  }

  /* ---------- bulk import: for a dataset handed over all at once, like a hired ecologist's
     survey, instead of one submission at a time. Administrator-only, since a large external
     dataset needs a human look before it's trusted -- same review-queue safeguard as a single
     Contribute submission, just applied to many rows in one pass. ---------- */
  var bulkCounter = 0;
  function buildBulkImportForm() {
    var wrap = el("div", "contribform");
    wrap.appendChild(el("p", null, "Expects a CSV with a header row and these columns: title, description, lat, lng, and optionally type (photo/story/audio/video), season, and sharing_level (member/elder/restricted)."));

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv,text/csv";
    wrap.appendChild(fileInput);

    var preview = el("div");
    wrap.appendChild(preview);

    var status = el("p", "uploaddemo-status", "");
    var importBtn = el("button", "uploaddemo-btn primary", "Import these records");
    importBtn.type = "button";
    importBtn.hidden = true;

    var parsedGood = [];

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      preview.textContent = "";
      importBtn.hidden = true;
      parsedGood = [];
      status.textContent = "";
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = parseCsv(String(reader.result));
        if (!parsed.headers.length) {
          preview.appendChild(el("p", "uploaddemo-caption", "Couldn't find any rows in that file."));
          return;
        }
        var idx = {};
        parsed.headers.forEach(function (h, i) { idx[h] = i; });
        if (idx.title === undefined || idx.lat === undefined || idx.lng === undefined) {
          preview.appendChild(el("p", "uploaddemo-caption", "Needs at least title, lat, and lng columns. Found: " + parsed.headers.join(", ")));
          return;
        }
        var bad = 0;
        parsed.rows.forEach(function (r) {
          var title = (r[idx.title] || "").trim();
          var lat = parseFloat(r[idx.lat]);
          var lng = parseFloat(r[idx.lng]);
          if (!title || isNaN(lat) || isNaN(lng)) { bad++; return; }
          var tierRaw = idx.sharing_level !== undefined ? (r[idx.sharing_level] || "").trim().toLowerCase() : "";
          parsedGood.push({
            title: title,
            desc: idx.description !== undefined ? (r[idx.description] || "").trim() : "",
            lat: lat, lng: lng,
            type: idx.type !== undefined && r[idx.type] ? r[idx.type].trim().toLowerCase() : "story",
            season: idx.season !== undefined ? (r[idx.season] || "").trim() : "",
            tier: ["member", "elder", "restricted"].indexOf(tierRaw) >= 0 ? tierRaw : "member"
          });
        });

        preview.appendChild(el("p", null, parsedGood.length + " of " + parsed.rows.length + " rows look importable" + (bad ? " (" + bad + " skipped: missing title, lat, or lng)" : "") + "."));
        if (parsedGood.length) {
          var sample = el("ul", "legend");
          parsedGood.slice(0, 5).forEach(function (row) {
            sample.appendChild(el("li", null, row.title + " (" + row.lat.toFixed(3) + ", " + row.lng.toFixed(3) + ")"));
          });
          preview.appendChild(sample);
          if (parsedGood.length > 5) preview.appendChild(el("p", "uploaddemo-caption", "…and " + (parsedGood.length - 5) + " more."));
          importBtn.hidden = false;
          importBtn.textContent = "Import " + parsedGood.length + " record" + (parsedGood.length > 1 ? "s" : "");
        }
      };
      reader.readAsText(file);
    });

    importBtn.addEventListener("click", function () {
      var fname = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "uploaded file";
      parsedGood.forEach(function (row) {
        bulkCounter++;
        var id = "PBULK" + String(bulkCounter).padStart(3, "0");
        D.RECORDS[id] = {
          title: row.title, category: "evidence", minTier: "admin",
          verification: "unverified",
          source: "Synthetic: imported in bulk from \"" + fname + "\"",
          reviewer: "Not yet reviewed", reviewed: "",
          note: "Added through bulk import, not entered by hand. Visible to administrators only until reviewed, same as a single contribution, just many at once.",
          sections: [
            { minTier: "admin", label: "Submission", text: (row.desc || "(no description provided in the dataset)") + (row.type ? " (Type: " + row.type + ")" : "") },
            { minTier: "admin", label: "Submitter's requested sharing level", text: "Suggested for: " + D.TIER_INFO[row.tier].label + ". Stays visible to administrators only until reviewed." },
            { minTier: "admin", label: "Reviewer actions", text: "Accept, request more information, or decline. (Buttons are not active in the prototype.)" }
          ]
        };
        if (row.season) D.RECORDS[id].sections.splice(1, 0, { minTier: "admin", label: "Where, or what season", text: row.season });
        D.FEATURES.points[id] = [row.lng, row.lat];
      });
      refreshMapData();
      renderItems();
      status.textContent = "Imported " + parsedGood.length + " record" + (parsedGood.length > 1 ? "s" : "") + " into the admin review queue. Nothing is visible more widely until each is reviewed individually.";
      importBtn.disabled = true;
      fileInput.disabled = true;
    });

    wrap.appendChild(importBtn);
    wrap.appendChild(status);
    return wrap;
  }

  function openBulkImportForm() {
    state.selected = null;
    highlight(null);
    cancelLocationPick();
    var c = document.getElementById("card");
    c.textContent = "";
    c.hidden = false;

    var close = el("button", "close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closeCard);
    c.appendChild(close);

    var body = el("div", "body");
    body.appendChild(el("h3", null, "Bulk import a dataset"));
    body.appendChild(el("p", null, "For when someone hands over a lot of records at once instead of submitting one at a time, like a hired ecologist's survey. Every row still lands in the review queue; nothing is published automatically."));
    body.appendChild(buildBulkImportForm());
    c.appendChild(body);
    c.scrollTop = 0;
    if (window.matchMedia("(max-width: 900px)").matches) document.getElementById("panel").classList.remove("open");
  }

  /* ---------- a representative real coordinate for a record, for the real-world reference block ---------- */
  function representativeCoord(id) {
    var k = kindOf(id);
    if (k === "points") return D.FEATURES.points[id];
    if (k === "lines") {
      var line = D.FEATURES.lines[id];
      return line[Math.floor((line.length - 1) / 2)];
    }
    var ring = D.FEATURES.polygons[id];
    var pts = ring.slice(0, ring.length - 1);
    var sx = 0, sy = 0, i;
    for (i = 0; i < pts.length; i++) { sx += pts[i][0]; sy += pts[i][1]; }
    return [sx / pts.length, sy / pts.length];
  }

  function realWorldBlock(id) {
    var coord = representativeCoord(id);
    var lng = coord[0], lat = coord[1];
    var sec = el("section", "sec real-ref");
    sec.appendChild(el("h4", null, "Real-world reference"));
    sec.appendChild(el("p", null, "These coordinates sit in a real place. That doesn't mean what's described above is documented there, the record is illustrative, but the ground itself is real, not generated."));

    var d = 0.01;
    var bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
    var thumbUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export"
      + "?bbox=" + bbox + "&bboxSR=4326&size=400,260&format=png32&f=image";
    var wrap = el("div", "realref-wrap");
    var img = document.createElement("img");
    img.className = "realref-img";
    img.src = thumbUrl;
    img.alt = "Real satellite image of these coordinates";
    img.addEventListener("error", function onErr() {
      img.removeEventListener("error", onErr);
      wrap.classList.add("hidden-img");
    }, { once: true });
    wrap.appendChild(img);
    wrap.appendChild(el("p", "realref-caption", "Real satellite image of these coordinates today, for reference only."));
    sec.appendChild(wrap);

    /* Opens this demo's own live-view.html rather than linking out to a third-party map site.
       It reuses the exact same Esri World Imagery source already used for the Satellite toggle
       and the thumbnail just above, so this is a real, panned-and-zoomed-in-real-time satellite
       view of this spot, not a different provider with its own look or sign-in behaviour. */
    var link = document.createElement("a");
    link.href = "live-view.html?lat=" + lat + "&lng=" + lng;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "realref-link";
    link.textContent = "Open this spot on a live satellite map ↗";
    sec.appendChild(link);
    return sec;
  }

  /* ---------- geometry -> GeoJSON, filtered by role ---------- */
  function buildCollections() {
    var out = { points: [], lines: [], polys: [] };
    var counts = { visible: 0, total: 0 };
    function props(id) {
      var r = D.RECORDS[id];
      return { id: id, title: r.title, category: r.category, verification: r.verification, precision: r.precision || "recalled" };
    }
    Object.keys(D.FEATURES.points).forEach(function (id) {
      counts.total++;
      if (!canSee(D.RECORDS[id].minTier)) return;
      counts.visible++;
      out.points.push({ type: "Feature", properties: props(id), geometry: { type: "Point", coordinates: D.FEATURES.points[id] } });
    });
    Object.keys(D.FEATURES.lines).forEach(function (id) {
      counts.total++;
      if (!canSee(D.RECORDS[id].minTier)) return;
      counts.visible++;
      out.lines.push({ type: "Feature", properties: props(id), geometry: { type: "LineString", coordinates: D.FEATURES.lines[id] } });
    });
    Object.keys(D.FEATURES.polygons).forEach(function (id) {
      counts.total++;
      if (!canSee(D.RECORDS[id].minTier)) return;
      counts.visible++;
      out.polys.push({ type: "Feature", properties: props(id), geometry: { type: "Polygon", coordinates: [D.FEATURES.polygons[id]] } });
    });
    return { fc: {
      points: { type: "FeatureCollection", features: out.points },
      lines:  { type: "FeatureCollection", features: out.lines },
      polys:  { type: "FeatureCollection", features: out.polys }
    }, counts: counts };
  }

  /* ---------- map ---------- */
  var map;

  function blankStyle() {
    return { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#e8e2d2" } }] };
  }

  /* Free, keyless satellite imagery (no Google). Public ArcGIS Online service. */
  function satelliteStyle() {
    return {
      version: 8,
      sources: {
        esriSat: {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Imagery: Esri, Maxar, Earthstar Geographics"
        }
      },
      layers: [{ id: "esriSat", type: "raster", source: "esriSat" }]
    };
  }

  /* Free, keyless public-domain elevation tiles (AWS Open Data "Terrain Tiles", terrarium
     encoding), used for both real-time 3D terrain and a flat hillshade. No Google, no key. */
  var TERRAIN_TILES_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

  /* Adds the elevation source once per style load (styles wipe custom sources on switch, same
     as buildDataLayers()). Always adds a subtle flat hillshade for relief even without tilting;
     re-applies the 3D effect itself only if the toggle was already on before a basemap switch. */
  function addTerrainSource() {
    if (!map.getSource("terrainSource")) {
      map.addSource("terrainSource", { type: "raster-dem", tiles: [TERRAIN_TILES_URL], tileSize: 256, encoding: "terrarium", maxzoom: 14 });
    }
    if (!map.getLayer("hillshade")) {
      map.addLayer({ id: "hillshade", type: "hillshade", source: "terrainSource",
        paint: { "hillshade-exaggeration": 0.45, "hillshade-shadow-color": "#3b3226", "hillshade-illumination-direction": 315 } });
    }
    if (state.terrain3d) map.setTerrain({ source: "terrainSource", exaggeration: 1.6 });
  }

  function setTerrain3D(on) {
    state.terrain3d = on;
    var btn = document.getElementById("terrain3dBtn");
    if (btn) {
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "Flatten to 2D map" : "Tilt to 3D terrain";
    }
    var hint = document.getElementById("terrainHint");
    if (hint) hint.hidden = !on;
    if (!map) return;
    if (on) {
      map.setTerrain({ source: "terrainSource", exaggeration: 1.6 });
      map.easeTo({ pitch: 55, bearing: -17, duration: 900 });
    } else {
      map.setTerrain(null);
      map.easeTo({ pitch: 0, bearing: 0, duration: 900 });
    }
  }

  function setBasemap(which) {
    if (!map) return;
    state.basemap = which;
    var btnMap = document.getElementById("bmMap"), btnSat = document.getElementById("bmSat");
    if (btnMap) btnMap.setAttribute("aria-pressed", String(which === "map"));
    if (btnSat) btnSat.setAttribute("aria-pressed", String(which === "satellite"));
    if (which === "satellite") map.setStyle(satelliteStyle());
    else map.setStyle(window.WAYBACK_NO_TILES ? blankStyle() : STYLE_URL);
  }

  function pickStyle() {
    /* Hosted preview builds set WAYBACK_NO_TILES because outside map tiles are blocked there. */
    if (window.WAYBACK_NO_TILES) {
      var note = document.getElementById("offline");
      note.textContent = "Plain background in this hosted preview. Open the downloaded version for the full basemap.";
      note.hidden = false;
      return Promise.resolve(blankStyle());
    }
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 4000);
    return fetch(STYLE_URL, { signal: ctl.signal })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error("style"); return STYLE_URL; })
      .catch(function () { clearTimeout(timer); document.getElementById("offline").hidden = false; return blankStyle(); });
  }

  function verifColorExpr() {
    var e = ["match", ["get", "verification"]];
    Object.keys(D.VERIFICATION).forEach(function (k) { e.push(k, D.VERIFICATION[k].color); });
    e.push("#6b6b6b");
    return e;
  }
  function catColorExpr() {
    var e = ["match", ["get", "category"]];
    Object.keys(D.CATEGORIES).forEach(function (k) { e.push(k, D.CATEGORIES[k].color); });
    e.push("#444");
    return e;
  }

  /* Adds (or, if already present from before a basemap switch, just refreshes) the prototype's
     own data layers on top of whatever basemap style is currently loaded. Runs on every
     "style.load", including the very first one and every later switch between map and satellite. */
  function buildDataLayers() {
    var built = buildCollections();
    ["points", "lines", "polys"].forEach(function (k) {
      var s = map.getSource(k);
      if (s) s.setData(built.fc[k]);
      else map.addSource(k, { type: "geojson", data: built.fc[k] });
    });

    if (!map.getLayer("polys-fill")) {
      map.addLayer({ id: "polys-fill", type: "fill", source: "polys", paint: { "fill-color": verifColorExpr(), "fill-opacity": 0.12 } });

      /* Boundary outlines are styled by how confidently the line itself can be pinned down,
         separate from whether the area is verified. A survey-backed line is solid, a
         community-recalled outline is dashed, and a disputed estimate gets a soft, blurred
         edge instead of a crisp line, so the map doesn't visually claim more precision than
         the underlying record actually has. */
      map.addLayer({ id: "polys-line-estimate", type: "line", source: "polys", filter: ["==", ["get", "precision"], "estimate"],
        paint: { "line-color": verifColorExpr(), "line-width": 20, "line-blur": 16, "line-opacity": 0.5 } });
      map.addLayer({ id: "polys-line-recalled", type: "line", source: "polys", filter: ["==", ["get", "precision"], "recalled"],
        paint: { "line-color": verifColorExpr(), "line-width": 2.5, "line-dasharray": [3, 2] } });
      map.addLayer({ id: "polys-line-surveyed", type: "line", source: "polys", filter: ["==", ["get", "precision"], "surveyed"],
        paint: { "line-color": verifColorExpr(), "line-width": 2.5 } });

      /* Admin-only overlay: an external proposed boundary, drawn with extra fill so a genuine
         overlap with another boundary reads as a visibly deeper red "needs a conversation" zone. */
      map.addLayer({ id: "dispute-fill", type: "fill", source: "polys", filter: ["==", ["get", "id"], "B06"],
        paint: { "fill-color": "#b3261e", "fill-opacity": 0.22 } });
      map.addLayer({ id: "dispute-outline", type: "line", source: "polys", filter: ["==", ["get", "id"], "B06"],
        paint: { "line-color": "#b3261e", "line-width": 3.5, "line-dasharray": [1, 1], "line-opacity": 0.9 } });

      map.addLayer({ id: "lines-hit", type: "line", source: "lines", paint: { "line-width": 16, "line-opacity": 0 } });
      map.addLayer({ id: "lines-solid", type: "line", source: "lines", filter: ["==", ["get", "verification"], "verified"],
        paint: { "line-color": verifColorExpr(), "line-width": 4 }, layout: { "line-cap": "round" } });
      map.addLayer({ id: "lines-dash", type: "line", source: "lines", filter: ["!=", ["get", "verification"], "verified"],
        paint: { "line-color": verifColorExpr(), "line-width": 4, "line-dasharray": [1.5, 1.5] } });

      map.addLayer({ id: "sel-line", type: "line", source: "lines", filter: ["==", ["get", "id"], ""],
        paint: { "line-color": "#f0b429", "line-width": 9, "line-opacity": 0.55 } });
      map.addLayer({ id: "sel-poly", type: "line", source: "polys", filter: ["==", ["get", "id"], ""],
        paint: { "line-color": "#f0b429", "line-width": 7, "line-opacity": 0.6 } });

      map.addLayer({ id: "points", type: "circle", source: "points", paint: {
        "circle-radius": 9, "circle-color": catColorExpr(), "circle-stroke-width": 4, "circle-stroke-color": verifColorExpr()
      } });
      map.addLayer({ id: "sel-point", type: "circle", source: "points", filter: ["==", ["get", "id"], ""],
        paint: { "circle-radius": 17, "circle-color": "#f0b429", "circle-opacity": 0.35 } });
      map.moveLayer("points");
    }

    renderPanel(built.counts);
  }

  function initMap(style) {
    map = new maplibregl.Map({
      container: "map",
      style: style,
      center: D.MAP_VIEW.center,
      zoom: D.MAP_VIEW.zoom,
      attributionControl: { compact: true, customAttribution: "Prototype data: synthetic" }
    });
    /* visualizePitch + a visible compass give a click-to-reset-tilt control once 3D is on. */
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

    /* Fires on the first style load AND again every time setBasemap() swaps styles, since a
       new base style starts with none of this prototype's own sources or layers. */
    map.on("style.load", function () {
      addTerrainSource();
      buildDataLayers();
      applyLayerVisibility();
      highlight(state.selected);
    });

    /* Fires once, ever, regardless of later basemap switches. Interaction handlers are
       registered by layer id, which MapLibre re-resolves each frame, so they keep working
       after buildDataLayers() recreates those same ids under a new style. */
    map.on("load", function () {
      var popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
      var clickable = ["points", "lines-hit", "polys-fill"];

      clickable.forEach(function (lid) {
        map.on("mouseenter", lid, function () { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", lid, function () { map.getCanvas().style.cursor = ""; popup.remove(); });
        map.on("mousemove", lid, function (e) {
          var f = e.features && e.features[0];
          if (!f) return;
          popup.setLngLat(e.lngLat).setText(f.properties.title).addTo(map);
        });
      });

      map.on("click", function (e) {
        /* Yields to the location picker in the Contribute form: while someone is dropping a
           pin for a brand-new submission, a click shouldn't instead open whatever existing
           record happens to be under it. */
        if (state.pickingLocation) return;
        var avail = clickable.filter(function (l) { return map.getLayer(l) && map.getLayoutProperty(l, "visibility") !== "none"; });
        var pad = 6;
        var hits = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: avail });
        if (!hits.length) return;
        /* prefer points, then lines, then areas */
        var order = { points: 0, "lines-hit": 1, "polys-fill": 2 };
        hits.sort(function (a, b) { return order[a.layer.id] - order[b.layer.id]; });
        openRecord(hits[0].properties.id);
      });

      map.fire("wayback-ready");
    });
  }

  function refreshMapData() {
    if (!map) return;
    buildDataLayers();
  }

  function applyLayerVisibility() {
    var set = function (ids, on) { ids.forEach(function (i) { if (map.getLayer(i)) map.setLayoutProperty(i, "visibility", on ? "visible" : "none"); }); };
    set(["points", "sel-point"], state.layers.points);
    set(["lines-hit", "lines-solid", "lines-dash", "sel-line"], state.layers.trails);
    set(["polys-fill", "polys-line-estimate", "polys-line-recalled", "polys-line-surveyed", "sel-poly", "dispute-fill", "dispute-outline"], state.layers.areas);
  }

  function highlight(id) {
    if (!map || !map.getLayer("sel-point")) return;
    var f = ["==", ["get", "id"], id || ""];
    map.setFilter("sel-point", f);
    map.setFilter("sel-line", f);
    map.setFilter("sel-poly", f);
  }

  /* ---------- panel ---------- */
  /* Shows the homepage again. Used both by the sidebar's Home button and by the
     "Change view" link that appears once a role has been locked in from the homepage. */
  function goHome() {
    var landingEl = document.getElementById("landing");
    if (landingEl) {
      landingEl.classList.remove("hidden");
      landingEl.scrollTop = 0;
    }
  }

  function renderRoles() {
    var wrap = document.getElementById("roles");
    var heading = document.getElementById("viewAsHeading");
    wrap.textContent = "";
    if (state.roleLocked) {
      /* Entered via a homepage "jump straight in as" button: this session only sees
         that one tier, the way a real signed-in account only sees its own access
         level. Switching tiers means going back to the homepage and picking again. */
      if (heading) heading.textContent = "Viewing as";
      wrap.classList.add("roles--locked");
      var chip = el("div", "role-locked-chip");
      chip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
      chip.appendChild(el("span", null, D.TIER_INFO[state.role].label));
      wrap.appendChild(chip);
      var changeBtn = el("button", "role-locked-change", "Change view →");
      changeBtn.type = "button";
      changeBtn.addEventListener("click", goHome);
      wrap.appendChild(changeBtn);
    } else {
      if (heading) heading.textContent = "View as";
      wrap.classList.remove("roles--locked");
      TIERS.forEach(function (t) {
        var b = el("button", null, D.TIER_INFO[t].label);
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(state.role === t));
        b.dataset.role = t;
        b.addEventListener("click", function () { setRole(t); });
        wrap.appendChild(b);
      });
    }
  }

  function renderLegends() {
    var lv = document.getElementById("legendVerif");
    Object.keys(D.VERIFICATION).forEach(function (k) {
      var li = el("li");
      li.appendChild(badge(k, true));
      var t = el("span");
      t.appendChild(el("strong", null, D.VERIFICATION[k].label));
      t.appendChild(el("small", null, D.VERIFICATION[k].blurb));
      li.appendChild(t);
      lv.appendChild(li);
    });
    var lc = document.getElementById("legendCat");
    ["gathering", "camp", "harvest", "story", "landmark", "protected", "evidence"].forEach(function (k) {
      var li = el("li");
      var d = el("span", "dot");
      d.style.background = D.CATEGORIES[k].color;
      li.appendChild(d);
      li.appendChild(el("span", null, D.CATEGORIES[k].label));
      lc.appendChild(li);
    });
    var note = el("li");
    note.appendChild(el("small", null, "Circle outline colour shows verification status. Dashed lines are trails not yet verified."));
    lc.appendChild(note);

    var lp = document.getElementById("legendPrecision");
    if (lp) {
      Object.keys(D.PRECISION).forEach(function (k) {
        var p = D.PRECISION[k];
        var li = el("li");
        li.appendChild(el("span", "precswatch " + p.dash));
        var t = el("span");
        t.appendChild(el("strong", null, p.label));
        t.appendChild(el("small", null, p.blurb));
        li.appendChild(t);
        lp.appendChild(li);
      });
    }
  }

  function renderPanel(counts) {
    renderRoles();
    document.getElementById("roleBlurb").textContent = D.TIER_INFO[state.role].blurb;
    document.getElementById("roleCount").textContent =
      "Showing " + counts.visible + " of " + counts.total + " items at this level (demo count only).";
    renderItems();
    /* Only accounts at member level or above (not anonymous public visitors) can contribute. */
    var cs = document.getElementById("contributeSection");
    if (cs) cs.hidden = !canSee("member");
    var bi = document.getElementById("bulkImportSection");
    if (bi) bi.hidden = !canSee("admin");
    renderElderQueue();
  }

  /* ---------- Elder review queue: every currently-visible, still-unconfirmed community-reported
     record, in one place, so an Elder doesn't have to hunt the map for what needs confirming. ---------- */
  function renderElderQueue() {
    var section = document.getElementById("elderQueueSection");
    var list = document.getElementById("elderQueue");
    if (!section || !list) return;
    if (!canSee("elder")) { section.hidden = true; return; }

    list.textContent = "";
    var count = 0;
    Object.keys(D.RECORDS).forEach(function (id) {
      var r = D.RECORDS[id];
      if (!canSee(r.minTier)) return;
      if (r.verification !== "community") return;
      count++;
      var li = el("li");
      var b = el("button", "itembtn", r.title);
      b.type = "button";
      b.addEventListener("click", function () { openRecord(id, true); });
      li.appendChild(badge(r.verification, true));
      li.appendChild(b);
      list.appendChild(li);
    });
    section.hidden = count === 0;
  }

  function renderItems() {
    var list = document.getElementById("items");
    if (!list) return;
    list.textContent = "";
    Object.keys(D.RECORDS).forEach(function (id) {
      var r = D.RECORDS[id];
      if (!canSee(r.minTier)) return;
      var li = el("li");
      var b = el("button", "itembtn", r.title);
      b.type = "button";
      b.addEventListener("click", function () { openRecord(id, true); });
      li.appendChild(badge(r.verification, true));
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function setRole(t) {
    state.role = t;
    if (state.selected && !canSee(D.RECORDS[state.selected].minTier)) closeCard();
    else if (state.selected) renderCard(state.selected);
    else if (!canSee("member") && !document.getElementById("card").hidden) closeCard(); // the open contribute form isn't tied to a record
    refreshMapData();
  }

  /* ---------- record card ---------- */
  function openRecord(id, fly) {
    var r = D.RECORDS[id];
    if (!r || !canSee(r.minTier)) return;
    cancelLocationPick();
    state.selected = id;
    highlight(id);
    renderCard(id);
    if (fly) {
      var k = kindOf(id);
      var mobile = window.matchMedia("(max-width: 900px)").matches;
      var pad = mobile ? { top: 60, left: 40, right: 40, bottom: Math.round(window.innerHeight * 0.6) } : { top: 80, left: 80, right: 80, bottom: 80 };
      if (k === "points") map.easeTo({ center: D.FEATURES.points[id], zoom: Math.max(map.getZoom(), 11), padding: pad });
      else {
        var coords = k === "lines" ? D.FEATURES.lines[id] : D.FEATURES.polygons[id];
        var b = new maplibregl.LngLatBounds(coords[0], coords[0]);
        coords.forEach(function (c) { b.extend(c); });
        map.fitBounds(b, { padding: pad, maxZoom: 12 });
      }
    }
    if (window.matchMedia("(max-width: 900px)").matches) document.getElementById("panel").classList.remove("open");
  }

  function closeCard() {
    state.selected = null;
    highlight(null);
    cancelLocationPick();
    var c = document.getElementById("card");
    c.hidden = true;
    c.textContent = "";
    // MapLibre resizes itself when the container changes size
  }

  function renderCard(id) {
    var r = D.RECORDS[id];
    var c = document.getElementById("card");
    c.textContent = "";
    c.hidden = false;

    var close = el("button", "close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close record");
    close.addEventListener("click", closeCard);
    c.appendChild(close);

    var body = el("div", "body");
    body.appendChild(el("h3", null, r.title));

    var chips = el("div", "chips");
    chips.appendChild(badge(r.verification));
    chips.appendChild(el("span", "chip", D.CATEGORIES[r.category].label));
    chips.appendChild(el("span", "chip synthetic", "Synthetic"));
    body.appendChild(chips);

    var hiddenCount = 0;
    r.sections.forEach(function (s) {
      if (!canSee(s.minTier)) { hiddenCount++; return; }
      var sec = el("section", "sec");
      var h = el("h4", null, s.label + " ");
      h.appendChild(el("span", "tierhint", "(" + D.TIER_INFO[s.minTier].label + " and above)"));
      sec.appendChild(h);
      if (s.text) sec.appendChild(el("p", null, s.text));
      (s.media || []).forEach(function (m) { sec.appendChild(mediaBlock(m, id)); });
      if (s.timeline) {
        var tol = el("ol", "timeline");
        s.timeline.forEach(function (t) {
          var li = el("li");
          li.appendChild(el("strong", null, t.period + ". "));
          li.appendChild(el("span", null, t.note));
          tol.appendChild(li);
        });
        sec.appendChild(tol);
      }
      if (s.demo === "upload") {
        /* Gated behind a click rather than always shown: this only appears once someone actually
           triggers an upload action, instead of sitting permanently visible on the record. */
        var demoBtn = el("button", "uploaddemo-btn primary", "Simulate an upload to try it");
        demoBtn.type = "button";
        var demoHolder = el("div");
        demoBtn.addEventListener("click", function () {
          demoHolder.textContent = "";
          demoHolder.appendChild(buildUploadDemo(id));
          demoBtn.hidden = true;
        });
        sec.appendChild(demoBtn);
        sec.appendChild(demoHolder);
      }
      body.appendChild(sec);
    });

    if (hiddenCount) {
      body.appendChild(el("div", "locked",
        "More detail exists for this record at a higher access level (" + hiddenCount + " section" + (hiddenCount > 1 ? "s" : "") + " not shown)."));
    }

    if (r.namedAccess && r.namedAccess.length && canSee("admin")) {
      var nasec = el("section", "sec");
      var nah = el("h4", null, "Named access (example) ");
      nah.appendChild(el("span", "tierhint", "(" + D.TIER_INFO.admin.label + " and above)"));
      nasec.appendChild(nah);
      nasec.appendChild(el("p", null, "Restricted here means specific named people, not a rank above this one. These are placeholder names standing in for whoever a community would actually name:"));
      var nal = el("ul", "legend");
      r.namedAccess.forEach(function (name) { nal.appendChild(el("li", null, name)); });
      nasec.appendChild(nal);
      body.appendChild(nasec);
    }

    if (r.journey && r.journey.length) {
      var jsec = el("section", "sec");
      jsec.appendChild(el("h4", null, "Walk the trail"));
      jsec.appendChild(buildJourney(id, r.journey));
      body.appendChild(jsec);
    }

    if (r.trapline && r.trapline.length) {
      var tsec = el("section", "sec");
      tsec.appendChild(el("h4", null, "The life of this trapline"));
      tsec.appendChild(el("p", null, "This area's registration history, told as a guided flythrough through its four chapters instead of read as a table."));
      var playBtn = el("button", "uploaddemo-btn primary", "Play this trapline's story");
      playBtn.type = "button";
      var storyHolder = el("div");
      playBtn.addEventListener("click", function () {
        storyHolder.textContent = "";
        storyHolder.appendChild(buildTraplineStory(id, r.trapline));
        playBtn.hidden = true;
      });
      tsec.appendChild(playBtn);
      tsec.appendChild(storyHolder);
      body.appendChild(tsec);
    }

    if (r.precision) {
      var p = D.PRECISION[r.precision];
      var psec = el("section", "sec");
      psec.appendChild(el("h4", null, "Boundary precision"));
      var pp = el("p");
      pp.appendChild(el("strong", null, p.label + ". "));
      pp.appendChild(el("span", null, p.blurb));
      psec.appendChild(pp);
      if (r.precisionNote) psec.appendChild(el("p", null, r.precisionNote));
      body.appendChild(psec);
    }

    /* Skipped for protected/restricted records on purpose: pairing a real satellite image and a
       live map link with something meant to represent withheld or sacred content undercuts the
       point of withholding it, even though the record itself is synthetic. */
    if (r.category !== "protected") body.appendChild(realWorldBlock(id));

    var src = el("section", "source");
    src.appendChild(el("h4", null, "Source and verification"));
    var dl = el("dl");
    var rows = [["Status", null], ["Source", r.source]];
    if (r.verifiedBy) rows.push(["Verified by", r.verifiedBy]);
    rows.push(["Reviewer", r.reviewer]);
    if (r.corroboration) rows.push(["Corroboration", r.corroboration + " independent account" + (r.corroboration > 1 ? "s" : "")]);
    rows.push(["Last review", r.reviewed || "None yet"]);
    rows.push(["Note", r.note]);
    rows.forEach(function (row) {
      dl.appendChild(el("dt", null, row[0]));
      var dd = el("dd");
      if (row[1] === null) dd.appendChild(badge(r.verification));
      else dd.textContent = row[1];
      dl.appendChild(dd);
    });
    src.appendChild(dl);

    /* Elder confirmation: the brief and Katherine's feedback both centre verification on Elders
       actually confirming things, not just seeing more than everyone else. Before this, only
       Administrators could act on a record; Elders could view but never do anything. This makes
       confirming a real (if client-side only) action, visible to Elder and above, on any
       community-reported record they can already see. */
    if (r.verification === "community" && canSee("elder")) {
      var confirmBtn = el("button", "uploaddemo-btn primary", "Confirm this record (Elder review)");
      confirmBtn.type = "button";
      confirmBtn.style.marginTop = "10px";
      confirmBtn.addEventListener("click", function () {
        r.verification = "verified";
        r.verifiedBy = "An Elder (demo action)";
        r.reviewed = new Date().toISOString().slice(0, 10);
        refreshMapData();
        renderCard(id);
      });
      src.appendChild(confirmBtn);
    }

    body.appendChild(src);

    if (r.versions && r.versions.length && canSee("admin")) {
      var vsec = el("section", "sec");
      var vh = el("h4", null, "Version history ");
      vh.appendChild(el("span", "tierhint", "(" + D.TIER_INFO.admin.label + " and above)"));
      vsec.appendChild(vh);
      var vol = el("ol", "versions");
      r.versions.forEach(function (v) {
        var li = el("li");
        li.appendChild(el("strong", null, v.date + ". "));
        li.appendChild(el("span", null, v.change + (v.by ? " (" + v.by + ")" : "")));
        vol.appendChild(li);
      });
      vsec.appendChild(vol);
      body.appendChild(vsec);
    }

    if (r.pendingContributions && r.pendingContributions.length && canSee("admin")) {
      var pcsec = el("section", "sec");
      var pch = el("h4", null, "Pending contributions ");
      pch.appendChild(el("span", "tierhint", "(" + D.TIER_INFO.admin.label + " and above)"));
      pcsec.appendChild(pch);
      r.pendingContributions.forEach(function (pc) {
        var item = el("div", "uploaddemo");
        item.appendChild(el("p", null, (pc.title || "(untitled)") + " — " + pc.type));
        item.appendChild(el("p", "uploaddemo-caption", pc.text));
        if (pc.fileUrl) item.appendChild(mediaBlock({ type: pc.fileKind, caption: pc.fileName, url: pc.fileUrl }, id));
        item.appendChild(el("p", "uploaddemo-caption", "Suggested for: " + D.TIER_INFO[pc.suggestedTier].label + ". Submitted " + pc.submittedAt + "."));
        if (pc.submittedBy) item.appendChild(el("p", "uploaddemo-caption", "Submitter: " + pc.submittedBy));
        var pactions = el("div", "uploaddemo-actions");
        var acc = el("button", "uploaddemo-btn primary", "Accept"); acc.type = "button"; acc.disabled = true;
        var dec = el("button", "uploaddemo-btn", "Decline"); dec.type = "button"; dec.disabled = true;
        pactions.appendChild(acc); pactions.appendChild(dec);
        item.appendChild(pactions);
        item.appendChild(el("p", "uploaddemo-caption", "(Buttons are not active in the prototype.)"));
        pcsec.appendChild(item);
      });
      body.appendChild(pcsec);
    }

    /* "Attach to this place" -- for members and above, on records that already exist, as distinct
       from the standalone Contribute function which creates a brand-new point. Skipped for
       protected records for the same reason the real-world reference block is skipped above. */
    if (canSee("member") && r.category !== "protected") {
      var attachSec = el("section", "sec");
      var attachBtn = el("button", "contribute-btn", "+ Add a photo or memo to this place");
      attachBtn.type = "button";
      var attachHolder = el("div");
      attachBtn.addEventListener("click", function () {
        attachHolder.textContent = "";
        attachHolder.appendChild(buildAttachForm(id));
        attachBtn.hidden = true;
      });
      attachSec.appendChild(attachBtn);
      attachSec.appendChild(attachHolder);
      body.appendChild(attachSec);
    }

    c.appendChild(body);
    c.scrollTop = 0;
    // MapLibre resizes itself when the container changes size
  }

  /* ---------- wire up ---------- */
  function wire() {
    var itemsSec = document.createElement("section");
    itemsSec.appendChild(el("h2", null, "Items"));
    var ul = el("ul", "items");
    ul.id = "items";
    itemsSec.appendChild(ul);
    var roleSection = document.getElementById("roles").parentNode;
    roleSection.parentNode.insertBefore(itemsSec, roleSection.nextSibling);

    renderLegends();
    renderRoles();

    [["lyrPoints", "points"], ["lyrTrails", "trails"], ["lyrAreas", "areas"]].forEach(function (p) {
      document.getElementById(p[0]).addEventListener("change", function (e) {
        state.layers[p[1]] = e.target.checked;
        if (map && map.getLayer("points")) applyLayerVisibility();
      });
    });

    document.getElementById("panelToggle").addEventListener("click", function () {
      document.getElementById("panel").classList.toggle("open");
    });

    document.getElementById("bmMap").addEventListener("click", function () { setBasemap("map"); });
    document.getElementById("bmSat").addEventListener("click", function () { setBasemap("satellite"); });
    document.getElementById("terrain3dBtn").addEventListener("click", function () { setTerrain3D(!state.terrain3d); });

    document.getElementById("contributeBtn").addEventListener("click", openContributeForm);
    document.getElementById("bulkImportBtn").addEventListener("click", openBulkImportForm);

    var landingEl = document.getElementById("landing");
    var landingEnterBtns = document.querySelectorAll(".landing-enter");
    for (var le = 0; le < landingEnterBtns.length; le++) {
      landingEnterBtns[le].addEventListener("click", function () {
        /* Generic entry (not a specific role button): always leaves the full
           tier switcher unlocked, even if a previous visit had locked it. */
        state.roleLocked = false;
        renderRoles();
        landingEl.classList.add("hidden");
        if (map) map.resize();
      });
    }
    var landingScrollCue = document.getElementById("landingScrollCue");
    if (landingScrollCue) landingScrollCue.addEventListener("click", function () {
      var features = document.querySelector(".landing-features");
      if (features) features.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    var panelHomeBtn = document.getElementById("panelHomeBtn");
    if (panelHomeBtn) panelHomeBtn.addEventListener("click", goHome);

    /* "Jump straight in as" on the homepage: picks a role, locks this visit to just
       that tier (mirroring how a real signed-in account would only ever see its own
       access level), and enters the map in one click. "Change view" in the sidebar,
       or the Home button, comes back here to pick a different one. */
    var landingRolesWrap = document.getElementById("landingRoles");
    if (landingRolesWrap) {
      TIERS.forEach(function (t) {
        var b = el("button", "landing-role-btn", D.TIER_INFO[t].label);
        b.type = "button";
        b.dataset.role = t;
        b.addEventListener("click", function () {
          state.roleLocked = true;
          setRole(t);
          landingEl.classList.add("hidden");
          if (map) map.resize();
        });
        landingRolesWrap.appendChild(b);
      });
    }

    /* Reveal the three feature cards as they scroll into view, instead of
       them just sitting there already visible. Starts them hidden only once
       we know the observer will actually run, so a browser without
       IntersectionObserver still shows them normally. */
    var featureCards = document.querySelectorAll(".landing-feature");
    if (featureCards.length && "IntersectionObserver" in window) {
      featureCards.forEach(function (card) { card.classList.add("landing-feature--pre"); });
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("landing-feature--pre");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      featureCards.forEach(function (card) { revealObserver.observe(card); });
    }

    pickStyle().then(initMap);
  }

  wire();
  window.__wayback = { state: state, setRole: setRole, openRecord: openRecord, getMap: function () { return map; } };
})();
