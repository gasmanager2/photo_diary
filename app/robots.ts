// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    // 본인의 Vercel 배포 주소로 변경해 주세요 (예: https://your-app.vercel.app/sitemap.xml)
    sitemap: 'https://myphotodiary.vercel.app/sitemap.xml',
  };
}