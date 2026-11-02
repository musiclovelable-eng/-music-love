import { db } from '@/db';
import { releases } from '@/db/schema';

async function main() {
    const sampleReleases = [
        {
            artistId: 2,
            type: 'single',
            title: 'Midnight Thunder',
            coverUrl: 'https://example.com/covers/midnight-thunder.jpg',
            releaseDate: null,
            isAsap: true,
            mainArtist: 'DJ Voltage',
            additionalArtists: null,
            genre: 'Electronic',
            subgenre: 'House',
            promoText: 'A powerful single that captures the energy of the night',
            useEditorialPromo: false,
            label: 'Music Love',
            artistComment: 'This is my best work yet, please review',
            moderatorComment: null,
            status: 'draft',
            upc: null,
            createdAt: '2024-03-10T12:00:00.000Z',
            updatedAt: '2024-03-10T12:00:00.000Z',
        },
        {
            artistId: 3,
            type: 'ep',
            title: 'Urban Nights EP',
            coverUrl: 'https://example.com/covers/urban-nights.jpg',
            releaseDate: '2024-04-15',
            isAsap: false,
            mainArtist: 'NightBeat',
            additionalArtists: 'DJ Voltage, ElectroWave',
            genre: 'Electronic',
            subgenre: 'Techno',
            promoText: 'Four tracks exploring the underground techno scene',
            useEditorialPromo: true,
            label: 'Music Love',
            artistComment: 'Collaboration EP with my friends',
            moderatorComment: null,
            status: 'on_moderation',
            upc: null,
            createdAt: '2024-03-05T15:30:00.000Z',
            updatedAt: '2024-03-15T10:20:00.000Z',
        },
        {
            artistId: 4,
            type: 'album',
            title: 'Digital Dreams',
            coverUrl: 'https://example.com/covers/digital-dreams.jpg',
            releaseDate: '2024-05-01',
            isAsap: false,
            mainArtist: 'ElectroWave',
            additionalArtists: null,
            genre: 'Electronic',
            subgenre: 'Ambient',
            promoText: 'A journey through electronic soundscapes',
            useEditorialPromo: true,
            label: 'Music Love',
            artistComment: 'My debut album',
            moderatorComment: 'Great work! Approved for release',
            status: 'approved',
            upc: '123456789012',
            createdAt: '2024-02-20T11:00:00.000Z',
            updatedAt: '2024-03-12T14:45:00.000Z',
        }
    ];

    await db.insert(releases).values(sampleReleases);
    
    console.log('✅ Releases seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});