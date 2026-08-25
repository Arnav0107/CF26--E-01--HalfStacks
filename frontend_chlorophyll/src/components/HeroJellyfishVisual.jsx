import React from 'react';

/**
 * HeroJellyfishVisual
 *
 * Renders the maroon/blue network jellyfish PNG directly on the page background.
 * The jellyfish image has a very light (white → pale-blue) gradient background,
 * so mix-blend-mode: multiply fuses it seamlessly into the page's own
 * white/pale-blue background — no visible image box, no rectangle, no frame.
 *
 * The component itself is a transparent wrapper; all visual weight comes from
 * the blended image and the CSS radial glow placed behind it.
 */
export default function HeroJellyfishVisual() {
  return (
    /*
     * Outer wrapper: fills the right column of the hero grid (lg:col-span-5).
     * overflow-visible so tentacles can bleed slightly outside the column bounds.
     * pointer-events-none so it never blocks text/buttons on the left.
     */
    <div
      className="relative w-full h-full pointer-events-none select-none"
      style={{ minHeight: '480px', overflow: 'visible' }}
    >
      {/* ── 1. Atmospheric pale-blue glow behind the jellyfish ─────────────────
           Sits below the image (z-index 0).
           Pure CSS — no box, no rectangle, fades to transparent naturally.      */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `radial-gradient(
            circle at 72% 42%,
            rgba(130, 180, 245, 0.28) 0%,
            rgba(180, 210, 250, 0.14) 32%,
            rgba(255, 255, 255, 0)    68%
          )`,
          borderRadius: '50%',
          transform: 'scale(1.35)',
        }}
      />

      {/* ── 2. Jellyfish image ─────────────────────────────────────────────────
           mix-blend-mode: multiply:
             - white pixels in the image → 100% transparent (multiply with white = white)
             - the pale-blue gradient in the image → blends naturally with the page
             - maroon dome & blue tentacles retain their color against the white page
           No border, no background, no shadow, no rounded container.            */}
      <img
        src="/jellyfish.jpg"
        alt="Biological Data Network — Environmental Provenance Organism"
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '110%',
          maxWidth: '820px',
          height: 'auto',
          objectFit: 'contain',
          mixBlendMode: 'multiply',
          /* Preserve the image's own atmosphere; do NOT add hue-rotate */
          filter: 'contrast(1.06) saturate(1.08)',
          zIndex: 1,
          animation: 'jellyfishFloat 7s ease-in-out infinite',
          /* Prevent any browser-default image border/outline */
          border: 'none',
          outline: 'none',
          background: 'transparent',
          display: 'block',
        }}
      />

      {/* ── 3. Floating keyframe (injected as a style tag) ─────────────────── */}
      <style>{`
        @keyframes jellyfishFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
