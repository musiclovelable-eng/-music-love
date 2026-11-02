import { db } from '@/db';
import { artists } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const sampleArtists = [
        {
            uid: 'admin-001',
            email: 'admin@nightvolt.app',
            password: bcrypt.hashSync('NIGHTVOLT-ROOT-2025', 10),
            name: 'Administrator',
            plan: 'advanced',
            isBlocked: false,
            isAdmin: true,
            theme: 'dark',
            showSnowflakes: false,
            avatarUrl: null,
            label: 'Music Love',
            createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
            uid: 'artist-001',
            email: 'artist1@nightvolt.app',
            password: bcrypt.hashSync('nightvolt-12345', 10),
            name: 'DJ Voltage',
            plan: 'advanced',
            isBlocked: false,
            isAdmin: false,
            theme: 'dark',
            showSnowflakes: true,
            avatarUrl: null,
            label: 'Music Love',
            createdAt: '2024-02-01T14:30:00.000Z',
        },
        {
            uid: 'artist-002',
            email: 'artist2@nightvolt.app',
            password: bcrypt.hashSync('nightvolt-67890', 10),
            name: 'NightBeat',
            plan: 'basic',
            isBlocked: false,
            isAdmin: false,
            theme: 'light',
            showSnowflakes: false,
            avatarUrl: null,
            label: 'Music Love',
            createdAt: '2024-02-15T16:45:00.000Z',
        },
        {
            uid: 'artist-003',
            email: 'artist3@nightvolt.app',
            password: bcrypt.hashSync('nightvolt-54321', 10),
            name: 'ElectroWave',
            plan: 'basic',
            isBlocked: false,
            isAdmin: false,
            theme: 'light',
            showSnowflakes: false,
            avatarUrl: null,
            label: 'Music Love',
            createdAt: '2024-03-01T09:15:00.000Z',
        },
    ];

    await db.insert(artists).values(sampleArtists);
    
    console.log('✅ Artists seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});