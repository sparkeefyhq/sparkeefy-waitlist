import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   Direct TSX conversion of the provided HTML design.
   Only changes vs the source HTML:
     • Google Fonts "Outfit" → local RetroVintage for brand
       text ("Sparkeefy") via .rv class
     • Welcome card src → /img/thnkyou.png (local asset)
     • Heart icon in Follow bar → /logo-heart.svg (local asset)
     • Tailwind loaded via <link> inside <style> injection,
       kept as inline styles / className to match exactly
   Everything else (colours, layout, copy, animations)
   is byte-for-byte identical to the source HTML.
   ───────────────────────────────────────────────────────── */

const ThankYou: React.FC = () => {
  return (
    <>
      <style>{`
        /* ── Font: Outfit (body) ── */
        /* ── Font: RetroVintage (brand name only) ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }





        /* ── Base ── */
        body, .ty-body-wrap {
          font-family: var(--font-sf-pro-display), system-ui, -apple-system, sans-serif;
          background: linear-gradient(180deg, #100b2a 0%, #1a0f35 100%);
          min-height: 100vh;
          color: #ffffff;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 24px;
        }

        /* ── Gradient helpers ── */
        .bg-card-gradient {
          background: linear-gradient(180deg, #692cc4 0%, #380d78 50%, #000000 100%);
        }

        /* ── Floating animation (welcome card) ── */
        .floating {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        /* ── Swing animations (tiles) ── */
        .swing-1 {
          transform-origin: top center;
          animation: swing 4s ease-in-out infinite alternate;
          animation-delay: 0s;
        }
        .swing-2 {
          transform-origin: top center;
          animation: swing 4.5s ease-in-out infinite alternate;
          animation-delay: 1s;
        }
        .swing-3 {
          transform-origin: top center;
          animation: swing 5s ease-in-out infinite alternate;
          animation-delay: 0.5s;
        }
        .follow-link:hover {
          background: #3b82f6 !important;
        }
        @keyframes swing {
          0%   { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
      `}</style>

      {/* ── Root wrapper — mirrors <body> from source HTML ── */}
      <div
        className="ty-body-wrap"
        style={{
          fontFamily: "var(--font-sf-pro-display), system-ui, -apple-system, sans-serif",
          background: "linear-gradient(180deg, #100b2a 0%, #1a0f35 100%)",
          minHeight: "100vh",
          color: "#ffffff",
          overflowX: "hidden",
          WebkitFontSmoothing: "antialiased",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 24px",
        }}
      >
        {/* ── <main> ── */}
        <main
          style={{
            width: "100%",
            maxWidth: "448px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            position: "relative",
            zIndex: 10,
          }}
        >

          {/* ════════════════════════════════════
              Hero Section
              ════════════════════════════════════ */}
          <section
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              paddingTop: "32px",
              position: "relative",
            }}
          >
            {/* Left: headline + subtitle + divider + body */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                zIndex: 10,
                maxWidth: "70%",
                paddingTop: "16px",
              }}
            >
              {/* "You're in." */}
              <h1
                style={{
                  fontSize: "3rem",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  marginBottom: "24px",
                  lineHeight: 1.1,
                }}
              >
                You&apos;re{" "}
                <span style={{ color: "#a05aff" }}>in.</span>
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  lineHeight: 1.25,
                  marginBottom: "24px",
                }}
              >
                You&apos;re now part of
                <br />
                <span style={{ color: "#a05aff" }}>
                  Sparkeefy&apos;s
                </span>{" "}
                inner circle.
              </p>

              {/* Purple divider */}
              <div
                style={{
                  width: "48px",
                  height: "2px",
                  background: "#a05aff",
                  marginBottom: "32px",
                }}
              />

              {/* Body copy */}
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  lineHeight: 1.625,
                  maxWidth: "280px",
                  opacity: 0.9,
                }}
              >
                This is where we share first access, early updates, and the
                moments that shape what{" "}
                <span>Sparkeefy</span> becomes.
              </p>
            </div>

            {/* Right: welcome card — static */}
            <div
              style={{
                position: "absolute",
                right: "-24px",
                top: "-16px",
                width: "170px",
                zIndex: 0,
              }}
            >
              <img
                src="/img/thnkyou.jpeg"
                alt="Welcome Card Illustration"
                style={{
                  width: "100%",
                  height: "auto",
                  filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.15))",
                }}
              />
            </div>
          </section>

          {/* ════════════════════════════════════
              Hanging Tiles Section
              ════════════════════════════════════ */}
          <section
            style={{
              position: "relative",
              margin: "-26px 0 32px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "128px",
            }}
          >
            {/* Dashed rope SVG */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
              preserveAspectRatio="none"
              viewBox="0 0 400 100"
            >
              <path
                d="M-20 30 Q 200 110, 420 30"
                fill="none"
                stroke="#a05aff"
                strokeDasharray="6 6"
                strokeWidth="2"
                opacity="0.6"
              />
            </svg>

            {/* Tiles container */}
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 8px",
                position: "relative",
                zIndex: 10,
              }}
            >
              {/* ── Tile 1: Say it better ── */}
              <div className="swing-1" style={{ position: "relative" }}>
                {/* Purple shadow layer */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#7a3cdb",
                    borderRadius: "16px",
                    transform: "translate(6px, 6px)",
                  }}
                />
                {/* Cream card */}
                <div
                  style={{
                    position: "relative",
                    background: "#fdf5e6",
                    color: "#000",
                    width: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                    transform: "rotate(-6deg)",
                  }}
                >
                  {/* Speech bubble with heart — matches screenshot */}
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none"
                    stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginBottom: "2px" }}>
                    {/* bubble outline with tail at bottom-left */}
                    <path d="M4 5h24a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 28 22H10l-6 5V6.5A1.5 1.5 0 0 1 4 5z"/>
                    {/* heart inside bubble */}
                    <path d="M16 18s-5-3-5-7c0-2 1.4-3 3-3 1 0 1.8.6 2 1.5.2-.9 1-1.5 2-1.5 1.6 0 3 1 3 3 0 4-5 7-5 7z"
                      fill="#111" stroke="none"/>
                  </svg>
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    Say it
                    <br />
                    better
                  </span>
                </div>
              </div>

              {/* ── Tile 2: Show up better (middle, lower) ── */}
              <div
                className="swing-2"
                style={{ position: "relative", transform: "translateY(24px)" }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#7a3cdb",
                    borderRadius: "16px",
                    transform: "translate(6px, 6px)",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    background: "#fdf5e6",
                    color: "#000",
                    width: "80px",
                    height: "80px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                  }}
                >
                  {/* Gift box — matches screenshot: lid, body, vertical ribbon, bow */}
                  <svg width="34" height="34" viewBox="0 0 36 36" fill="none"
                    stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginBottom: "2px" }}>
                    {/* box body */}
                    <rect x="5" y="17" width="26" height="14" rx="1.5"/>
                    {/* lid */}
                    <rect x="3" y="11" width="30" height="6" rx="1.5"/>
                    {/* vertical ribbon */}
                    <line x1="18" y1="11" x2="18" y2="31"/>
                    {/* horizontal ribbon on lid */}
                    <line x1="3" y1="14" x2="33" y2="14"/>
                    {/* bow left loop */}
                    <path d="M18 11 C18 11 16 4 11 5.5 C7 7 9 13 18 11z"/>
                    {/* bow right loop */}
                    <path d="M18 11 C18 11 20 4 25 5.5 C29 7 27 13 18 11z"/>
                  </svg>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    Show up
                    <br />
                    better
                  </span>
                </div>
              </div>

              {/* ── Tile 3: Remember better ── */}
              <div className="swing-3" style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#7a3cdb",
                    borderRadius: "16px",
                    transform: "translate(6px, 6px)",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    background: "#fdf5e6",
                    color: "#000",
                    width: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                    transform: "rotate(6deg)",
                  }}
                >
                  {/* Calendar with star — matches screenshot */}
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none"
                    stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginBottom: "2px" }}>
                    {/* outer rect */}
                    <rect x="3" y="5" width="26" height="24" rx="2.5"/>
                    {/* header divider */}
                    <line x1="3" y1="12" x2="29" y2="12"/>
                    {/* left peg */}
                    <line x1="10" y1="2" x2="10" y2="8"/>
                    {/* right peg */}
                    <line x1="22" y1="2" x2="22" y2="8"/>
                    {/* star */}
                    <path d="M16 15l1.4 2.8 3.1.5-2.2 2.1.5 3.1L16 22l-2.8 1.5.5-3.1-2.2-2.1 3.1-.5z"
                      fill="#111" stroke="none"/>
                  </svg>
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    Remember
                    <br />
                    better
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════
              Bottom Card Section
              ════════════════════════════════════ */}
          <section
            className="bg-card-gradient"
            style={{
              marginTop: "-32px",
              background: "linear-gradient(180deg, #692cc4 0%, #380d78 50%, #000000 100%)",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "24px",
                color: "#fff",
                letterSpacing: "0.025em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span>Come build</span>
              <img src="/logo-text.svg" alt="Sparkeefy" style={{ height: "1.1em", width: "auto" }} />
              <span>with us</span>
            </h2>

            {/* Follow Action Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                marginBottom: "24px",
              }}
            >
              {/* Instagram icon box */}
              <div
                style={{
                  background: "#1e1d1dff",
                  padding: "8px",
                  borderRadius: "12px",
                  flexShrink: 0,
                  border: "1px solid #374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 128 128"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FEDA75"/>
                      <stop offset="25%" stopColor="#FA7E1E"/>
                      <stop offset="50%" stopColor="#D62976"/>
                      <stop offset="75%" stopColor="#962FBF"/>
                      <stop offset="100%" stopColor="#4F5BD5"/>
                    </linearGradient>
                  </defs>

                  <rect
                    x="8"
                    y="8"
                    width="112"
                    height="112"
                    rx="28"
                    fill="url(#igGradient)"
                  />

                  <rect
                    x="30"
                    y="30"
                    width="68"
                    height="68"
                    rx="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                  />

                  <circle
                    cx="64"
                    cy="64"
                    r="18"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                  />

                  <circle
                    cx="88"
                    cy="40"
                    r="5"
                    fill="white"
                  />
                </svg>
              </div>

              {/* Follow button container */}
              <div
                style={{
                  background: "#1e1d1dff",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 12px",
                  flexGrow: 1,
                  border: "1px solid #1f2937",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Local heart/logo SVG */}
                  <Image
                    src="/logo-heart.svg"
                    alt=""
                    width={24}
                    height={24}
                    style={{ width: "24px", height: "24px", flexShrink: 0 }}
                  />
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                    @Sparkeefy
                  </span>
                </div>
                <a
                  href="https://www.instagram.com/sparkeefy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="follow-link"
                  style={{
                    background: "#6b8cff",
                    color: "#fff",
                    fontWeight: 600,
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    textDecoration: "none",
                    transition: "background 0.15s",
                    fontFamily: "var(--font-sf-pro-display), system-ui, -apple-system, sans-serif",
                    flexShrink: 0,
                  }}
                >
                  Follow
                </a>
              </div>
            </div>

            {/* Caption */}
            <p
              style={{
                fontSize: "11px",
                fontWeight: 500,
                lineHeight: 1.625,
                marginBottom: "24px",
                opacity: 0.9,
                maxWidth: "260px",
              }}
            >
              Follow us on <strong>Instagram</strong> for Early Drops,
              <br />
              Giveaways, and First looks before everyone else.
            </p>

            {/* Thin divider */}
            <div
              style={{
                width: "32px",
                height: "1px",
                background: "rgba(255,255,255,0.3)",
                marginBottom: "24px",
              }}
            />

            {/* Tagline */}
            <p style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Built for the <em style={{ fontWeight: 700, fontStyle: "italic" }}>little</em>{" "}
              things that matter <em style={{ fontWeight: 700, fontStyle: "italic" }}>most</em>.
            </p>
          </section>

        </main>
      </div>
    </>
  );
};

export default ThankYou;
