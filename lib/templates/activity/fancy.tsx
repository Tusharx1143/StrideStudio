/**
 * Dynamic Templates — templates that adapt their layout, content, and styling
 * based on the actual activity data they receive.
 *
 * Every render function accepts an optional 3rd `colors` argument so the
 * caller can override the colour scheme (e.g. for photo‑overlay use).
 *
 * Architecture: shared helpers live in ./templates/shared/ and individual
 * template files can be extracted into ./templates/templates/ incrementally.
 */

import React from "react";
import { Text, View } from "react-native";
import { Activity, formatDuration } from "../../app-data";
import { alpha, BRIGHT_WHITE, type TemplateColors } from "../../color-presets";
import type { WeekTotals, TemplateDef } from "../shared/types";

/** @deprecated Use TemplateDef from shared/types instead */
export type DynamicTemplateDef = TemplateDef;
import { analyseFields, heroField, type AvailableField } from "../shared/analyse-fields";
import { ts, ff, typeEmoji, typeLabel } from "../shared/styling";
import { fmtDateShort, fmtDateFull, fmtTime12, fmtWeekday, paceStr, timeStr } from "../shared/helpers";



// ── Inline style tokens (used by template renders) ──
const serif = { fontFamily: "Georgia" as const };
const mono = { fontFamily: "Courier" as const };

// ── Dynamic template definitions ──

// ─── FANCY ───

