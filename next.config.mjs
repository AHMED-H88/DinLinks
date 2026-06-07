import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage CDN (new)
      { protocol: "https", hostname: "*.supabase.co" },
      // Cloudinary — kept during transition; remove after all images migrated
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Unsplash (used in mock data)
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
