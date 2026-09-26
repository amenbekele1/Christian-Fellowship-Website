/**
 * Fellowship social accounts, in one place so the footer, contact page and
 * anywhere else stay in step.
 *
 * URLs are stored clean — share-sheet tracking parameters (`si=`,
 * `utm_source=`) are stripped, since they tag every visitor as having come
 * from whoever originally copied the link.
 */
export interface SocialLink {
  key: string;
  label: string;
  /** Shown as the accessible name, e.g. "Warsaw Ethiopian Fellowship on YouTube" */
  handle: string;
  url: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    key: "youtube",
    label: "YouTube",
    handle: "@warsawethiopianfellowship",
    url: "https://www.youtube.com/@warsawethiopianfellowship",
  },
  {
    key: "instagram",
    label: "Instagram",
    handle: "@warsaw_fellowship",
    url: "https://www.instagram.com/warsaw_fellowship/",
  },
];
