import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'EG Free Games',
        short_name: 'EGFree',
        description: 'Claimable free games for the Epic Games Store',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
            {
                src: 'https://wolfey.s-ul.eu/x4yck6GI',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: "https://wolfey.s-ul.eu/LFN7sKxg",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable"
            },
        ],
    }
}