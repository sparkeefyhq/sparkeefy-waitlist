import React from "react";

/* ─── Confetti ─── */
const confettiItems = [
  { color: "#a78bfa", top: "10%", left: "10%", rot: 12 },
  { color: "#93c5fd", top: "15%", left: "85%", rot: -12 },
  { color: "#f472b6", top: "25%", left: "5%",  rot: 45 },
  { color: "#facc15", top: "30%", left: "90%", rot: -45 },
  { color: "#fb923c", top: "45%", left: "15%", rot: 12 },
  { color: "#67e8f9", top: "50%", left: "80%", rot: -12 },
  { color: "#8b5cf6", top: "8%",  left: "30%", rot: 90 },
  { color: "#f9a8d4", top: "40%", left: "70%", rot: -90 },
  { color: "#60a5fa", top: "60%", left: "25%", rot: 45 },
  { color: "#eab308", top: "65%", left: "75%", rot: -12 },
  { color: "#c4b5fd", top: "5%",  left: "20%", rot: 12 },
  { color: "#bfdbfe", top: "12%", left: "45%", rot: -45 },
  { color: "#fbcfe8", top: "18%", left: "65%", rot: 90 },
  { color: "#fef08a", top: "22%", left: "35%", rot: -12 },
  { color: "#fdba74", top: "28%", left: "75%", rot: 45 },
  { color: "#a5f3fc", top: "35%", left: "55%", rot: -90 },
  { color: "#7c3aed", top: "38%", left: "25%", rot: 12 },
  { color: "#ec4899", top: "42%", left: "95%", rot: -45 },
  { color: "#fde047", top: "55%", left: "5%",  rot: 180 },
  { color: "#3b82f6", top: "58%", left: "40%", rot: -12 },
];

/* ══════════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════════ */

/** 1 — Medal / winner badge with star + ribbon tails */
const IconMedal = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none"
    stroke="white" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="15" cy="12" r="7.5" />
    {/* 5-point star */}
    <path d="M15 8.5l1.3 2.7h2.8l-2.3 1.8.9 2.8-2.7-1.9-2.7 1.9.9-2.8-2.3-1.8h2.8z" strokeWidth={1.3} />
    {/* Left ribbon */}
    <path d="M10.5 18l-2 7 6.5-2.5" />
    {/* Right ribbon */}
    <path d="M19.5 18l2 7-6.5-2.5" />
  </svg>
);

/** 2 — Classic speech bubble with bottom-left tail (chat icon) */
const IconChat = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none"
    stroke="white" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {/* Rounded rectangle body */}
    <path d="M4 5h22a2 2 0 012 2v12a2 2 0 01-2 2H10l-6 4V7a2 2 0 012-2z" />
  </svg>
);

/** 3 — Concentric circles target (bullseye) */
const IconTarget = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none"
    stroke="white" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="15" cy="15" r="12" />
    <circle cx="15" cy="15" r="7.5" />
    <circle cx="15" cy="15" r="3" fill="white" stroke="none" />
  </svg>
);

/* ── Discord logo ── */
const DiscordLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" width="26" height="26" fill="white">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36a77.7,77.7,0,0,0,6.89-11.27,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2A75.57,75.57,0,0,0,95.73,77.9c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.26A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C35.62,65.69,30,59.44,30,51.73S35.48,37.78,42.45,37.78s12.63,6.31,12.46,13.95C54.74,59.44,49.32,65.69,42.45,65.69Zm42.24,0c-6.83,0-12.45-6.25-12.45-14s5.48-13.95,12.45-13.95S97.32,44,97.15,51.73C97.15,59.44,91.72,65.69,84.69,65.69Z"/>
  </svg>
);

