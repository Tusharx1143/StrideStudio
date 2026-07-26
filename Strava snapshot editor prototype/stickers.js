/* StrideStudio — sticker registry.
   Data → layout renderers, mirroring lib/dynamic-templates.tsx from the repo
   (each sticker is a pure function of activity + totals + palette).
   Loaded via <helmet><script src="stickers.js"> and read off window. */
(function () {
  const FONT_UI = "'Archivo', system-ui, sans-serif";
  const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
  const FONT_SERIF = "'Instrument Serif', Georgia, serif";

  // ── formatting ──────────────────────────────────────────────
  const pad = (n) => String(n).padStart(2, "0");
  const NS = "Not specified";

  function dur(sec) {
    if (sec == null) return NS;
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  function durWords(sec) {
    if (sec == null) return NS;
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h > 0 ? `${h}H ${pad(m)}M` : `${m} MIN`;
  }
  function dist(a, u) {
    if (a.distanceKm == null) return NS;
    return u === "imperial" ? (a.distanceKm * 0.621371).toFixed(2) : a.distanceKm.toFixed(2);
  }
  const distUnit = (u) => (u === "imperial" ? "MILES" : "KILOMETERS");
  const distUnitShort = (u) => (u === "imperial" ? "mi" : "km");
  function pace(a, u) {
    if (a.paceSecPerKm == null) return "--:--";
    const p = u === "imperial" ? a.paceSecPerKm / 0.621371 : a.paceSecPerKm;
    return `${Math.floor(p / 60)}:${pad(Math.round(p % 60))}`;
  }
  const paceUnit = (u) => (u === "imperial" ? "MIN / MI" : "MIN / KM");
  function speed(a, u) {
    if (a.speedKmh == null) return NS;
    return u === "imperial" ? (a.speedKmh * 0.621371).toFixed(1) : a.speedKmh.toFixed(1);
  }
  const speedUnit = (u) => (u === "imperial" ? "MPH" : "KM/H");
  function elev(a, u) {
    if (a.elevM == null) return NS;
    return u === "imperial" ? Math.round(a.elevM * 3.28084) : a.elevM;
  }
  const elevUnit = (u) => (u === "imperial" ? "FEET" : "METERS");

  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const MONTHS_LONG = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const d = (iso) => new Date(iso);
  const dateShort = (a) => (a.dateISO ? `${MONTHS[d(a.dateISO).getMonth()]} ${d(a.dateISO).getDate()}` : NS);
  const dateFull = (a) => (a.dateISO ? `${MONTHS_LONG[d(a.dateISO).getMonth()]} ${d(a.dateISO).getDate()}, ${d(a.dateISO).getFullYear()}` : NS);
  const weekday = (a) => (a.dateISO ? DAYS[d(a.dateISO).getDay()] : NS);
  const time12 = (a) => {
    if (!a.dateISO) return NS;
    const x = d(a.dateISO), h = x.getHours();
    return `${h % 12 || 12}:${pad(x.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
  };
  const typeLabel = (a) => (a.type || "activity").toUpperCase();

  /** Salience-ranked available fields — the adaptive core (see repo analyseFields) */
  function fields(a, u) {
    const out = [];
    if (a.distanceKm != null) out.push({ k: "distance", label: "DISTANCE", v: dist(a, u), unit: distUnitShort(u), s: 0.8 });
    if (a.movingSec != null) out.push({ k: "duration", label: "MOVING TIME", v: dur(a.movingSec), unit: "", s: 0.6 });
    if (a.paceSecPerKm != null) out.push({ k: "pace", label: "PACE", v: pace(a, u), unit: u === "imperial" ? "/mi" : "/km", s: 0.75 });
    if (a.speedKmh != null && a.type === "ride") out.push({ k: "speed", label: "AVG SPEED", v: speed(a, u), unit: speedUnit(u).toLowerCase(), s: 0.7 });
    if (a.elevM != null) out.push({ k: "elev", label: "ELEV GAIN", v: String(elev(a, u)), unit: u === "imperial" ? "ft" : "m", s: Math.min(1, a.elevM / 500) });
    if (a.hrAvg != null) out.push({ k: "hr", label: "AVG HR", v: String(a.hrAvg), unit: "bpm", s: Math.min(1, (a.hrAvg - 80) / 100) });
    if (a.calories != null) out.push({ k: "cal", label: "CALORIES", v: String(a.calories), unit: "cal", s: Math.min(1, a.calories / 1000) });
    if (a.cadence != null) out.push({ k: "cad", label: "CADENCE", v: String(a.cadence), unit: "spm", s: 0.4 });
    if (a.powerW != null) out.push({ k: "pwr", label: "AVG POWER", v: String(a.powerW), unit: "w", s: 0.65 });
    return out.sort((x, y) => y.s - x.s);
  }

  window.StrideStickers = function (React) {
    const E = React.createElement;
    let key = 0;
    const B = (style, ...kids) => E("div", { key: key++, style }, ...kids.filter(Boolean));
    const T = (style, text) => E("div", { key: key++, style }, text);
    const col = (gap, style) => ({ display: "flex", flexDirection: "column", gap, ...style });
    const row = (gap, style) => ({ display: "flex", alignItems: "center", gap, ...style });

    // shared type styles
    const label = (c, size = 9, extra) => ({
      font: `700 ${size}px/1.1 ${FONT_UI}`, letterSpacing: "0.16em",
      color: c.sub, textTransform: "uppercase", ...extra,
    });
    const huge = (c, size = 64, extra) => ({
      font: `900 ${size}px/0.86 ${FONT_UI}`, letterSpacing: "-0.03em", color: c.ink,
      textShadow: "0 2px 14px rgba(0,0,0,0.45)", ...extra,
    });
    const monoTxt = (c, size = 12, extra) => ({
      font: `500 ${size}px/1.35 ${FONT_MONO}`, letterSpacing: "0.04em", color: c.ink, ...extra,
    });

    // ── chart primitives (data-driven, no hand-drawn art) ──
    function bars(values, c, { w = 200, h = 54, gap = 3, accentIdx = -1 } = {}) {
      const max = Math.max.apply(null, values.concat([1]));
      const bw = (w - gap * (values.length - 1)) / values.length;
      return B({ display: "flex", alignItems: "flex-end", gap, height: h, width: w },
        ...values.map((v, i) => B({
          width: bw, height: Math.max(3, (v / max) * h), borderRadius: 2,
          background: i === accentIdx ? c.accent : c.ink, opacity: i === accentIdx ? 1 : 0.55,
        })));
    }
    function spark(values, c, { w = 210, h = 52, stroke = 2, fill = false } = {}) {
      const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
      const rng = max - min || 1;
      const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / rng) * (h - stroke * 2) - stroke]);
      const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      return E("svg", { key: key++, width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: { display: "block", overflow: "visible" } },
        fill ? E("polygon", { key: "f", points: `0,${h} ${line} ${w},${h}`, fill: c.accent, opacity: 0.18 }) : null,
        E("polyline", { key: "l", points: line, fill: "none", stroke: c.accent, strokeWidth: stroke, strokeLinejoin: "round", strokeLinecap: "round" }));
    }
    function routeLine(coords, c, { w = 190, h = 130, stroke = 2.5 } = {}) {
      const xs = coords.map((p) => p[0]), ys = coords.map((p) => p[1]);
      const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
      const sx = (maxX - minX) || 1, sy = (maxY - minY) || 1;
      const s = Math.min((w - 8) / sx, (h - 8) / sy);
      const pts = coords.map((p) => `${(4 + (p[0] - minX) * s).toFixed(1)},${(h - 4 - (p[1] - minY) * s).toFixed(1)}`).join(" ");
      return E("svg", { key: key++, width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: { display: "block" } },
        E("polyline", { key: "u", points: pts, fill: "none", stroke: c.ink, opacity: 0.28, strokeWidth: stroke + 3, strokeLinejoin: "round", strokeLinecap: "round" }),
        E("polyline", { key: "l", points: pts, fill: "none", stroke: c.accent, strokeWidth: stroke, strokeLinejoin: "round", strokeLinecap: "round" }));
    }

    // theme shells
    const glassBox = (c, style) => ({
      background: "rgba(16,16,18,0.42)", backdropFilter: "blur(18px) saturate(1.3)",
      WebkitBackdropFilter: "blur(18px) saturate(1.3)", border: `1px solid ${c.hair}`,
      borderRadius: 20, padding: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.35)", ...style,
    });
    const termBox = (c, style) => ({
      background: "rgba(0,0,0,0.55)", border: `1px solid ${c.accent}`, borderRadius: 4,
      padding: "10px 12px", ...style,
    });
    const ledTxt = (c, size, extra) => ({
      font: `700 ${size}px/1 ${FONT_MONO}`, letterSpacing: "0.06em", color: c.accent,
      textShadow: `0 0 12px ${c.accent}, 0 0 34px ${c.accent}66`, ...extra,
    });
    const tapeBox = (style) => ({
      background: "#F4F1E8", color: "#141414", borderRadius: 2, padding: 14,
      boxShadow: "0 10px 26px rgba(0,0,0,0.45)", ...style,
    });
    const tapeStrip = (rot, style) => ({
      position: "absolute", width: 54, height: 18, background: "rgba(255,255,255,0.42)",
      backdropFilter: "blur(2px)", transform: `rotate(${rot}deg)`, ...style,
    });

    const S = [];
    const mk = (id, name, cat, theme, w, render) => S.push({ id, name, cat, theme, w, render });

    // ─────────────── LED / DOT MATRIX ───────────────
    mk("led-distance", "LED Distance", "distance", "led", 210, ({ a, u, c }) =>
      B(col(4, { alignItems: "center" }),
        T(label(c, 8, { color: c.accent, opacity: 0.8 }), "DISTANCE"),
        T(ledTxt(c, 54), dist(a, u)),
        T(label(c, 9, { color: c.accent, opacity: 0.7 }), distUnit(u))));

    mk("led-pace", "LED Pace", "pace", "led", 180, ({ a, u, c }) =>
      B(col(3, { alignItems: "center" }),
        T(ledTxt(c, 44), pace(a, u)),
        T(label(c, 8, { color: c.accent, opacity: 0.75 }), paceUnit(u))));

    mk("led-time", "LED Clock", "time", "led", 220, ({ a, c }) =>
      B(col(3, { alignItems: "center" }),
        T(ledTxt(c, 46), dur(a.movingSec)),
        T(label(c, 8, { color: c.accent, opacity: 0.75 }), "MOVING TIME")));

    mk("led-splits", "LED Split Board", "splits", "led", 230, ({ a, c }) =>
      B(col(5, { padding: 12, border: `1px solid ${c.accent}55`, borderRadius: 6, background: "rgba(0,0,0,0.5)" }),
        T(label(c, 8, { color: c.accent }), "SPLITS"),
        ...a.splits.slice(0, 5).map((s) => B(row(8, { justifyContent: "space-between" }),
          T(ledTxt(c, 13, { opacity: 0.75 }), `KM ${pad(s.km)}`),
          T(ledTxt(c, 15), dur(s.sec))))));

    mk("led-week", "LED Week Total", "totals", "led", 210, ({ t, u, c }) =>
      B(col(2, { alignItems: "center" }),
        T(label(c, 8, { color: c.accent, opacity: 0.8 }), "THIS WEEK"),
        T(ledTxt(c, 50), u === "imperial" ? (t.totalKm * 0.621371).toFixed(1) : t.totalKm.toFixed(1)),
        T(label(c, 8, { color: c.accent, opacity: 0.7 }), `${distUnit(u)} · ${t.count} ACTIVITIES`)));

    // ─────────────── MINIMAL MONO (white on photo) ───────────────
    mk("mono-stack", "Mono Stack", "multi", "mono", 200, ({ a, u, c }) =>
      B(col(10), ...fields(a, u).slice(0, 3).map((f, i) =>
        B(col(1), T(label(c, 8), f.label),
          T(huge(c, i === 0 ? 42 : 26), `${f.v}${f.unit ? " " + f.unit : ""}`)))));

    mk("mono-single", "Mono Distance", "distance", "mono", 190, ({ a, u, c }) =>
      B(col(2), T(huge(c, 62), dist(a, u)), T(label(c, 10), distUnit(u))));

    mk("mono-corner", "Mono Corner Set", "multi", "mono", 240, ({ a, u, c }) => {
      const f = fields(a, u).slice(0, 4);
      return B({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 22px" },
        ...f.map((x) => B(col(1), T(label(c, 7.5), x.label), T(huge(c, 22, { letterSpacing: "-0.02em" }), x.v))));
    });

    mk("mono-line", "Mono Rule Line", "multi", "mono", 250, ({ a, u, c }) =>
      B(col(0, { borderTop: `1.5px solid ${c.ink}`, borderBottom: `1.5px solid ${c.ink}`, padding: "8px 0" }),
        B(row(14, { justifyContent: "space-between" }),
          ...fields(a, u).slice(0, 3).map((f) =>
            B(col(1), T(label(c, 7), f.label), T(monoTxt(c, 15, { fontWeight: 700 }), f.v))))));

    mk("mono-date", "Mono Date Caps", "date", "mono", 230, ({ a, c }) =>
      B(col(3), T(huge(c, 30), weekday(a)), T(label(c, 9, { letterSpacing: "0.3em" }), `${dateShort(a)} · ${time12(a)}`)));

    mk("mono-pace-time", "Mono Pace / Time", "pace", "mono", 220, ({ a, u, c }) =>
      B(row(18, { alignItems: "flex-end" }),
        B(col(1), T(label(c, 8), "PACE"), T(huge(c, 36), pace(a, u))),
        B({ width: 1, height: 40, background: c.hair }),
        B(col(1), T(label(c, 8), "TIME"), T(huge(c, 36), dur(a.movingSec)))));

    // ─────────────── TERMINAL / MONOSPACE READOUT ───────────────
    mk("term-readout", "Terminal Readout", "multi", "terminal", 250, ({ a, u, c }) =>
      B(termBox(c, col(3)),
        T(monoTxt(c, 9, { color: c.accent }), `> ${typeLabel(a)} ${dateShort(a)}`),
        ...fields(a, u).slice(0, 5).map((f) => B(row(6, { justifyContent: "space-between" }),
          T(monoTxt(c, 10, { opacity: 0.6 }), f.label),
          T(monoTxt(c, 12, { fontWeight: 700 }), `${f.v}${f.unit ? " " + f.unit : ""}`))),
        T(monoTxt(c, 8, { color: c.accent, opacity: 0.7 }), "SYS:ONLINE ▍")));

    mk("term-log", "System Log", "multi", "terminal", 260, ({ a, u, c }) =>
      B(termBox(c, col(2, { borderColor: c.hair })),
        ...[`[00:00] START ${a.locationName || NS}`,
          `[--:--] DIST ${dist(a, u)} ${distUnitShort(u)}`,
          `[--:--] PACE ${pace(a, u)}`,
          `[--:--] HR ${a.hrAvg != null ? a.hrAvg + " AVG / " + a.hrMax + " MAX" : NS}`,
          `[${dur(a.movingSec)}] END`].map((l) => T(monoTxt(c, 9.5, { opacity: 0.85 }), l))));

    mk("term-splits", "Split Table", "splits", "terminal", 240, ({ a, u, c }) =>
      B(termBox(c, col(0, { borderColor: c.hair })),
        B(row(0, { justifyContent: "space-between", borderBottom: `1px solid ${c.hair}`, paddingBottom: 4 }),
          T(monoTxt(c, 8, { color: c.accent }), u === "imperial" ? "MI" : "KM"),
          T(monoTxt(c, 8, { color: c.accent }), "TIME"), T(monoTxt(c, 8, { color: c.accent }), "HR")),
        ...a.splits.slice(0, 6).map((s) => B(row(0, { justifyContent: "space-between", paddingTop: 3 }),
          T(monoTxt(c, 10, { opacity: 0.6 }), pad(s.km)),
          T(monoTxt(c, 11, { fontWeight: 700 }), dur(s.sec)),
          T(monoTxt(c, 10, { opacity: 0.6 }), String(s.hr))))));

    mk("term-gear", "Gear Tag", "gear", "terminal", 200, ({ a, c }) =>
      B(termBox(c, col(2, { borderColor: c.hair })),
        T(monoTxt(c, 8, { color: c.accent }), "GEAR"),
        T(monoTxt(c, 12, { fontWeight: 700 }), a.gear || NS),
        T(monoTxt(c, 8, { opacity: 0.6 }), a.gearKm != null ? `${a.gearKm} km logged` : NS)));

    mk("term-weather", "Weather Strip", "weather", "terminal", 230, ({ a, c }) =>
      B(termBox(c, row(10, { borderColor: c.hair })),
        T(monoTxt(c, 22, { fontWeight: 700 }), a.weather ? `${a.weather.tempC}°` : "--"),
        B(col(1), T(monoTxt(c, 9, { opacity: 0.7 }), a.weather ? a.weather.cond.toUpperCase() : NS),
          T(monoTxt(c, 9, { opacity: 0.7 }), a.weather ? `WIND ${a.weather.windKmh} KM/H` : ""))));

    // ─────────────── GLASSMORPHIC ───────────────
    mk("glass-summary", "Glass Summary", "multi", "glass", 260, ({ a, u, c }) =>
      B(glassBox(c, col(12)),
        B(row(8), B({ width: 6, height: 6, borderRadius: 3, background: c.accent }),
          T(label(c, 8), `${typeLabel(a)} · ${dateShort(a)}`)),
        T(huge(c, 44), `${dist(a, u)}`),
        B(row(16), ...fields(a, u).filter((f) => f.k !== "distance").slice(0, 3).map((f) =>
          B(col(1), T(label(c, 7), f.label), T(monoTxt(c, 13, { fontWeight: 700 }), f.v))))));

    mk("glass-pills", "Glass Pill Row", "multi", "glass", 270, ({ a, u, c }) =>
      B({ display: "flex", flexWrap: "wrap", gap: 6 },
        ...fields(a, u).slice(0, 4).map((f) => B(glassBox(c, row(6, { borderRadius: 999, padding: "7px 12px" })),
          T(label(c, 7), f.label), T(monoTxt(c, 12, { fontWeight: 700 }), f.v)))));

    mk("glass-hr", "Glass Heart Rate", "hr", "glass", 250, ({ a, c }) =>
      B(glassBox(c, col(8)),
        B(row(8, { justifyContent: "space-between" }), T(label(c, 8), "HEART RATE"),
          T(monoTxt(c, 10, { color: c.accent }), a.hrMax != null ? `MAX ${a.hrMax}` : NS)),
        a.hrSeries ? spark(a.hrSeries, c, { w: 218, h: 46, fill: true }) : T(monoTxt(c, 11), NS),
        B(row(6, { alignItems: "baseline" }), T(huge(c, 30), a.hrAvg != null ? String(a.hrAvg) : "--"),
          T(label(c, 8), "BPM AVG"))));

    mk("glass-route", "Glass Route Card", "route", "glass", 230, ({ a, u, c }) =>
      B(glassBox(c, col(8)),
        a.coords ? routeLine(a.coords, c, { w: 198, h: 118 }) : T(monoTxt(c, 11), NS),
        B(row(10, { justifyContent: "space-between" }),
          B(col(1), T(label(c, 7), "DISTANCE"), T(monoTxt(c, 13, { fontWeight: 700 }), dist(a, u))),
          B(col(1), T(label(c, 7), "ELEV"), T(monoTxt(c, 13, { fontWeight: 700 }), String(elev(a, u)))))));

    mk("glass-pr", "Glass Personal Best", "achievement", "glass", 240, ({ a, c }) =>
      B(glassBox(c, col(6, { borderColor: c.accent + "88" })),
        T(label(c, 8, { color: c.accent }), "PERSONAL RECORD"),
        T(huge(c, 26), a.prs && a.prs[0] ? a.prs[0].label : NS),
        T(monoTxt(c, 12, { fontWeight: 700 }), a.prs && a.prs[0] ? a.prs[0].value : "")));

    mk("glass-elev", "Glass Elevation", "elev", "glass", 250, ({ a, u, c }) =>
      B(glassBox(c, col(8)),
        T(label(c, 8), "ELEVATION PROFILE"),
        a.elevSeries ? spark(a.elevSeries, c, { w: 218, h: 44, fill: true }) : T(monoTxt(c, 11), NS),
        B(row(6, { alignItems: "baseline" }), T(huge(c, 28), String(elev(a, u))), T(label(c, 8), elevUnit(u)))));

    // ─────────────── CHART-DRIVEN ───────────────
    mk("chart-splits", "Split Bars", "splits", "chart", 250, ({ a, c }) => {
      const best = a.splits.reduce((b, s, i) => (s.sec < a.splits[b].sec ? i : b), 0);
      return B(col(8),
        B(row(8, { justifyContent: "space-between" }), T(label(c, 8), "SPLITS"),
          T(monoTxt(c, 9, { color: c.accent }), `BEST ${dur(a.splits[best].sec)}`)),
        bars(a.splits.map((s) => 1 / s.sec), c, { w: 226, h: 58, accentIdx: best }),
        B(row(0, { justifyContent: "space-between" }), T(monoTxt(c, 8, { opacity: 0.55 }), "1"),
          T(monoTxt(c, 8, { opacity: 0.55 }), String(a.splits.length))));
    });

    mk("chart-hr", "HR Graph", "hr", "chart", 250, ({ a, c }) =>
      B(col(6), T(label(c, 8), "HEART RATE"),
        a.hrSeries ? spark(a.hrSeries, c, { w: 230, h: 60, fill: true }) : T(monoTxt(c, 11), NS),
        B(row(12), T(monoTxt(c, 11, { fontWeight: 700 }), `AVG ${a.hrAvg != null ? a.hrAvg : "--"}`),
          T(monoTxt(c, 11, { opacity: 0.6 }), `MAX ${a.hrMax != null ? a.hrMax : "--"}`))));

    mk("chart-elev", "Elevation Profile", "elev", "chart", 250, ({ a, u, c }) =>
      B(col(6), B(row(8, { justifyContent: "space-between" }), T(label(c, 8), "ELEVATION"),
        T(monoTxt(c, 10, { color: c.accent }), `+${elev(a, u)} ${u === "imperial" ? "ft" : "m"}`)),
        a.elevSeries ? spark(a.elevSeries, c, { w: 230, h: 56, fill: true }) : T(monoTxt(c, 11), NS)));

    mk("chart-route", "Route Line", "route", "chart", 210, ({ a, u, c }) =>
      B(col(6), a.coords ? routeLine(a.coords, c, { w: 198, h: 140 }) : T(monoTxt(c, 11), NS),
        B(row(10), T(monoTxt(c, 11, { fontWeight: 700 }), `${dist(a, u)} ${distUnitShort(u)}`),
          T(monoTxt(c, 10, { opacity: 0.6 }), a.locationName || NS))));

    mk("chart-week", "Week Bars", "totals", "chart", 250, ({ t, u, c }) =>
      B(col(8), T(label(c, 8), "LAST 7 DAYS"),
        bars(t.days.map((x) => x.km), c, { w: 226, h: 54, accentIdx: t.days.reduce((b, x, i) => (x.km > t.days[b].km ? i : b), 0) }),
        B(row(0, { justifyContent: "space-between" }), ...t.days.map((x) => T(monoTxt(c, 7.5, { opacity: 0.5, width: 30, textAlign: "center" }), x.day))),
        T(monoTxt(c, 11, { fontWeight: 700 }), `${u === "imperial" ? (t.totalKm * 0.621371).toFixed(1) : t.totalKm.toFixed(1)} ${distUnitShort(u)} TOTAL`)));

    mk("chart-zones", "HR Zones", "hr", "chart", 240, ({ a, c }) =>
      B(col(6), T(label(c, 8), "TIME IN ZONE"),
        ...(a.zones || []).map((z) => B(row(8),
          T(monoTxt(c, 9, { width: 22, opacity: 0.6 }), z.name),
          B({ flex: 1, height: 8, background: c.hair, borderRadius: 4, overflow: "hidden" },
            B({ width: `${z.pct}%`, height: "100%", background: c.accent, opacity: 0.4 + z.pct / 200 })),
          T(monoTxt(c, 9, { width: 30, textAlign: "right" }), `${z.pct}%`)))));

    // ─────────────── BOLD POSTER ───────────────
    mk("poster-distance", "Poster Distance", "distance", "poster", 260, ({ a, u, c }) =>
      B(col(-4), T(huge(c, 96, { letterSpacing: "-0.05em" }), dist(a, u)),
        T(label(c, 13, { letterSpacing: "0.42em", color: c.ink }), distUnitShort(u).toUpperCase())));

    mk("poster-verb", "Poster Verb", "multi", "poster", 240, ({ a, u, c }) =>
      B(col(-6), T(huge(c, 52), a.type === "ride" ? "RODE" : a.type === "run" ? "RAN" : "TRAINED"),
        T(huge(c, 52, { color: c.accent }), `${dist(a, u)}${distUnitShort(u)}`),
        T(label(c, 9, { marginTop: 8 }), `${weekday(a)} · ${dur(a.movingSec)}`)));

    mk("poster-numbers", "Poster Numbers", "multi", "poster", 270, ({ a, u, c }) => {
      const f = fields(a, u).slice(0, 3);
      return B(col(6), ...f.map((x, i) => B(row(8, { alignItems: "baseline", borderBottom: i < 2 ? `1px solid ${c.hair}` : "none", paddingBottom: 6 }),
        T(huge(c, i === 0 ? 46 : 30, i === 0 ? { color: c.accent } : null), x.v),
        T(label(c, 8), `${x.unit} ${x.label}`))));
    });

    mk("poster-vertical", "Poster Vertical", "distance", "poster", 120, ({ a, u, c }) =>
      B(col(4, { alignItems: "center" }),
        T(huge(c, 58), dist(a, u).split(".")[0]),
        T(huge(c, 26, { color: c.accent }), `.${dist(a, u).split(".")[1] || "00"}`),
        T(label(c, 9, { writingMode: "vertical-rl", letterSpacing: "0.3em", marginTop: 4 }), distUnit(u))));

    mk("poster-block", "Poster Block", "multi", "poster", 250, ({ a, u, c }) =>
      B({ display: "flex" }, ...fields(a, u).slice(0, 3).map((f, i) =>
        B(col(2, { flex: 1, background: i === 0 ? c.accent : "rgba(0,0,0,0.55)", padding: "12px 10px" }),
          T(label(c, 7, { color: i === 0 ? "#0B0B0C" : c.sub }), f.label),
          T(huge(c, 22, { color: i === 0 ? "#0B0B0C" : c.ink, textShadow: "none" }), f.v)))));

    mk("poster-outline", "Poster Outline", "distance", "poster", 250, ({ a, u, c }) =>
      B(col(0), T({
        font: `900 78px/0.86 ${FONT_UI}`, letterSpacing: "-0.04em", color: "transparent",
        WebkitTextStroke: `2px ${c.ink}`,
      }, dist(a, u)), T(label(c, 10, { letterSpacing: "0.34em" }), `${distUnit(u)} · ${dateShort(a)}`)));

    // ─────────────── TAPE / CUTOUT ───────────────
    mk("tape-note", "Taped Note", "multi", "tape", 220, ({ a, u, c }) =>
      B({ position: "relative", transform: "rotate(-2.5deg)" },
        B(tapeStrip(-8, { top: -8, left: 18 })), B(tapeStrip(6, { top: -8, right: 18 })),
        B(tapeBox(col(6)),
          T({ font: `700 9px/1 ${FONT_MONO}`, letterSpacing: "0.2em", color: "#8A8578" }, dateShort(a)),
          T({ font: `900 34px/0.9 ${FONT_UI}`, letterSpacing: "-0.02em" }, `${dist(a, u)} ${distUnitShort(u)}`),
          T({ font: `500 11px/1.4 ${FONT_MONO}`, color: "#3A362E" }, `${dur(a.movingSec)} · ${pace(a, u)}${u === "imperial" ? "/mi" : "/km"}`))));

    mk("tape-polaroid", "Polaroid Stat", "multi", "tape", 200, ({ a, u, c }) =>
      B({ transform: "rotate(2deg)", background: "#FBFAF6", padding: "10px 10px 26px", boxShadow: "0 14px 34px rgba(0,0,0,0.45)" },
        B({ height: 120, background: "linear-gradient(150deg,#2B2B30,#5A4032 60%,#C4643A)", position: "relative" },
          B({ position: "absolute", bottom: 8, left: 10, font: `900 30px/1 ${FONT_UI}`, color: "#fff" }, `${dist(a, u)}${distUnitShort(u)}`)),
        T({ font: `500 10px/1 ${FONT_MONO}`, color: "#2A2724", marginTop: 10 }, `${dateFull(a)} · ${dur(a.movingSec)}`)));

    mk("tape-badge", "Cutout Badge", "achievement", "tape", 170, ({ a, c }) =>
      B({ transform: "rotate(-4deg)", background: c.accent, color: "#0B0B0C", padding: "12px 16px", borderRadius: 2, boxShadow: "0 10px 26px rgba(0,0,0,0.4)" },
        T({ font: `700 8px/1 ${FONT_MONO}`, letterSpacing: "0.24em" }, "ACHIEVEMENT"),
        T({ font: `900 24px/1 ${FONT_UI}`, marginTop: 4 }, a.achievements != null ? `${a.achievements}× PR` : NS)));

    mk("tape-ticket", "Ticket Stub", "date", "tape", 250, ({ a, u, c }) =>
      B({ display: "flex", background: "#F4F1E8", color: "#141414", transform: "rotate(1.5deg)", boxShadow: "0 10px 26px rgba(0,0,0,0.4)" },
        B(col(2, { padding: "10px 12px", flex: 1 }),
          T({ font: `700 8px/1 ${FONT_MONO}`, letterSpacing: "0.2em", color: "#8A8578" }, "STRIDESTUDIO"),
          T({ font: `900 20px/1 ${FONT_UI}` }, a.title || NS),
          T({ font: `500 10px/1 ${FONT_MONO}` }, `${dateShort(a)} · ${time12(a)}`)),
        B(col(2, { padding: "10px 12px", borderLeft: "1.5px dashed #C9C4B4", alignItems: "center", justifyContent: "center" }),
          T({ font: `900 22px/1 ${FONT_UI}` }, dist(a, u)),
          T({ font: `700 7px/1 ${FONT_MONO}`, letterSpacing: "0.16em" }, distUnitShort(u).toUpperCase()))));

    // ─────────────── EDITORIAL SERIF ───────────────
    mk("serif-editorial", "Editorial Hero", "multi", "serif", 260, ({ a, u, c }) =>
      B(col(6), T(label(c, 8, { letterSpacing: "0.3em" }), dateFull(a)),
        T({ font: `400 46px/0.95 ${FONT_SERIF}`, color: c.ink }, `${dist(a, u)} ${distUnitShort(u)}`),
        B({ height: 1, background: c.hair }),
        B(row(14), ...fields(a, u).slice(1, 4).map((f) =>
          B(col(1), T(label(c, 7), f.label), T({ font: `400 15px/1 ${FONT_SERIF}`, color: c.ink }, f.v))))));

    mk("serif-quote", "Serif Quote", "multi", "serif", 250, ({ a, c }) =>
      B(col(8), T({ font: `400 26px/1.15 ${FONT_SERIF}`, fontStyle: "italic", color: c.ink }, `“${a.title || NS}”`),
        T(label(c, 8), `${weekday(a)} · ${dur(a.movingSec)}`)));

    mk("serif-masthead", "Masthead", "date", "serif", 270, ({ a, u, c }) =>
      B(col(2, { borderTop: `2px solid ${c.ink}`, borderBottom: `2px solid ${c.ink}`, padding: "8px 0" }),
        T({ font: `400 30px/1 ${FONT_SERIF}`, color: c.ink, textAlign: "center" }, "THE DAILY MILE"),
        T(label(c, 7, { textAlign: "center", letterSpacing: "0.28em" }), `${dateFull(a)} · ${dist(a, u)} ${distUnitShort(u)}`)));

    mk("serif-pair", "Serif Stat Pair", "multi", "serif", 230, ({ a, u, c }) =>
      B(row(20, { alignItems: "flex-end" }),
        B(col(0), T({ font: `400 40px/1 ${FONT_SERIF}`, color: c.ink }, dist(a, u)), T(label(c, 7), distUnit(u))),
        B(col(0), T({ font: `400 40px/1 ${FONT_SERIF}`, color: c.accent }, pace(a, u)), T(label(c, 7), paceUnit(u)))));

    mk("serif-pr", "Serif Record", "achievement", "serif", 240, ({ a, c }) =>
      B(col(4), T(label(c, 8, { color: c.accent, letterSpacing: "0.28em" }), "NEW RECORD"),
        T({ font: `400 28px/1.05 ${FONT_SERIF}`, color: c.ink }, a.prs && a.prs[0] ? a.prs[0].label : NS),
        T({ font: `400 18px/1 ${FONT_SERIF}`, fontStyle: "italic", color: c.sub }, a.prs && a.prs[0] ? a.prs[0].value : "")));

    mk("serif-caption", "Serif Caption", "date", "serif", 220, ({ a, c }) =>
      B(col(2), T({ font: `400 20px/1.2 ${FONT_SERIF}`, fontStyle: "italic", color: c.ink }, a.locationName || NS),
        T(label(c, 7.5, { letterSpacing: "0.24em" }), `${weekday(a)} ${time12(a)}`)));

    mk("serif-index", "Serif Index", "multi", "serif", 250, ({ a, u, c }) =>
      B(col(0), ...fields(a, u).slice(0, 5).map((f, i) =>
        B(row(8, { justifyContent: "space-between", borderBottom: `1px solid ${c.hair}`, padding: "5px 0" }),
          T(label(c, 7.5), f.label),
          T({ font: `400 16px/1 ${FONT_SERIF}`, color: i === 0 ? c.accent : c.ink }, `${f.v} ${f.unit}`)))));

    // ─────────────── extra adaptive/auto ───────────────
    mk("auto-adapt", "Auto Adapt", "multi", "mono", 260, ({ a, u, c }) => {
      const f = fields(a, u);
      return B(col(8), B(row(8), T(label(c, 8, { color: c.accent }), typeLabel(a)), T(label(c, 8), dateShort(a))),
        T(huge(c, 40), `${f[0].v} ${f[0].unit}`),
        B({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
          ...f.slice(1, 7).map((x) => B(col(0), T(label(c, 6.5), x.label), T(monoTxt(c, 12, { fontWeight: 700 }), x.v)))));
    });

    mk("smart-hero", "Smart Hero", "multi", "mono", 220, ({ a, u, c }) => {
      const f = fields(a, u);
      return B(col(6, { alignItems: "center" }), T(label(c, 8), f[0].label),
        T(huge(c, 46, { color: c.accent }), f[0].v),
        B(row(14), ...f.slice(1, 3).map((x) => B(col(0, { alignItems: "center" }),
          T(label(c, 6.5), x.label), T(monoTxt(c, 11, { fontWeight: 700 }), x.v)))));
    });

    mk("grid-2x2", "2×2 Grid", "multi", "glass", 230, ({ a, u, c }) =>
      B({ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${c.hair}` },
        ...fields(a, u).slice(0, 4).map((f, i) => B(col(1, {
          padding: 12, borderRight: i % 2 === 0 ? `1px solid ${c.hair}` : "none",
          borderBottom: i < 2 ? `1px solid ${c.hair}` : "none",
        }), T(label(c, 7), f.label), T(huge(c, 20, { color: i === 0 ? c.accent : c.ink }), f.v)))));

    mk("streak-badge", "Streak", "achievement", "poster", 190, ({ t, c }) =>
      B(row(10, { background: "rgba(0,0,0,0.55)", border: `1px solid ${c.accent}`, borderRadius: 999, padding: "8px 14px" }),
        T(huge(c, 24, { color: c.accent }), String(t.streak)),
        B(col(0), T(label(c, 7), "WEEK STREAK"), T(monoTxt(c, 9, { opacity: 0.6 }), `${t.count} ACTIVITIES`))));

    mk("week-table", "Week Table", "totals", "terminal", 250, ({ t, u, c }) =>
      B(termBox(c, col(0, { borderColor: c.hair })),
        T(monoTxt(c, 8, { color: c.accent, marginBottom: 4 }), "WEEKLY TOTALS"),
        ...t.days.map((x) => B(row(8, { justifyContent: "space-between", padding: "2px 0" }),
          T(monoTxt(c, 9.5, { opacity: 0.6 }), x.day),
          T(monoTxt(c, 10, { fontWeight: 700 }), x.km ? `${u === "imperial" ? (x.km * 0.621371).toFixed(1) : x.km.toFixed(1)} ${distUnitShort(u)}` : "REST")))));

    mk("month-recap", "Month Recap", "totals", "poster", 250, ({ t, u, c }) =>
      B(col(2), T(label(c, 8, { letterSpacing: "0.3em" }), "MONTH RECAP"),
        T(huge(c, 54), u === "imperial" ? (t.monthKm * 0.621371).toFixed(0) : t.monthKm.toFixed(0)),
        T(label(c, 9, { color: c.accent }), `${distUnit(u)} · ${t.monthCount} SESSIONS`)));

    mk("location-pill", "Location Pill", "date", "glass", 230, ({ a, c }) =>
      B(glassBox(c, row(8, { borderRadius: 999, padding: "8px 14px" })),
        B({ width: 7, height: 7, borderRadius: 4, background: c.accent }),
        T(monoTxt(c, 11, { fontWeight: 600 }), a.locationName || NS)));

    mk("cadence-power", "Cadence + Power", "multi", "chart", 240, ({ a, c }) =>
      B(row(16), B(col(1), T(label(c, 7), "CADENCE"), T(huge(c, 26), a.cadence != null ? String(a.cadence) : NS), T(label(c, 7), "SPM")),
        B({ width: 1, background: c.hair }),
        B(col(1), T(label(c, 7), "POWER"), T(huge(c, 26, { color: c.accent }), a.powerW != null ? String(a.powerW) : NS), T(label(c, 7), "WATTS"))));

    mk("caption-text", "Caption Text", "text", "mono", 240, ({ layer, c }) =>
      T(huge(c, 30, { textAlign: "center" }), (layer && layer.text) || "DOUBLE TAP TO EDIT"));

    return {
      stickers: S,
      fields, dist, distUnit, distUnitShort, pace, paceUnit, dur, durWords, elev, elevUnit,
      dateShort, dateFull, weekday, time12, speed, speedUnit, typeLabel, NS,
      FONT_UI, FONT_MONO, FONT_SERIF,
    };
  };
})();
