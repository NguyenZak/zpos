/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/v1/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/v2/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/v1/register",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/v2/register",
        destination: "/register",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