export const FANCY: TemplateDef[] = [
  {
    id: "gradient-glow",
    name: "Gradient Glow",
    tab: "activity",
    badge: "New",
    description: "Faux gradient glow with layered semi-transparent text",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const top3 = fields.slice(0, 3);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 12 }}>
          {/* Large background number (decorative) */}
          {top3[0] && (
            <View style={{ position: "absolute", right: -10, top: -10, opacity: 0.08 }}>
              <Text style={[{ color: c.accent, fontSize: 72, fontWeight: "900" }, ff(c.fontFamily)]}>
                {top3[0].value.split(" ")[0]}
              </Text>
            </View>
          )}

          {/* Emoji badge */}
          <View style={{ backgroundColor: alpha(c.accent, "20"), borderRadius: 20, padding: 6, marginBottom: 6 }}>
            <Text style={{ fontSize: 20 }}>{typeEmoji(a.type)}</Text>
          </View>

          <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 2, marginBottom: 4 }, ts(c.shadowColor, c.fontFamily)]}>
            {typeLabel(a.type)} · {fmtDateShort(a.startDate)}
          </Text>

          {/* Hero stat with glow layers */}
          {top3[0] && (
            <View style={{ alignItems: "center", marginVertical: 6 }}>
              <Text style={[{ color: c.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                {top3[0].label}
              </Text>
              {/* Layered text for glow effect */}
              <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1, opacity: 0.3, position: "absolute", top: 26 }, ff(c.fontFamily)]}>
                {top3[0].value}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 36, fontWeight: "900", letterSpacing: -1, opacity: 0.6, position: "absolute", top: 24 }, ff(c.fontFamily)]}>
                {top3[0].value}
              </Text>
              <Text style={[{ color: c.textPrimary, fontSize: 36, fontWeight: "900", letterSpacing: -1 }, ts(c.shadowColor, c.fontFamily)]}>
                {top3[0].value}
              </Text>
            </View>
          )}

          {/* Supporting stats */}
          {top3.length > 1 && (
            <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
              {top3.slice(1).map((f) => (
                <View key={f.key} style={{ alignItems: "center", paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: alpha(c.accent, "30") }}>
                  <Text style={[{ color: c.textSecondary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── FANCY: Badge Medal ───,

  {
    id: "badge-medal",
    name: "Badge Medal",
    tab: "activity",
    badge: "New",
    description: "Circular badge layout with decorative rings",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          {/* Decorative outer ring */}
          <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: alpha(c.accent, "30"), alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
            {/* Inner ring */}
            <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: alpha(c.accent, "50"), alignItems: "center", justifyContent: "center" }}>
              {/* Solid center */}
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: alpha(c.accent, "15"), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18 }}>{typeEmoji(a.type)}</Text>
              </View>
            </View>
          </View>

          {hero && (
            <>
              <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 1 }, ts(c.shadowColor, c.fontFamily)]}>
                {hero.label}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 18, fontWeight: "900", letterSpacing: -0.5 }, ts(c.shadowColor, c.fontFamily)]}>
                {hero.value}
              </Text>
            </>
          )}

          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center", paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: c.border }}>
                  <Text style={[{ color: c.textPrimary, fontSize: 9, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", marginTop: 1 }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[{ color: c.textMuted, fontSize: 5, fontWeight: "600", letterSpacing: 1, marginTop: 4 }, ts(c.shadowColor, c.fontFamily)]}>
            {fmtDateFull(a.startDate)}
          </Text>
        </View>
      );
    },
  },

  // ─── FANCY: Cinematic Letterbox ───,

  {
    id: "cinematic",
    name: "Cinematic",
    tab: "activity",
    fullWidth: true,
    badge: "New",
    description: "Widescreen letterbox layout with bold centred stat",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 4);

      return (
        <View style={{ flex: 1, justifyContent: "center" }}>
          {/* Top letterbox */}
          <View style={{ height: 28, backgroundColor: alpha(c.border, "80"), justifyContent: "center", paddingHorizontal: 12 }}>
            <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "600", letterSpacing: 2 }, ff(c.fontFamily)]}>
              {typeLabel(a.type)} · {fmtDateShort(a.startDate)} · {fmtTime12(a.startDate)}
            </Text>
          </View>

          {/* Centre content */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
            {hero && (
              <>
                <Text style={[{ color: c.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 1, marginBottom: 2 }, ts(c.shadowColor, c.fontFamily)]}>
                  {hero.label}
                </Text>
                <Text style={[{ color: c.textPrimary, fontSize: 34, fontWeight: "900", letterSpacing: -1, textAlign: "center" }, ts(c.shadowColor, c.fontFamily)]}>
                  {hero.value}
                </Text>
              </>
            )}

            {rest.length > 0 && (
              <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
                {rest.map((f) => (
                  <View key={f.key} style={{ alignItems: "center" }}>
                    <Text style={[{ color: c.textSecondary, fontSize: 10, fontWeight: "700" }, ts(c.shadowColor, c.fontFamily)]}>{f.value}</Text>
                    <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ts(c.shadowColor, c.fontFamily)]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Bottom letterbox */}
          <View style={{ height: 28, backgroundColor: alpha(c.border, "80"), justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 12 }}>
            <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600" }, ff(c.fontFamily)]}>
              {a.title?.toUpperCase() ?? "STRIDESTUDIO"}
            </Text>
          </View>
        </View>
      );
    },
  },

  // ─── FANCY: Neon Sign ───,

  {
    id: "neon-sign",
    name: "Neon Sign",
    tab: "activity",
    badge: "New",
    description: "Glowing neon text effect on dark background",
    render: (a, _t, colors) => {
      const c = colors ?? BRIGHT_WHITE.colors;
      const fields = analyseFields(a);
      const hero = fields[0];
      const rest = fields.slice(1, 3);

      const glow = (size: number) => ({
        textShadowColor: c.accent,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: size,
      });

      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 10 }}>
          {/* Type indicator with glow */}
          <Text style={[{ fontSize: 22, marginBottom: 6 }, glow(12)]}>{typeEmoji(a.type)}</Text>

          <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "700", letterSpacing: 2, marginBottom: 6 }, glow(4)]}>
            {a.type.toUpperCase()}
          </Text>

          {hero && (
            <View style={{ alignItems: "center" }}>
              <Text style={[{ color: c.accent, fontSize: 8, fontWeight: "700", letterSpacing: 2, marginBottom: 2 }, glow(6)]}>
                {hero.label}
              </Text>
              <Text style={[{ color: c.accent, fontSize: 28, fontWeight: "900", letterSpacing: 2 }, { ...glow(18), opacity: 0.4, position: "absolute", top: 24 }]}>
                {hero.value}
              </Text>
              <Text style={[{ color: c.textPrimary, fontSize: 28, fontWeight: "900", letterSpacing: 2 }, glow(12)]}>
                {hero.value}
              </Text>
            </View>
          )}

          {rest.length > 0 && (
            <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
              {rest.map((f) => (
                <View key={f.key} style={{ alignItems: "center" }}>
                  <Text style={[{ color: c.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1 }, glow(8)]}>{f.value}</Text>
                  <Text style={[{ color: c.textMuted, fontSize: 6, fontWeight: "600", letterSpacing: 1, marginTop: 1 }, glow(4)]}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
  },

  // ─── .IDEA: Blue Bar Quote ───,
];
