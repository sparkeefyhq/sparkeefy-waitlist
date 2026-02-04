import { FaInstagram, FaWhatsapp, FaReddit, FaSnapchat, FaDiscord, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { socialLinks } from "@/lib/config/waitlist.config";

const iconMap = {
  FaInstagram,
  FaWhatsapp,
  FaReddit,
  FaSnapchat,
  FaDiscord,
  FaLinkedin,
  FaXTwitter
};

export default function SocialIcons() {
  return (
    <div className="flex items-center justify-center gap-[13px]">
      {socialLinks.map((social) => {
        const Icon = iconMap[social.icon as keyof typeof iconMap];

        return (
          <a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className="flex items-center justify-center size-12 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
          >
            <Icon className="size-6" />
          </a>
        );
      })}
    </div>
  );
}
