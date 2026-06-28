import type { ReactElement } from "react";

/**
 * Shared Open Graph / Twitter card rendered by next/og (1200x630).
 * Matches the dark + violet "Plexus" family card used across plexus.company,
 * app.plexus.company, and docs.plexus.company so links read as one family.
 */
export const ogSize = { width: 1200, height: 630 };
export const ogAlt =
  "Plexus UI — GPU-accelerated React components for real-time visualization of physical systems";
export const ogContentType = "image/png";

export function OgCard(): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(124, 77, 255, 0.30), transparent 60%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(167, 139, 250, 0.16), transparent 60%)",
        color: "#fafafa",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 28,
          fontWeight: 500,
          color: "rgba(250, 250, 250, 0.55)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 9999, background: "#7c4dff" }} />
        plexus · ui
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
          Plexus UI
        </div>
        <div
          style={{
            fontSize: 36,
            color: "rgba(250, 250, 250, 0.5)",
            letterSpacing: "-0.01em",
            maxWidth: 1000,
          }}
        >
          GPU-accelerated React components for real-time visualization of physical systems.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "rgba(250, 250, 250, 0.4)",
          fontSize: 24,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
        }}
      >
        <span>webgpu charts · 3d viewers · flight instruments</span>
        <span>ui.plexus.company</span>
      </div>
    </div>
  );
}
