/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
      bodySizeLimit: "25mb",
    },
    optimizeCss: false,
  },
  swcMinify: true,

  modularizeImports: {
    "@cortex/lib/": {
      transform: "@cortex/lib/{{member}}",
    },
    "@nous/lib/": {
      transform: "@nous/lib/{{member}}",
    },
  },

  transpilePackages: ["@cortex/lib", "@nous/lib", "@shared"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        "newrelic",
        "@newrelic/native-metrics",
        "node-gyp",
        "npm",
      ];
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        "node-gyp": false,
        npm: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "@cortex": "/app/src/lib/cortex",
      "@nous": "/app/src/lib/nous",
      "@shared": "/app/src/lib/shared",
    };
    return config;
  },

  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ],

  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },

  images: {
    domains: [],
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
