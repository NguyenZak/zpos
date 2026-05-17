/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/v2/login",
        permanent: false,
      },
      {
        source: "/register",
        destination: "/v2/register",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
