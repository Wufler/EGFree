import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'EGFree',
        short_name: 'EGFree',
        description: 'Permanently claimable free games for the Epic Games Store',
        start_url: '/',
        display: 'standalone',
        background_color: '#101014',
        theme_color: '#101014',
        icons: [
            {
                src: '/512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: "/192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable"
            },
        ],
    }
}