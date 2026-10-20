import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReferralPushEmailData } from "@/lib/services/EmailService";

// Same palette as WelcomeEmail.
const colors = {
  bg: "#0D0D0D",
  card: "#161616",
  cardBorder: "rgba(255,255,255,0.08)",
  pink: "#FFCCE5",
  pinkLight: "#FFE9F4",
  white: "#FFFFFF",
  whiteMuted: "rgba(255,255,255,0.75)",
  gold: "#F5C842",
};

// The reward tiers already promised in the welcome email; nothing new is offered.
const REWARD_TIERS = [
  { invites: 3, reward: "1 month Sparkeefy Pro" },
  { invites: 6, reward: "3 months Sparkeefy Pro" },
  { invites: 10, reward: "Founder Seat" },
];

export function ReferralPushEmail({ firstName, referralLink, referralCount }: ReferralPushEmailData) {
  const next = REWARD_TIERS.find((t) => t.invites > referralCount);
  const greeting = firstName ? `Hey ${firstName},` : "Hey,";

  return (
    <Html lang="en">
      <Head />
      <Preview>Invite friends to Sparkeefy and get in sooner.</Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.card}>
            <Text style={styles.brand}>Sparkeefy</Text>
            <Text style={styles.text}>{greeting}</Text>
            <Text style={styles.text}>
              Thanks for joining the Sparkeefy waitlist. We&apos;re letting people in batch by batch,
              and the fastest way in is to bring friends who&apos;d genuinely find it useful.
            </Text>
            <Text style={styles.text}>
              You&apos;ve invited <strong style={{ color: colors.white }}>{referralCount}</strong>{" "}
              {referralCount === 1 ? "friend" : "friends"} so far.
              {next && (
                <>
                  {" "}
                  {next.invites - referralCount} more and you unlock{" "}
                  <strong style={{ color: colors.gold }}>{next.reward}</strong>.
                </>
              )}
            </Text>
            <Section style={{ textAlign: "center", margin: "28px 0" }}>
              <Button href={referralLink} style={styles.cta}>
                Share your invite link →
              </Button>
              <Text style={styles.link}>{referralLink}</Text>
            </Section>
            <Text style={styles.text}>See you inside,<br />Team Sparkeefy</Text>
          </Section>
          <Hr style={styles.divider} />
          <Text style={styles.footer}>
            You&apos;re receiving this because you joined the waitlist at sparkeefy.com and opted in to updates.
            Reply &quot;stop&quot; and we won&apos;t send these again.
          </Text>
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
  outer: { maxWidth: 600, margin: "0 auto", padding: "40px 16px 48px" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    border: `1px solid ${colors.cardBorder}`,
    padding: "40px 36px",
  },
  brand: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    fontSize: 24,
    color: colors.pink,
    margin: "0 0 20px",
  },
  text: { fontSize: 16, lineHeight: "1.6", color: colors.whiteMuted, margin: "0 0 16px" },
  cta: {
    backgroundColor: colors.pink,
    color: "#0D0D0D",
    borderRadius: 100,
    fontSize: 16,
    fontWeight: 700,
    padding: "14px 36px",
    textDecoration: "none",
    display: "inline-block",
  },
  link: { fontSize: 12, color: colors.pinkLight, margin: "12px 0 0", wordBreak: "break-all" },
  divider: { borderColor: "rgba(255,255,255,0.06)", margin: "24px 0" },
  footer: { fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: "1.5", textAlign: "center", margin: 0 },
};

export default ReferralPushEmail;
