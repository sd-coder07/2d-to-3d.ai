import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = "https://2d-to-3d-model.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Primary SEO ──────────────────────────────────────────────
  title: {
    default: "Free 2D Image to 3D Model Generator — AI Online Tool | 3DGen AI",
    template: "%s | 3DGen AI",
  },
  description:
    "Convert any 2D photo to a free 3D model online in seconds. Our AI-powered 3D model generator turns JPG, PNG or WEBP images into downloadable GLB / glTF 2.0 meshes with PBR textures — no signup required.",
  keywords: [
    "free 2d image to 3d model generate",
    "2d to 3d model generator",
    "image to 3d model free",
    "ai 3d model generator",
    "photo to 3d model online",
    "convert image to 3d model",
    "free 3d model from photo",
    "3d model generator ai",
    "TripoSR online",
    "InstantMesh free",
    "GLB download free",
    "glTF 2.0 generator",
    "3d mesh from image",
    "ai 3d reconstruction",
    "free 3d model creator",
    "upload image get 3d model",
    "neural 3d reconstruction",
    "blender 3d model generator",
    "unity 3d model from photo",
    "unreal engine asset generator",
  ],

  // ── Canonical & Alternates ────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Robots ───────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Icons ────────────────────────────────────────────────────
  icons: {
    icon: "/favicon-3d.png",
    shortcut: "/favicon-3d.png",
    apple: "/apple-touch-icon.png",
  },

  // ── Google Search Console verification ───────────────────────
  verification: {
    google: "lGh4hvVQCz6I8QQjLh8LI22jjr4aGkhG-s_QJ4RPVz0",
  },

  // ── Open Graph ────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "3DGen AI — Free 2D to 3D Model Generator",
    title: "Free 2D Image to 3D Model Generator — AI Online Tool",
    description:
      "Upload any 2D photo and get a free downloadable GLB 3D model in seconds. Powered by TripoSR, InstantMesh & Image-to-3D AI. No account needed.",
    images: [
      {
        url: `${BASE_URL}/sample_3d_work.png`,
        width: 1200,
        height: 630,
        alt: "Free AI 2D to 3D model generator — sample 3D mesh output",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Free 2D Image to 3D Model Generator — AI Online Tool",
    description:
      "Convert any JPG or PNG photo into a textured 3D GLB model for free. No signup. Powered by open-source AI.",
    images: [`${BASE_URL}/sample_3d_work.png`],
    creator: "@3DGenAI",
  },
};

// ── JSON-LD Structured Data ─────────────────────────────────────
const jsonLdWebApplication = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "3DGen AI — Free 2D to 3D Model Generator",
  url: BASE_URL,
  description:
    "Free AI-powered tool that converts any 2D image (JPG, PNG, WEBP) into a downloadable 3D model (GLB / glTF 2.0) in seconds using TripoSR, InstantMesh, and Image-to-3D neural networks.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "2D image to 3D model conversion",
    "Free GLB / glTF 2.0 download",
    "PBR texture & UV map generation",
    "Multiple AI models: TripoSR, InstantMesh, Image-to-3D",
    "No signup required",
    "Blender, Unity, Unreal Engine compatible",
  ],
};

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I convert a 2D image to a 3D model for free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload your JPG, PNG, or WEBP image to 3DGen AI, choose an AI model (TripoSR is fastest), and click Generate. Your free GLB 3D model is ready in under 15 seconds — no account required.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats does the 3D model generator output?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The generator outputs GLB (glTF 2.0) files, which are compatible with Blender, Unity 3D, Unreal Engine 5, and all major WebGL viewers.",
      },
    },
    {
      "@type": "Question",
      name: "Is 3DGen AI really free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — 3DGen AI is completely free. It is powered by Hugging Face ZeroGPU open-source AI models. No signup, no credit card, no watermarks.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI model should I pick for 2D to 3D conversion?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TripoSR (~5 s) is the fastest and best for most images. InstantMesh (~15 s) produces higher-detail geometry from multi-view AI. Image-to-3D (~10 s) is great for clean UV maps.",
      },
    },
    {
      "@type": "Question",
      name: "What kind of images work best for 2D to 3D conversion?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Single-subject images with a clean or simple background work best — characters, weapons, vehicles, furniture, statues, and product shots. Supported formats: JPG, PNG, WEBP up to 10 MB.",
      },
    },
  ],
};

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: BASE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Free 2D to 3D Generator",
      item: `${BASE_URL}/#generator-section`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Icons */}
        <link rel="icon" href="/favicon-3d.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApplication) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="bg-emerald-void" aria-hidden="true" />
        <div className="bg-emerald-gradient" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
