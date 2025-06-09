import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'EGFree',
        short_name: 'EGFree',
        description: 'Permanently claimable free games for the Epic Games Store',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
            {
                src: 'https://wolfey.s-ul.eu/lfBMCvMe',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: "https://wolfey.s-ul.eu/Cog7XGVP",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable"
            },
        ],
    }
}