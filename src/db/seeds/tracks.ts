import { db } from '@/db';
import { tracks } from '@/db/schema';

async function main() {
    const sampleTracks = [
        {
            releaseId: 1,
            trackNumber: 1,
            title: 'Midnight Thunder',
            url: 'https://soundcloud.com/djvoltage/midnight-thunder',
            artists: 'DJ Voltage',
            musicAuthor: 'DJ Voltage',
            lyricsAuthor: null,
            producer: 'Prod. by DJ Voltage',
            lyrics: null,
            createdAt: '2024-03-10T12:15:00.000Z',
        },
        {
            releaseId: 2,
            trackNumber: 1,
            title: 'City Lights',
            url: 'https://soundcloud.com/nightbeat/city-lights',
            artists: 'NightBeat',
            musicAuthor: 'NightBeat',
            lyricsAuthor: null,
            producer: 'Prod. by NightBeat',
            lyrics: null,
            createdAt: '2024-03-05T15:45:00.000Z',
        },
        {
            releaseId: 2,
            trackNumber: 2,
            title: 'Underground',
            url: 'https://soundcloud.com/nightbeat/underground',
            artists: 'NightBeat, DJ Voltage',
            musicAuthor: 'NightBeat, DJ Voltage',
            lyricsAuthor: null,
            producer: 'Prod. by DJ Voltage',
            lyrics: null,
            createdAt: '2024-03-05T15:50:00.000Z',
        },
        {
            releaseId: 2,
            trackNumber: 3,
            title: 'Dawn',
            url: 'https://soundcloud.com/nightbeat/dawn',
            artists: 'NightBeat, ElectroWave',
            musicAuthor: 'NightBeat, ElectroWave',
            lyricsAuthor: null,
            producer: 'Prod. by ElectroWave',
            lyrics: null,
            createdAt: '2024-03-05T16:00:00.000Z',
        },
        {
            releaseId: 3,
            trackNumber: 1,
            title: 'Digital Awakening',
            url: 'https://soundcloud.com/electrowave/digital-awakening',
            artists: 'ElectroWave',
            musicAuthor: 'ElectroWave',
            lyricsAuthor: null,
            producer: 'Prod. by ElectroWave',
            lyrics: null,
            createdAt: '2024-02-20T11:30:00.000Z',
        },
        {
            releaseId: 3,
            trackNumber: 2,
            title: 'Ethereal Waves',
            url: 'https://soundcloud.com/electrowave/ethereal-waves',
            artists: 'ElectroWave',
            musicAuthor: 'ElectroWave',
            lyricsAuthor: null,
            producer: 'Prod. by ElectroWave',
            lyrics: null,
            createdAt: '2024-02-20T11:35:00.000Z',
        },
    ];

    await db.insert(tracks).values(sampleTracks);
    
    console.log('✅ Tracks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});