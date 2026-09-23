import React from "react";

interface Company {
  name: string;
  icon: React.ReactNode;
}

const COMPANIES: Company[] = [
  {
    name: "Flipkart",
    icon: <img src="/logos/flipkart.png" alt="Flipkart" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />,
  },
  {
    name: "Apple",
    icon: (
      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#003B2D]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.92-.91.04-2.02.6-2.66 1.37-.57.67-.99 1.77-.85 2.82 1.02.08 2.06-.51 2.57-1.27z" />
      </svg>
    ),
  },
  {
    name: "Zepto",
    icon: <img src="/logos/zepto-icon.png" alt="Zepto" loading="lazy" decoding="async" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />,
  },
  {
    name: "Physics Wallah",
    icon: <img src="/logos/physicswallah.png" alt="Physics Wallah" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />,
  },
  {
    name: "Google",
    icon: <img src="/logos/google.png" alt="Google" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />,
  },
  {
    name: "Microsoft",
    icon: <img src="/logos/microsoft.png" alt="Microsoft" loading="lazy" decoding="async" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />,
  },
  {
    name: "Amazon",
    icon: <img src="/logos/amazon.png" alt="Amazon" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />,
  },
  {
    name: "Atlassian",
    icon: (
      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#003B2D]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.648 2.001c-.278 0-.533.15-.668.397L3.57 10.68a.79.79 0 0 0 .7.119h4.378V2.001zm.705 19.998c.278 0 .533-.15.668-.397l4.41-8.282a.79.79 0 0 0-.7-.119H9.353V22z" />
      </svg>
    ),
  },
  {
    name: "Razorpay",
    icon: <img src="/logos/razorpay.png" alt="Razorpay" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />,
  },
  {
    name: "DRDO",
    icon: <img src="/logos/drdo.png" alt="DRDO" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />,
  },
  {
    name: "Emergent",
    icon: <img src="/logos/emergent.png" alt="Emergent" loading="lazy" decoding="async" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md" />,
  },
];

export const CompanyMarquee: React.FC = React.memo(() => {
  return (
    <section className="pt-10 sm:pt-14 md:pt-16 pb-8 sm:pb-12 md:pb-14 relative overflow-hidden">
      {/* Editorial Header */}
      <div className="text-center mb-10 sm:mb-14 px-4 relative z-10">
        <p className="text-xs sm:text-sm font-semibold text-[#0F6B38] mb-3 tracking-[0.2em] uppercase font-sans">
          Trusted by top candidates & recruiters
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-[3.25rem] font-normal text-zinc-900 tracking-tight leading-[1.12]">
          Prepare interviews for{" "}
          <span className="italic text-[#0F6B38] font-normal">companies like</span>
        </h2>
      </div>

      {/* Single Line Marquee Track */}
      <div className="relative w-full overflow-hidden select-none py-2">
        {/* Soft edge fade masks matching the off-white container */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-36 md:w-48 bg-gradient-to-r from-[#f8faf9] via-[#f8faf9]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-36 md:w-48 bg-gradient-to-l from-[#f8faf9] via-[#f8faf9]/80 to-transparent z-10 pointer-events-none" />

        {/* Single Row Infinite Glide */}
        <div className="flex w-max marquee-single-row">
          <div className="flex items-center gap-16 sm:gap-22 lg:gap-28 animate-marquee-glide shrink-0 pr-16 sm:pr-22 lg:pr-28">
            {COMPANIES.map((company, index) => (
              <div
                key={`col1-${index}`}
                className="flex items-center gap-3 sm:gap-3.5 text-[#003B2D] hover:opacity-100 transition-opacity duration-200 cursor-default select-none shrink-0"
              >
                <div className="text-[#003B2D] flex items-center justify-center shrink-0">
                  {company.icon}
                </div>
                <span className="text-[20px] sm:text-[23px] lg:text-[25px] font-bold tracking-tight text-[#003B2D] whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>

          {/* Duplicate for seamless infinite loop */}
          <div
            className="flex items-center gap-16 sm:gap-22 lg:gap-28 animate-marquee-glide shrink-0 pr-16 sm:pr-22 lg:pr-28"
            aria-hidden="true"
          >
            {COMPANIES.map((company, index) => (
              <div
                key={`col2-${index}`}
                className="flex items-center gap-3 sm:gap-3.5 text-[#003B2D] hover:opacity-100 transition-opacity duration-200 cursor-default select-none shrink-0"
              >
                <div className="text-[#003B2D] flex items-center justify-center shrink-0">
                  {company.icon}
                </div>
                <span className="text-[20px] sm:text-[23px] lg:text-[25px] font-bold tracking-tight text-[#003B2D] whitespace-nowrap">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee Smooth CSS Animation */}
      <style>{`
        @keyframes marquee-glide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-glide {
          animation: marquee-glide 42s linear infinite;
          will-change: transform;
        }
        .marquee-single-row:hover .animate-marquee-glide {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
});

export default CompanyMarquee;
