import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import type { MagicLinkEmailData } from "@/lib/services/EmailService";

const colors = {
  bg: "#0D0D0D",
  card: "#161616",
  cardBorder: "rgba(255,255,255,0.08)",
  pink: "#FFCCE5",
  pinkLight: "#FFE9F4",
  white: "#FFFFFF",
  whiteMuted: "rgba(255,255,255,0.75)",
  whiteSubtle: "rgba(255,255,255,0.1)",
  gold: "#F5C842",
  ctaBg: "#FFCCE5",
  ctaText: "#0D0D0D",
  referralBg: "#1A1A1A",
  referralBorder: "rgba(255,204,229,0.2)",
  tierBg: "rgba(255,255,255,0.04)",
  tierBorder: "rgba(255,255,255,0.07)",
};

export function WelcomeEmail({
  email,
  magicLinkUrl,
  referralCode,
  referralLink,
}: MagicLinkEmailData) {
  const previewText = `You're in - welcome to Sparkeefy Early Access.`;

  const rewardTiers = [
    { invites: "3 invites", reward: "1 month Sparkeefy Pro" },
    { invites: "6 invites", reward: "3 months Sparkeefy Pro" },
    { invites: "10 invites", reward: "Founder Seat" },
  ];

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>

      <Body style={styles.body}>
        {/* ── Outer wrapper ── */}
        <Container style={styles.outer}>

          {/* ── Header / Brand badge ── */}
          <Section style={styles.header}>
            <Row>
              <Column align="center">
                <table role="presentation" cellSpacing={0} cellPadding={0} style={{ margin: "0 auto" }}>
                  <tr>
                    <td style={styles.badgeCell}>
                      <Img
                        src="https://sparkeefy.com/logo-heart.png"
                        width={20}
                        height={20}
                        alt="Sparkeefy"
                        style={styles.badgeIcon}
                      />
                      <Text style={styles.badgeText}>
                        <span style={styles.badgeBrand}>Sparkeefy</span>
                        <span style={styles.badgeSuffix}> is launching soon</span>
                      </Text>
                    </td>
                  </tr>
                </table>
              </Column>
            </Row>
          </Section>

          {/* ── Hero card ── */}
          <Section style={styles.card}>

            {/* Congratulations */}
            <Text style={styles.congratulations}>Congratulations</Text>

            {/* You're In. */}
            <Text style={styles.youreIn}>You&apos;re In.</Text>

            {/* Early Access Confirmed */}
            <Text style={styles.confirmed}>Early Access Confirmed.</Text>

            {/* Decorative rule */}
            <div style={styles.pinkRule} />

            {/* Description */}
            <Text style={styles.description}>
              We&apos;ll reach out when{" "}
              <span style={styles.brandInline}>Sparkeefy</span>{" "}
              is ready —{" "}
              <strong style={{ color: colors.white }}>
                no spam, no unnecessary notifications.
              </strong>
            </Text>

            {/* Magic link CTA */}
            <Section style={styles.ctaSection}>
              <Button href={magicLinkUrl} style={styles.ctaButton}>
                Access Your Dashboard →
              </Button>
              <Text style={styles.ctaHint}>
                This link is permanent and unique to you. Keep it safe.
              </Text>
            </Section>
          </Section>

          {/* ── Referral section ── */}
          <Section style={styles.referralCard}>
            <Text style={styles.referralHeading}>Invite &amp; Earn</Text>
            <Text style={styles.referralSubtitle}>
              Invite friends who&apos;d genuinely find this helpful — and unlock exclusive benefits along the way.
            </Text>

            {/* Referral link box */}
            <Section style={styles.referralLinkBox}>
              <Text style={styles.referralLinkLabel}>Your referral link</Text>
              <Text style={styles.referralLinkValue}>
                <Link href={referralLink} style={styles.referralLinkAnchor}>
                  {referralLink}
                </Link>
              </Text>
              <Text style={styles.referralCodeRow}>
                Your code:{" "}
                <span style={styles.referralCodeBadge}>{referralCode}</span>
              </Text>
            </Section>

            {/* Reward tiers */}
            <Section style={styles.tiersSection}>
              {rewardTiers.map((tier, i) => (
                <Row key={i} style={styles.tierRow}>
                  <Column style={styles.tierInvitesCol}>
                    <Text style={i === 2 ? styles.tierInvitesGold : styles.tierInvites}>
                      {tier.invites}
                    </Text>
                  </Column>
                  <Column style={styles.tierArrowCol}>
                    <Text style={styles.tierArrow}>→</Text>
                  </Column>
                  <Column style={styles.tierRewardCol}>
                    <Text style={i === 2 ? styles.tierRewardGold : styles.tierReward}>
                      {tier.reward}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Founder note */}
            <Text style={styles.founderNote}>
              The Founder Seat includes lifetime{" "}
              <span style={styles.founderNoteUnderline}>Founder pricing</span>
              , early feature access, and a real voice in shaping Sparkeefy.
            </Text>
          </Section>

          {/* ── Divider ── */}
          <Hr style={styles.divider} />

          {/* ── Footer ── */}
          <Section style={styles.footer}>
            <Text style={styles.footerBrand}>Sparkeefy</Text>

            {/* Social icon links */}
            <table role="presentation" cellSpacing={0} cellPadding={0} style={{ margin: "0 auto 16px" }}>
              <tr>
                <td style={{ paddingRight: 20 }}>
                  <Link href="https://www.linkedin.com/company/sparkeefy" style={{ textDecoration: "none" }}>
                    <Img
                      src="https://img.icons8.com/ios-filled/50/0A66C2/linkedin.png"
                      width={24}
                      height={24}
                      alt="LinkedIn"
                      style={{ display: "block" }}
                    />
                  </Link>
                </td>
                <td>
                  <Link href="https://sparkeefy.com" style={{ textDecoration: "none" }}>
                    <Img
                      src="https://img.icons8.com/ios/50/ffffff/globe--v1.png"
                      width={24}
                      height={24}
                      alt="Sparkeefy.com"
                      style={{ display: "block", opacity: 0.7 }}
                    />
                  </Link>
                </td>
              </tr>
            </table>

            <Text style={styles.footerAddress}>
              You&apos;re receiving this because you signed up at sparkeefy.com
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: colors.bg,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: 0,
  },
  outer: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "40px 16px 48px",
  },

  // ── Header / badge ──
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  badgeCell: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: colors.whiteSubtle,
    borderRadius: 100,
    padding: "8px 16px",
    gap: 8,
  },
  badgeIcon: {
    display: "inline-block",
    verticalAlign: "middle",
    marginRight: 8,
  },
  badgeText: {
    display: "inline",
    fontSize: 14,
    lineHeight: "1",
    margin: 0,
    padding: 0,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: "0.1px",
  },
  badgeBrand: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    color: colors.pink,
  },
  badgeSuffix: {
    fontWeight: 500,
  },

  // ── Hero card ──
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    border: `1px solid ${colors.cardBorder}`,
    padding: "48px 40px 40px",
    textAlign: "center",
    marginBottom: 16,
  },
  congratulations: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    fontSize: 36,
    fontWeight: 700,
    color: colors.pink,
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
    lineHeight: "1.2",
  },
  youreIn: {
    fontSize: 48,
    fontWeight: 900,
    fontStyle: "italic",
    color: colors.pinkLight,
    margin: "0 0 4px",
    letterSpacing: "-1px",
    lineHeight: "1.1",
  },
  confirmed: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.white,
    margin: "0 0 28px",
    letterSpacing: "-0.7px",
    lineHeight: "1.2",
  },
  pinkRule: {
    width: 60,
    height: 3,
    backgroundColor: colors.pink,
    borderRadius: 2,
    margin: "0 auto 28px",
    opacity: 0.6,
  },
  description: {
    fontSize: 16,
    lineHeight: "1.6",
    color: colors.whiteMuted,
    margin: "0 0 36px",
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: "auto",
  },
  brandInline: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    color: colors.pink,
  },

  // ── CTA ──
  ctaSection: {
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: colors.ctaBg,
    color: colors.ctaText,
    borderRadius: 100,
    fontSize: 16,
    fontWeight: 700,
    padding: "14px 36px",
    textDecoration: "none",
    display: "inline-block",
    letterSpacing: "0.2px",
  },
  ctaHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    margin: "12px 0 0",
    lineHeight: "1.5",
  },

  // ── Referral card ──
  referralCard: {
    backgroundColor: colors.referralBg,
    borderRadius: 20,
    border: `1px solid ${colors.referralBorder}`,
    padding: "36px 40px",
    marginBottom: 16,
  },
  referralHeading: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.white,
    margin: "0 0 8px",
    letterSpacing: "-0.3px",
  },
  referralSubtitle: {
    fontSize: 14,
    color: colors.whiteMuted,
    lineHeight: "1.6",
    margin: "0 0 28px",
  },

  // Referral link box
  referralLinkBox: {
    backgroundColor: "rgba(255,204,229,0.06)",
    border: `1px solid rgba(255,204,229,0.15)`,
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 24,
  },
  referralLinkLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.pink,
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
    margin: "0 0 6px",
  },
  referralLinkValue: {
    fontSize: 13,
    color: colors.whiteMuted,
    margin: "0 0 10px",
    wordBreak: "break-all" as const,
  },
  referralLinkAnchor: {
    color: colors.pinkLight,
    textDecoration: "underline",
  },
  referralCodeRow: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    margin: 0,
  },
  referralCodeBadge: {
    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', monospace",
    backgroundColor: "rgba(255,204,229,0.12)",
    color: colors.pink,
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.5px",
  },

  // Reward tiers
  tiersSection: {
    marginBottom: 20,
  },
  tierRow: {
    marginBottom: 8,
    backgroundColor: colors.tierBg,
    borderRadius: 8,
    border: `1px solid ${colors.tierBorder}`,
  },
  tierInvitesCol: {
    width: "35%",
    padding: "12px 16px",
    verticalAlign: "middle",
  },
  tierArrowCol: {
    width: "10%",
    padding: "12px 0",
    verticalAlign: "middle",
    textAlign: "center",
  },
  tierRewardCol: {
    width: "55%",
    padding: "12px 16px",
    verticalAlign: "middle",
  },
  tierInvites: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.whiteMuted,
    margin: 0,
  },
  tierInvitesGold: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.gold,
    margin: 0,
  },
  tierArrow: {
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
  tierReward: {
    fontSize: 13,
    color: colors.whiteMuted,
    margin: 0,
  },
  tierRewardGold: {
    fontSize: 13,
    color: colors.gold,
    fontWeight: 600,
    margin: 0,
  },

  // Founder note
  founderNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    lineHeight: "1.6",
    margin: 0,
  },
  founderNoteUnderline: {
    textDecoration: "underline",
    textDecorationColor: "rgba(255,255,255,0.3)",
    color: "rgba(255,255,255,0.55)",
  },

  // ── Divider ──
  divider: {
    borderColor: "rgba(255,255,255,0.06)",
    margin: "0 0 24px",
  },

  // ── Footer ──
  footer: {
    textAlign: "center",
  },
  footerBrand: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    fontSize: 18,
    color: colors.pink,
    margin: "0 0 12px",
    letterSpacing: "-0.2px",
  },
  footerLinks: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    margin: "0 0 8px",
  },
  footerLink: {
    color: "rgba(255,255,255,0.45)",
    textDecoration: "none",
  },
  footerAddress: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    margin: 0,
    lineHeight: "1.5",
  },
};

export default WelcomeEmail;
