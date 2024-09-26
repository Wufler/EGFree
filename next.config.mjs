/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn1.epicgames.com'
            },
            {
                protocol: 'https',
                hostname: 'wolfey.s-ul.eu'
            }
        ]
    },
};

export default nextConfig;
