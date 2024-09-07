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
    async headers() {
        return [
            {
                source: '/api/og',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                ],
            },
        ]
    },
};

export default nextConfig;
