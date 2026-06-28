import type { ReactElement } from "react";

/** Shared Open Graph / Twitter card rendered by next/og (1200x630). */
export const ogSize = { width: 1200, height: 630 };
export const ogAlt =
  "Plexus UI — GPU-accelerated React components for real-time visualization of physical systems";
export const ogContentType = "image/png";

// Deterministic "equalizer" accent bars (no randomness so the build is reproducible).
const bars = Array.from({ length: 36 }, (_, i) => {
  const h = 24 + Math.round(72 * (0.5 + 0.5 * Math.sin(i / 2.4) * Math.cos(i / 7)));
  return h;
});

export function OgCard(): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#09090b",
        color: "#fafafa",
        padding: "72px 80px",
        justifyContent: "space-between",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{ display: "flex", width: 30, height: 30, borderRadius: 9, background: "#3b82f6" }}
        />
        <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa", letterSpacing: 1 }}>
          ui.plexus.company
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 124, fontWeight: 800, letterSpacing: -3 }}>
          Plexus UI
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 42,
            color: "#a1a1aa",
            maxWidth: 1000,
            lineHeight: 1.3,
          }}
        >
          GPU-accelerated React components for real-time visualization of physical systems.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 100 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              width: 18,
              height: h,
              borderRadius: 4,
              background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
