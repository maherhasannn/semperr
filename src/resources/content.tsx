import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Semperr",
  lastName: "",
  name: "Semperr",
  role: "Data Brokerage for Law Firms",
  avatar: "/images/avatar.jpg",
  email: "join@semperr.com",
  location: "America/New_York",
  languages: [],
};

const newsletter: Newsletter = {
  display: false,
  title: <></>,
  description: <></>,
};

const social: Social = [
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/company/semperr/",
    essential: true,
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: "Semperr | The Case Rests With Us",
  description: "Semperr is a data brokerage that helps law firms drive lead volume and connect with higher-value clients.",
  headline: <>The Case Rests With Us</>,
  featured: {
    display: false,
    title: <></>,
    href: "",
  },
  subline: (
    <>
      Top firms don't chase clients — they choose them. Semperr delivers <Text as="span" weight="strong">pre-qualified, high-intent leads</Text> so your team stays focused on the cases that matter.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: "About - Built for Firms That Win | Semperr",
  description: "Learn how Semperr helps law firms grow through data-driven lead generation.",
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://cal.com/maherhasan",
  },
  intro: {
    display: true,
    title: "Who We Are",
    description: (
      <>
        Semperr is a data brokerage built for the legal industry. We connect law firms with
        pre-qualified, high-intent leads — people actively seeking legal representation. Our
        proprietary data sourcing and matching technology means your intake team spends less time
        on cold outreach and more time signing retainers.
      </>
    ),
  },
  work: {
    display: true,
    title: "How We Work",
    experiences: [
      {
        company: "Data Sourcing",
        timeframe: "Step 1",
        role: "Proprietary Lead Intelligence",
        achievements: [
          <>
            We aggregate and verify lead data from dozens of high-intent sources — court filings,
            search behavior, form submissions, and more — so every lead we deliver is real and relevant.
          </>,
          <>
            Our data team continuously refines targeting to match your firm's practice areas,
            geography, and ideal client profile.
          </>,
        ],
        images: [],
      },
      {
        company: "Lead Delivery",
        timeframe: "Step 2",
        role: "Seamless Integration",
        achievements: [
          <>
            Qualified leads are delivered directly to your intake team in real time via your
            preferred channel — CRM, email, phone, or custom API.
          </>,
          <>
            We work alongside your team to optimize conversion rates and ensure no opportunity
            falls through the cracks.
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: true,
    title: "Why Law Firms Choose Us",
    institutions: [
      {
        name: "Exclusive Partnerships",
        description: <>We limit the number of firms we work with per market to protect lead quality and your competitive advantage.</>,
      },
      {
        name: "Transparent Reporting",
        description: <>You always know where your leads come from, what they cost, and how they convert — no black boxes.</>,
      },
    ],
  },
  technical: {
    display: true,
    title: "Practice Areas We Serve",
    skills: [
      {
        title: "Personal Injury",
        description: (
          <>Auto accidents, slip and fall, medical malpractice, wrongful death — we source high-value PI leads at scale.</>
        ),
        tags: [],
        images: [],
      },
      {
        title: "Mass Tort",
        description: (
          <>From emerging litigations to established MDLs, we connect your firm with claimants who qualify.</>
        ),
        tags: [],
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Insights",
  title: "Insights — Sharper Strategies for Sharper Firms | Semperr",
  description: "Data-driven strategies, industry trends, and lead generation tactics for legal professionals.",
};

const work: Work = {
  path: "/work",
  label: "Resources",
  title: "ROI Calculator — Know Your Numbers | Semperr",
  description: "Tools and insights to help your firm measure and maximize lead generation ROI.",
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Request a Demo",
  title: "Request a Demo — See Semperr in Action",
  description: "Schedule a call to see how Semperr can deliver qualified leads to your firm.",
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "Law firm growth metrics",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "Client success story",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "Lead volume dashboard",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "Partner firm spotlight",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "Data sourcing process",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "Team collaboration",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "Industry event",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "Semperr platform",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
