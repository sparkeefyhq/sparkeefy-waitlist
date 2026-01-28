"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaInstagram,
  FaRedditAlien,
  FaDiscord,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import { useMediaQuery } from "react-responsive";

const CustomSignalIcon = ({ className }: { className?: string }) => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 23 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.5 2.15632C9.83053 2.15707 8.19176 2.60502 6.75414 3.45358C5.31653 4.30214 4.13258 5.52031 3.32547 6.98138C2.51835 8.44245 2.11754 10.093 2.16474 11.7615C2.21194 13.4299 2.70541 15.0552 3.59383 16.4683L2.69505 20.3029L6.52795 19.4044C7.75406 20.1797 9.1439 20.6591 10.5874 20.8044C12.0309 20.9498 13.4884 20.7571 14.8446 20.2417C16.2007 19.7264 17.4182 18.9024 18.4007 17.8351C19.3831 16.7678 20.1036 15.4865 20.5049 14.0926C20.9063 12.6988 20.9775 11.2306 20.7131 9.80445C20.4486 8.37827 19.8556 7.03324 18.9812 5.87587C18.1067 4.71849 16.9747 3.78054 15.6748 3.13631C14.375 2.49207 12.943 2.15924 11.4922 2.16416L11.5 2.15632ZM6.15955 20.4623L4.61803 20.8228L4.86363 21.8676L6.00017 21.6064C6.86214 22.0713 7.78078 22.4226 8.7331 22.6513L8.99438 21.6064C7.99816 21.3644 7.04299 20.9771 6.15955 20.4571V20.4623ZM1.13263 18.127L2.17773 18.37L2.53567 16.8262C2.0121 15.9465 1.62204 14.994 1.37823 13.9998L0.333128 14.261C0.569268 15.2131 0.925727 16.1313 1.3939 16.9934L1.13263 18.1296V18.127ZM3.66176 21.0396L1.43571 21.562L1.95825 19.3365L0.913157 19.0935L0.390608 21.3165C0.356496 21.4551 0.350314 21.5991 0.372421 21.7402C0.394529 21.8812 0.444484 22.0164 0.519377 22.138C0.594271 22.2596 0.692605 22.365 0.808655 22.4482C0.924704 22.5314 1.05615 22.5906 1.19533 22.6225C1.35674 22.6616 1.52512 22.6616 1.68653 22.6225L3.91259 22.1001L3.66699 21.0396H3.66176ZM9.93235 1.18722C10.9717 1.0318 12.0283 1.0318 13.0676 1.18722L13.214 0.129294C12.0708 -0.0430981 10.9083 -0.0430981 9.76514 0.129294L9.92974 1.19244L9.93235 1.18722ZM21.35 5.55474L20.4277 6.10851C20.9674 7.00116 21.3699 7.96974 21.6218 8.98188L22.6669 8.72066C22.3944 7.60032 21.954 6.52764 21.3605 5.53906L21.35 5.55474ZM3.11048 5.31703C3.73176 4.47194 4.4759 3.72444 5.31824 3.09931L4.6729 2.23208C3.74348 2.91579 2.9233 3.73666 2.24043 4.6666L3.10786 5.31181L3.11048 5.31703ZM17.6818 3.09931C18.5247 3.72052 19.2698 4.46454 19.8921 5.30658L20.7596 4.6666C20.0771 3.73871 19.2578 2.91963 18.3297 2.2373L17.6818 3.09931ZM19.8921 17.6699C19.2698 18.5119 18.5247 19.256 17.6818 19.8772L18.3219 20.7444C19.2518 20.0615 20.0735 19.2426 20.7596 18.3151L19.8921 17.6699ZM13.0624 21.8023C12.0233 21.9604 10.9662 21.9604 9.92713 21.8023L9.76514 22.8707C10.9074 23.0431 12.0691 23.0431 13.2113 22.8707L13.0494 21.8023H13.0624ZM22.6669 14.2584L21.6218 13.9972C21.3706 15.0166 20.9672 15.9923 20.4251 16.8915L21.3474 17.4453C21.9461 16.4559 22.391 15.3814 22.6669 14.2584ZM21.9249 11.4974C21.9251 12.022 21.8858 12.5459 21.8073 13.0647L22.8707 13.2266C23.0431 12.0846 23.0431 10.9232 22.8707 9.7812L21.8073 9.94315C21.886 10.4619 21.9253 10.9858 21.9249 11.5104V11.4974ZM17.4466 21.3452L16.8927 20.4231C15.9999 20.9626 15.0311 21.365 14.0187 21.6169L14.28 22.6617C15.4006 22.3894 16.4735 21.949 17.4623 21.3556L17.4466 21.3452ZM1.07776 11.4974C1.07778 10.9728 1.1162 10.449 1.19272 9.93009L0.129333 9.76814C-0.0431111 10.9101 -0.0431111 12.0716 0.129333 13.2136L1.19533 13.0594C1.11894 12.5405 1.08051 12.0167 1.08037 11.4922L1.07776 11.4974ZM1.65256 5.55474C1.05456 6.54349 0.609705 7.61706 0.333128 8.73895L1.37823 9.00016C1.62938 7.98284 2.03187 7.00897 2.57225 6.11112L1.65256 5.55474ZM14.2591 0.333042L13.9978 1.3779C15.0174 1.63014 15.9933 2.03433 16.8927 2.57688L17.4492 1.65479C16.4585 1.05613 15.3829 0.610525 14.2591 0.333042ZM8.73833 0.333042L8.9996 1.3779C7.98085 1.63039 7.00585 2.03457 6.10729 2.57688L5.55339 1.65479C6.54349 1.05729 7.61811 0.612568 8.74094 0.335654L8.73833 0.333042Z"
      fill="white"
    />
  </svg>
);

const CustomWhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill="currentColor"
    />
  </svg>
);

const Footer = () => {
  const socialDatabase = [
    { Icon: FaInstagram, link: "#", hoverColor: "hover:bg-[#E1306C]" },
    {
      Icon: CustomWhatsAppIcon,
      link: "#",
      iconClass: "w-4.5 h-4.5",
      hoverColor: "hover:bg-[#25D366]",
    },
    { Icon: FaRedditAlien, link: "#", hoverColor: "hover:bg-[#FF4500]" },
    { Icon: CustomSignalIcon, link: "#", hoverColor: "hover:bg-[#3A76F0]" },
    { Icon: FaDiscord, link: "#", hoverColor: "hover:bg-[#5865F2]" },
    { Icon: FaLinkedinIn, link: "#", hoverColor: "hover:bg-[#0A66C2]" },
    {
      Icon: FaXTwitter,
      link: "#",
      hoverColor: "hover:bg-white hover:text-black",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Robust Media Query via react-responsive (Handles scaling/zoom better)
  const [mounted, setMounted] = React.useState(false);
  const isTallScreen = useMediaQuery({ minHeight: 800 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="relative w-full bg-[#010302] pt-4 md:pt-10 pb-0 overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="max-w-[69rem] px-4 md:px-0 mx-auto relative z-10"
      >
        <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-24">
          {/* Left Side: Brand & Socials */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-5 md:gap-4 max-w-md"
          >
            <div className="flex flex-col max-md:items-center gap-2 md:gap-3 select-none">
              <Link href="/" className="group">
                <motion.span
                  initial="initial"
                  whileInView="visible"
                  whileHover="hover"
                  viewport={{ once: true }}
                  className="flex items-center gap-2.5 md:gap-2"
                >
                  <motion.div
                    variants={{
                      initial: { scale: 0, opacity: 0 },
                      visible: {
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                        },
                      },
                      hover: {
                        scale: [1, 1.1, 1],
                        opacity: [1, 1, 1],
                        transition: {
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      },
                    }}
                    className="relative w-10 h-10 md:w-8 md:h-8"
                  >
                    <Image
                      src="/logo-heart.svg"
                      alt="Sparkeefy Heart"
                      fill
                      className="object-contain"
                    />
                  </motion.div>
                  <div className="relative h-12 w-32 md:h-10 md:w-28">
                    <Image
                      src="/logo-text.svg"
                      alt="Sparkeefy Text"
                      fill
                      className="object-contain"
                    />
                  </div>
                </motion.span>
              </Link>
              <p className="text-white/80 text-base md:text-sm font-normal">
                Helps you keep the spark alive.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex flex-wrap max-md:justify-center gap-2 max-md:hidden">
              {socialDatabase.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white transition-all duration-300 group ${
                    item.hoverColor || "hover:bg-white/30"
                  }`}
                >
                  <item.Icon
                    className={`${
                      item.iconClass || "w-5 h-5"
                    } group-hover:scale-110 transition-all duration-300`}
                  />
                </Link>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-wrap gap-3 mt-2 max-md:justify-center max-md:hidden">
              <Link
                href="#"
                className="hover:scale-105 transition-all duration-300"
              >
                <Image
                  src="/img/app-store.png"
                  alt="Download on the App Store"
                  width={145}
                  height={45}
                />
              </Link>
              <Link
                href="#"
                className="hover:scale-105 transition-all duration-300"
              >
                <Image
                  src="/img/google-play.png"
                  alt="Get it on Google Play"
                  width={145}
                  height={45}
                />
              </Link>
            </div>
          </motion.div>

          {/* Right Side: Navigation */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col text-xl md:text-base md:flex-row flex-wrap gap-6 md:gap-12 text-white max-md:items-center mb-4 md:mb-0"
          >
            <div className="flex flex-col max-md:items-center gap-3">
              <Link
                href="#"
                className="font-semibold md:font-bold hover:text-pink-300 text-white max-md:mb-2"
              >
                Home
              </Link>
              <Link href="#" className="hover:text-pink-300 text-gray-200">
                Features
              </Link>
              <Link href="#" className="hover:text-pink-300 text-gray-200">
                Who is Sparkeefy for
              </Link>
              <Link href="#" className="hover:text-pink-300 text-gray-200">
                FAQs
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {/* <Link href="#" className="font-semibold md:font-bold">
                Privacy
              </Link> */}
              <Link
                href="#"
                className="font-semibold md:font-bold hover:text-pink-300 text-white"
              >
                About
              </Link>
            </div>
            <div className="flex flex-col gap-4 lg:ms-8">
              <Link
                href="#"
                className="text-[#FF0080] font-semibold md:font-bold hover:text-pink-400"
              >
                Join Waitlist
              </Link>
            </div>
          </motion.div>

          {/* For Mobile */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-5 md:gap-4 max-w-md md:hidden"
          >
            {/* Social Icons */}
            <div className="flex flex-wrap max-md:justify-center gap-2">
              {socialDatabase.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white transition-all duration-300 group ${
                    item.hoverColor || "hover:bg-white/30"
                  }`}
                >
                  <item.Icon
                    className={`${
                      item.iconClass || "w-5 h-5"
                    } group-hover:scale-110 transition-all duration-300`}
                  />
                </Link>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-wrap gap-3 mt-2 max-md:justify-center">
              <Link
                href="#"
                className="hover:scale-105 transition-all duration-300"
              >
                <Image
                  src="/img/app-store.png"
                  alt="Download on the App Store"
                  width={145}
                  height={45}
                />
              </Link>
              <Link
                href="#"
                className="hover:scale-105 transition-all duration-300"
              >
                <Image
                  src="/img/google-play.png"
                  alt="Get it on Google Play"
                  width={145}
                  height={45}
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Large Text & Gradient Background */}
      <div
        className={`relative w-full flex justify-center items-end pointer-events-none 
        ${isTallScreen ? "h-[38rem] -mt-60" : "h-[20.875rem] md:h-[28rem] -mt-48 md:-mt-34"}
      `}
      >
        {/* Gradient Image */}
        <div className="absolute bottom-0 left-0 w-full h-full z-0 opacity-100 mix-blend-normal">
          <Image
            src="/img/footer-gradient-bg.png"
            alt="Gradient Background"
            layout="fill"
            objectFit="cover"
            objectPosition={`${isTallScreen ? "top" : "bottom"}`}
            priority
            className="hidden md:block"
          />
          <Image
            src="/img/footer-gradient-bg-mobile.png"
            alt="Gradient Background"
            layout="fill"
            objectFit="cover"
            objectPosition="top"
            priority
            className="md:hidden"
          />
        </div>

        {/* Text */}
        <h1 className="relative max-md:mb-4 z-10 text-[3.25rem] md:text-[11rem] font-deli text-[rgba(255,255,255,0.12)] md:tracking-tight leading-none select-none">
          #SPARKITUP
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