/* ── Step icons ── */
const IconPeople = () => (
  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
const IconCalendar = () => (
  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconBox = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════ */

const ThankYou: React.FC = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ty-root {
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at top, #ffffff 0%, #f9f7ff 100%);
          overflow-x: hidden;
          position: relative;
          color: #1f2937;
          -webkit-font-smoothing: antialiased;
        }

        .ty-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 40px 20px 32px;
          position: relative;
          z-index: 10;
        }

        /* ── Hero ── */
        .ty-hero { text-align: center; margin-bottom: 36px; padding-top: 16px; }
        .ty-pill {
          display: inline-flex; align-items: center;
          background: #fff; border: 1px solid #f0f0f0;
          border-radius: 999px; padding: 6px 18px;
          font-size: 13px; font-weight: 600; color: #4c1d95;
          box-shadow: 0 1px 5px rgba(0,0,0,0.07);
          margin-bottom: 22px;
        }
        .ty-h1 {
          font-size: clamp(1.75rem, 6vw, 2.6rem);
          font-weight: 800; line-height: 1.18;
          color: #3b0764; margin-bottom: 18px;
          letter-spacing: -0.5px;
        }
        .ty-h1 span { color: #7c3aed; }
        .ty-subtitle {
          font-size: clamp(13px, 3.5vw, 15px);
          font-weight: 600; color: rgba(76,29,149,0.82); margin-bottom: 6px;
        }
        .ty-body {
          font-size: 13px; color: #6b7280;
          max-width: 330px; margin: 12px auto 0; line-height: 1.65;
        }

        /* ── Illustration ── */
        .ty-img-wrap { display: flex; justify-content: center; margin-bottom: 36px; }
        .ty-img {
          width: clamp(130px, 38vw, 200px);
          height: clamp(130px, 38vw, 200px);
          object-fit: contain;
        }

        /* ── White card (timeline) ── */
        .ty-card {
          background: #fff;
          border-radius: 28px;
          padding: clamp(22px, 5vw, 36px);
          box-shadow: 0 4px 24px -4px rgba(0,0,0,0.08);
          border: 1px solid #f5f5f5;
          margin-bottom: 18px;
        }
        .ty-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .ty-card-icon {
          width: 40px; height: 40px; border-radius: 12px;
          background: #f5f3ff; color: #7c3aed;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ty-card-title { font-size: 16px; font-weight: 700; color: #1f2937; }

        /* Steps row */
        .ty-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; position: relative; }
        .ty-connector { position: absolute; height: 1px; background: #e5e7eb; top: 22px; z-index: 0; }
        .ty-step { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; z-index: 1; padding: 0 4px; }
        .ty-step-circle {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px; flex-shrink: 0;
        }
        .ty-step-label { font-size: clamp(10px, 2.5vw, 13px); font-weight: 700; color: #1f2937; line-height: 1.3; }
        .ty-step-sub   { font-size: clamp(9px, 2vw, 11px);  color: #9ca3af; margin-top: 3px; line-height: 1.4; }

        /* ── Purple value props card ── */
        .ty-purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 28px;
          padding: clamp(24px, 6vw, 40px) clamp(20px, 5vw, 36px);
          color: white;
          box-shadow: 0 8px 32px rgba(124,58,237,0.32);
          position: relative;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .ty-purple-glow {
          position: absolute; top: -60px; right: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          background: rgba(255,255,255,0.09); filter: blur(48px);
          pointer-events: none;
        }
        .ty-purple-header { text-align: center; margin-bottom: 28px; position: relative; z-index: 1; }
        .ty-purple-sub { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); margin-bottom: 6px; }
        .ty-purple-title { font-size: clamp(15px, 4vw, 21px); font-weight: 800; color: #fff; line-height: 1.25; }

        /* Props grid — 3 cols on ≥480, 1 col on mobile */
        .ty-props {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          position: relative; z-index: 1;
        }
        .ty-prop { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .ty-prop-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,255,255,0.16);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px; flex-shrink: 0;
        }
        .ty-prop-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 5px; }
        .ty-prop-desc  { font-size: 11px; color: rgba(255,255,255,0.78); line-height: 1.6; }

        /* Mobile stacking for props */
        @media (max-width: 480px) {
          .ty-props { grid-template-columns: 1fr; gap: 24px; }
          .ty-prop { flex-direction: row; text-align: left; gap: 16px; }
          .ty-prop-icon { margin-bottom: 0; }
        }

        /* ── Discord CTA ── */
        .ty-discord {
          background: #fff;
          border-radius: 28px;
          padding: clamp(16px, 4vw, 26px) clamp(18px, 5vw, 28px);
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .ty-discord-left { display: flex; align-items: center; gap: 14px; }
        .ty-discord-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: #5865F2;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(88,101,242,0.35);
          flex-shrink: 0;
        }
        .ty-discord-title { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 3px; }
        .ty-discord-sub   { font-size: 12px; color: #9ca3af; line-height: 1.5; max-width: 260px; word-break: break-word; }
        .ty-discord-btn {
          background: #5865F2; color: #fff;
          font-weight: 700; font-size: 14px; font-family: 'Inter', sans-serif;
          padding: 12px 28px; border-radius: 14px;
          text-decoration: none; white-space: nowrap; display: inline-block;
          box-shadow: 0 4px 14px rgba(88,101,242,0.28);
          transition: background 0.18s, transform 0.12s;
        }
        .ty-discord-btn:hover  { background: #4752C4; transform: scale(1.03); }
        .ty-discord-btn:active { transform: scale(0.97); }

        @media (max-width: 480px) {
          .ty-discord { justify-content: flex-start; }
          .ty-discord-btn { width: 100%; text-align: center; }
        }

        /* ── Footer ── */
        .ty-footer { text-align: center; padding: 10px 0 28px; }
        .ty-footer-box {
          border: 1px solid #ebebff;
          border-radius: 18px;
          background: rgba(245,243,255,0.6);
          padding: 16px 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .ty-footer-title { font-size: 14px; font-weight: 700; color: #3b387e; margin-bottom: 4px; }
        .ty-footer-sub   { font-size: 12px; color: #6b7280; }
      `}</style>

      <div className="ty-root">

        {/* Confetti layer */}
        <div style={{ position:"absolute", inset:0, height:820, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
          {confettiItems.map((c, i) => (
            <div key={i} style={{
              position:"absolute", top:c.top, left:c.left,
              width:12, height:6, borderRadius:2,
              backgroundColor:c.color, opacity:0.65,
              transform:`rotate(${c.rot}deg)`,
            }} />
          ))}
        </div>

        <div className="ty-container">

          {/* ── Hero ── */}
          <section className="ty-hero">
            <div className="ty-pill">Welcome to Sparkeefy! 🎉</div>
            <h1 className="ty-h1">
              Thank you for believing <br />
              <span>in Sparkeefy!</span>
            </h1>
            {/* Line from img 2 */}
            <p className="ty-subtitle">The app that makes relationships feel effortless</p>
            {/* Body from img 2 */}
            <p className="ty-body">
              You're officially in consideration for Sparkeefy's first group of early users.
              People joining early help shape what Sparkeefy becomes.
            </p>
          </section>

          {/* ── Illustration ── */}
          <div className="ty-img-wrap">
            <img src="/img/thnkyou.png" alt="Thank you illustration" className="ty-img" />
          </div>

          {/* ── What happens next ── */}
          <div className="ty-card">
            <div className="ty-card-header">
              <div className="ty-card-icon"><IconBox /></div>
              <span className="ty-card-title">What happens next?</span>
            </div>

            <div className="ty-steps">
              {/* Connector lines — precisely centered between circles */}
              <div className="ty-connector" style={{ left:"calc(16.66% + 22px)", width:"calc(33.33% - 44px)" }} />
              <div className="ty-connector" style={{ left:"calc(50% + 22px)",    width:"calc(33.33% - 44px)" }} />

              <div className="ty-step">
                <div className="ty-step-circle" style={{ background:"#7c3aed", boxShadow:"0 4px 14px rgba(124,58,237,0.28)" }}>
                  <IconPeople />
                </div>
                <span className="ty-step-label">We'll review</span>
                <span className="ty-step-sub">all applications</span>
              </div>

              <div className="ty-step">
                <div className="ty-step-circle" style={{ background:"#22c55e", boxShadow:"0 4px 14px rgba(34,197,94,0.28)" }}>
                  <IconCheck />
                </div>
                <span className="ty-step-label">Selected users</span>
                <span className="ty-step-sub">will get notified soon</span>
              </div>

              <div className="ty-step">
                <div className="ty-step-circle" style={{ background:"#fb923c", boxShadow:"0 4px 14px rgba(251,146,60,0.28)" }}>
                  <IconCalendar />
                </div>
                <span className="ty-step-label">June 1 → Early</span>
                <span className="ty-step-sub">APK access drops</span>
              </div>
            </div>
          </div>

          {/* ── Value Props (purple card) ── */}
          <div className="ty-purple">
            <div className="ty-purple-glow" />

            <div className="ty-purple-header">
              <p className="ty-purple-sub">You're not just joining.</p>
              <h3 className="ty-purple-title">You're building the future with us.</h3>
            </div>

            <div className="ty-props">

              {/* 1 — Medal (winner badge) */}
              <div className="ty-prop">
                <div className="ty-prop-icon"><IconMedal /></div>
                <div className="ty-prop-text">
                  <p className="ty-prop-title">Early Access</p>
                  <p className="ty-prop-desc">Get Sparkeefy before everyone else</p>
                </div>
              </div>

              {/* 2 — Chat bubble with tail */}
              <div className="ty-prop">
                <div className="ty-prop-icon"><IconChat /></div>
                <div className="ty-prop-text">
                  <p className="ty-prop-title">Shape Sparkeefy</p>
                  <p className="ty-prop-desc">Share feedback that drives real change</p>
                </div>
              </div>

              {/* 3 — Concentric circles target (bullseye) */}
              <div className="ty-prop">
                <div className="ty-prop-icon"><IconTarget /></div>
                <div className="ty-prop-text">
                  <p className="ty-prop-title">Exclusive Perks</p>
                  <p className="ty-prop-desc">3 months of Sparkeefy Pro + exclusive early access benefits</p>
                </div>
              </div>

            </div>
          </div>

          {/* ── Discord CTA ── */}
          <div className="ty-discord">
            <div className="ty-discord-left">
              <div className="ty-discord-icon"><DiscordLogo /></div>
              <div>
                {/* Updated from img 2 */}
                <p className="ty-discord-title">Unlock Your Community Access</p>
                <p className="ty-discord-sub">Meet other early users, share feedback, get sneak peeks, and help us build Sparkeefy in public - together.</p>
              </div>
            </div>
            <a href="https://discord.gg/jdJEFcpPE" className="ty-discord-btn">Join Discord</a>
          </div>

          {/* ── Footer ── */}
          <footer className="ty-footer">
            <div className="ty-footer-box">
              <p className="ty-footer-title">Keep an eye on your emails 👀</p>
              <p className="ty-footer-sub">Your Sparkeefy invite could be next.</p>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
};

export default ThankYou;