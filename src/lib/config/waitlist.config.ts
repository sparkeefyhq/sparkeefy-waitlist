export const waitlistContent = {
  badge: {
    emoji: "\u{1F497}",
    brandRetro: "Sparkee",
    brandBold: "fy",
    suffix: " is launching soon"
  },

  heading: {
    prefix: "Start ",
    highlight: "Caring",
    suffix: " better, effortlessly"
  },

  subheading: {
    text: "Get early access to a simpler way to remember, communicate, and show up  for the ",
    boldText: "people you care about."
  },

  form: {
    title: "Join Early Access",
    description: "Be among the first to try Sparkeefy and start showing up more  thoughtfully.",
    emailPlaceholder: "E-mail",
    submitButton: "Join"
  }
} as const;

export const socialLinks = [
  {
    id: "instagram",
    name: "Instagram",
    url: "https://instagram.com/sparkeefy",
    icon: "FaInstagram"
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    url: "https://wa.me/?text=Check%20out%20Sparkeefy",
    icon: "FaWhatsapp"
  },
  {
    id: "reddit",
    name: "Reddit",
    url: "https://reddit.com/submit?url=sparkeefy.com&title=Sparkeefy",
    icon: "FaReddit"
  },
  {
    id: "snapchat",
    name: "Snapchat",
    url: "https://snapchat.com/add/sparkeefy",
    icon: "FaSnapchat"
  },
  {
    id: "discord",
    name: "Discord",
    url: "https://discord.gg/sparkeefy",
    icon: "FaDiscord"
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://linkedin.com/company/sparkeefy",
    icon: "FaLinkedin"
  },
  {
    id: "x",
    name: "X",
    url: "https://x.com/sparkeefy",
    icon: "FaXTwitter"
  }
] as const;

export const successContent = {
  congratulations: "Congratulations",
  youreIn: "You're In.",
  confirmed: "Early Access Confirmed.",
  description: {
    text: "We'll reach out when ",
    brandRetro: "Sparkee",
    brandBold: "fy",
    suffix: " is ready",
    boldText: "no spam, no unnecessary notifications.",
  },
} as const;

export type WaitlistContent = typeof waitlistContent;
export type SuccessContent = typeof successContent;
export type SocialLink = (typeof socialLinks)[number];
