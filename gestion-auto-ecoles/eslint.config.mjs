import nextConfig from "eslint-config-next";

const config = [...nextConfig, { ignores: ["src/generated/**"] }];

export default config;
