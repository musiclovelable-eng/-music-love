import { db } from '@/db';
import { lyricsSubmissions } from '@/db/schema';

async function main() {
    const sampleLyricsSubmissions = [
        {
            artistId: 2,
            releaseId: 1,
            trackName: 'Midnight Thunder',
            lyricLink: 'https://genius.com/artist-midnight-thunder-lyrics',
            platform: 'Genius',
            status: 'approved',
            rejectionReason: null,
            createdAt: new Date('2024-03-11').toISOString(),
            updatedAt: new Date('2024-03-11').toISOString(),
        },
        {
            artistId: 3,
            releaseId: 2,
            trackName: 'City Lights',
            lyricLink: 'https://www.musixmatch.com/lyrics/artist/city-lights',
            platform: 'Musixmatch',
            status: 'sent',
            rejectionReason: null,
            createdAt: new Date('2024-03-14').toISOString(),
            updatedAt: new Date('2024-03-14').toISOString(),
        },
        {
            artistId: 4,
            releaseId: 3,
            trackName: 'Digital Awakening',
            lyricLink: 'https://genius.com/artist-digital-awakening-lyrics',
            platform: 'Genius',
            status: 'rejected',
            rejectionReason: 'Link is not accessible',
            createdAt: new Date('2024-03-08').toISOString(),
            updatedAt: new Date('2024-03-08').toISOString(),
        },
        {
            artistId: 2,
            releaseId: null,
            trackName: 'Unreleased Demo',
            lyricLink: 'https://www.azlyrics.com/lyrics/artist/unreleaseddemo.html',
            platform: 'AZLyrics',
            status: 'sent',
            rejectionReason: null,
            createdAt: new Date('2024-03-15').toISOString(),
            updatedAt: new Date('2024-03-15').toISOString(),
        },
        {
            artistId: 3,
            releaseId: 2,
            trackName: 'Underground',
            lyricLink: 'https://genius.com/artist-underground-lyrics',
            platform: 'Genius',
            status: 'approved',
            rejectionReason: null,
            createdAt: new Date('2024-03-12').toISOString(),
            updatedAt: new Date('2024-03-12').toISOString(),
        },
    ];

    await db.insert(lyricsSubmissions).values(sampleLyricsSubmissions);
    
    console.log('✅ Lyrics submissions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});