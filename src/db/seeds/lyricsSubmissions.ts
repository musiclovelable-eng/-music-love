import { db } from '@/db';
import { lyricsSubmissions } from '@/db/schema';

async function main() {
    const sampleLyricsSubmissions = [
        {
            artistId: 2,
            trackUrl: 'https://open.spotify.com/track/djvoltage-midnight-thunder',
            lyricsUrl: 'https://docs.google.com/document/d/lyrics-midnight-thunder',
            status: 'approved',
            adminComment: 'Lyrics uploaded successfully to all platforms',
            createdAt: '2024-03-11T10:00:00.000Z',
        },
        {
            artistId: 3,
            trackUrl: 'https://open.spotify.com/track/nightbeat-city-lights',
            lyricsUrl: 'https://docs.google.com/document/d/lyrics-city-lights',
            status: 'pending',
            adminComment: null,
            createdAt: '2024-03-14T15:30:00.000Z',
        },
        {
            artistId: 4,
            trackUrl: 'https://open.spotify.com/track/electrowave-digital-awakening',
            lyricsUrl: 'https://docs.google.com/document/d/lyrics-digital-awakening',
            status: 'rejected',
            adminComment: 'Lyrics document is not accessible. Please check sharing permissions and resubmit.',
            createdAt: '2024-03-08T12:00:00.000Z',
        }
    ];

    await db.insert(lyricsSubmissions).values(sampleLyricsSubmissions);
    
    console.log('✅ Lyrics submissions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});