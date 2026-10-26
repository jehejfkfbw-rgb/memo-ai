import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconLamp = (p: P) => (
  <Svg {...p}>
    <path d="M9 3h6l3 7H6l3-7Z" />
    <path d="M12 10v6" />
    <path d="M8 20h8l-1.4-4H9.4L8 20Z" />
    <path d="M4 6.5 2.5 5.5M20 6.5l1.5-1M12 1.5V3" />
  </Svg>
);

export const IconBook = (p: P) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5" />
    <path d="M9 7.5h6M9 11h4" />
  </Svg>
);

export const IconSeedling = (p: P) => (
  <Svg {...p}>
    <path d="M12 21v-8" />
    <path d="M12 13c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" />
    <path d="M12 15c0-2.8-2.2-5-5-5 0 2.8 2.2 5 5 5Z" />
  </Svg>
);

export const IconCompass = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </Svg>
);

export const IconFlask = (p: P) => (
  <Svg {...p}>
    <path d="M9 3h6M10 3v6.5L5.6 17A2 2 0 0 0 7.3 20h9.4a2 2 0 0 0 1.7-3L14 9.5V3" />
    <path d="M7.5 15h9" />
  </Svg>
);

export const IconGraduation = (p: P) => (
  <Svg {...p}>
    <path d="m12 4 9 4.5-9 4.5-9-4.5L12 4Z" />
    <path d="M6.5 10.8V16c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-5.2" />
    <path d="M21 8.5v5" />
  </Svg>
);

export const IconSpark = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5L10.1 13 4.5 11l5.6-2L12 3.5Z" />
  </Svg>
);

export const IconPlay = (p: P) => (
  <Svg {...p}>
    <path d="M7 4.8v14.4l12-7.2-12-7.2Z" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const IconCheckCircle = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.3 2.6 2.6L16.2 9" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Svg>
);

export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m5 9 7 7 7-7" />
  </Svg>
);

export const IconArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M20 12H4" />
    <path d="m10 6-6 6 6 6" />
  </Svg>
);

export const IconUser = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </Svg>
);

export const IconUsers = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19.5a6 6 0 0 1 12 0" />
    <path d="M16 5.4a3.2 3.2 0 0 1 0 6.2M17.5 14.6a5.8 5.8 0 0 1 3.5 4.9" />
  </Svg>
);

export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </Svg>
);

export const IconChart = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h16" />
    <path d="M7 20v-6M12 20V6M17 20v-9" />
  </Svg>
);

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const IconStar = (p: P) => (
  <Svg {...p}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.7l5.4-.8L12 4Z" />
  </Svg>
);

export const IconTrophy = (p: P) => (
  <Svg {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.5H5.5V7A3 3 0 0 0 8 9.9M16 5.5h2.5V7A3 3 0 0 1 16 9.9" />
    <path d="M12 13v3.5M9 20h6l-.6-3.5H9.6L9 20Z" />
  </Svg>
);

export const IconLayers = (p: P) => (
  <Svg {...p}>
    <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
    <path d="m4 12.5 8 4.2 8-4.2M4 17l8 4.2 8-4.2" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconEdit = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" />
    <path d="m13.5 7.5 3 3" />
  </Svg>
);

export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V5h5v2" />
    <path d="M6.5 7l.8 12.2A1.8 1.8 0 0 0 9.1 21h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Svg>
);

export const IconLogout = (p: P) => (
  <Svg {...p}>
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7" />
    <path d="M16.5 8.5 20 12l-3.5 3.5M20 12H10" />
  </Svg>
);

export const IconQuiz = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.4" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </Svg>
);

export const IconCertificate = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="9.5" r="5" />
    <path d="m9.5 13.8-1 6.2 3.5-2 3.5 2-1-6.2" />
    <path d="m10.5 9.3 1 1.2 2.2-2.4" />
  </Svg>
);

export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
    <path d="M10.2 18.5a2 2 0 0 0 3.6 0" />
  </Svg>
);

export const IconMail = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
    <path d="m3.8 7 7.3 5.4a1.6 1.6 0 0 0 1.8 0L20.2 7" />
  </Svg>
);

export const IconPhone = (p: P) => (
  <Svg {...p}>
    <path d="M6.2 3.5h3l1.4 3.6-2 1.4a11 11 0 0 0 5 5l1.4-2 3.6 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
  </Svg>
);

export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.2 19 6v6c0 4.2-2.9 7.4-7 8.8-4.1-1.4-7-4.6-7-8.8V6l7-2.8Z" />
    <path d="m9 12 2.2 2.2L15.3 10" />
  </Svg>
);

export const IconSettings = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.2a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.5 6.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1A1.6 1.6 0 0 0 10.2 3v-.2a2 2 0 1 1 4 0V3a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" />
  </Svg>
);

export const IconTarget = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
);

export const IconFile = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 3.5H7A2 2 0 0 0 5 5.5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5.5-5.5Z" />
    <path d="M13.5 3.5V9H19" />
  </Svg>
);

export const IconFilter = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h16l-6.2 7.3V19l-3.6 2v-7.7L4 6Z" />
  </Svg>
);

export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconMailOpen = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 10.5 12 4l8.5 6.5V19a1.8 1.8 0 0 1-1.8 1.8H5.3A1.8 1.8 0 0 1 3.5 19v-8.5Z" />
    <path d="m3.5 10.5 7.6 5.2a1.6 1.6 0 0 0 1.8 0l7.6-5.2" />
  </Svg>
);

export const IconBookOpen = (p: P) => (
  <Svg {...p}>
    <path d="M12 6.5C10.5 5 8.4 4.3 4.5 4.3V18c3.9 0 6 .7 7.5 2.2 1.5-1.5 3.6-2.2 7.5-2.2V4.3c-3.9 0-6 .7-7.5 2.2Z" />
    <path d="M12 6.5v13.7" />
  </Svg>
);

export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="4.8" y="10" width="14.4" height="10" rx="2.2" />
    <path d="M8.4 10V7.6a3.6 3.6 0 0 1 7.2 0V10" />
    <path d="M12 14v2.4" />
  </Svg>
);

export const IconTrend = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 17.5 9 12l3.5 3.5L20.5 7" />
    <path d="M15.5 7h5v5" />
  </Svg>
);

export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="2.2" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </Svg>
);

export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.4" />
  </Svg>
);

export const IconAlert = (p: P) => (
  <Svg {...p}>
    <path d="M10.6 4.2 2.9 17.5A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 1.4-2.5L13.4 4.2a1.6 1.6 0 0 0-2.8 0Z" />
    <path d="M12 9.5v4M12 16.6v.3" />
  </Svg>
);

export const STAGE_ICONS: Record<string, (p: P) => React.JSX.Element> = {
  seedling: IconSeedling,
  compass: IconCompass,
  flask: IconFlask,
  graduation: IconGraduation,
  spark: IconSpark,
  book: IconBook,
  layers: IconLayers,
};

export function StageIcon({ iconKey, ...props }: P & { iconKey?: string | null }) {
  const Cmp = STAGE_ICONS[iconKey ?? "book"] ?? IconBook;
  return <Cmp {...props} />;
}
