import { db } from '@/db';
import { releaseHistory } from '@/db/schema';

async function main() {
    const sampleReleaseHistory = [
        {
            releaseId: 1,
            action: 'status_changed',
            field: 'status',
            oldValue: null,
            newValue: 'draft',
            performedBy: 'Alex Morgan',
            performedAt: new Date('2024-02-20T10:30:00Z').toISOString(),
            description: 'Release created as draft',
        },
        {
            releaseId: 1,
            action: 'metadata_updated',
            field: 'title',
            oldValue: 'Midnight Thunder Demo',
            newValue: 'Midnight Thunder',
            performedBy: 'Alex Morgan',
            performedAt: new Date('2024-02-22T14:15:00Z').toISOString(),
            description: 'Title updated from "Midnight Thunder Demo" to "Midnight Thunder"',
        },
        {
            releaseId: 1,
            action: 'status_changed',
            field: 'status',
            oldValue: 'draft',
            newValue: 'on_moderation',
            performedBy: 'Alex Morgan',
            performedAt: new Date('2024-02-25T16:45:00Z').toISOString(),
            description: 'Status changed from "draft" to "on_moderation"',
        },
        {
            releaseId: 1,
            action: 'comment_added',
            field: 'moderatorComment',
            oldValue: null,
            newValue: 'Cover artwork needs higher resolution. Please resubmit with at least 3000x3000px',
            performedBy: 'admin@nightvolt.app',
            performedAt: new Date('2024-02-27T11:20:00Z').toISOString(),
            description: 'Moderator comment added',
        },
        {
            releaseId: 2,
            action: 'status_changed',
            field: 'status',
            oldValue: null,
            newValue: 'draft',
            performedBy: 'Sarah Chen',
            performedAt: new Date('2024-02-28T09:00:00Z').toISOString(),
            description: 'Release created as draft',
        },
        {
            releaseId: 2,
            action: 'cover_updated',
            field: 'coverUrl',
            oldValue: '/uploads/covers/temp_urban_nights.jpg',
            newValue: '/uploads/covers/urban_nights_final.jpg',
            performedBy: 'Sarah Chen',
            performedAt: new Date('2024-03-02T13:30:00Z').toISOString(),
            description: 'Cover artwork updated',
        },
        {
            releaseId: 2,
            action: 'status_changed',
            field: 'status',
            oldValue: 'draft',
            newValue: 'on_moderation',
            performedBy: 'Sarah Chen',
            performedAt: new Date('2024-03-05T15:10:00Z').toISOString(),
            description: 'Status changed from "draft" to "on_moderation"',
        },
        {
            releaseId: 3,
            action: 'status_changed',
            field: 'status',
            oldValue: 'on_moderation',
            newValue: 'approved',
            performedBy: 'admin@nightvolt.app',
            performedAt: new Date('2024-03-10T10:00:00Z').toISOString(),
            description: 'Status changed from "on_moderation" to "approved"',
        },
        {
            releaseId: 3,
            action: 'upc_added',
            field: 'upc',
            oldValue: null,
            newValue: '123456789012',
            performedBy: 'admin@nightvolt.app',
            performedAt: new Date('2024-03-10T10:05:00Z').toISOString(),
            description: 'UPC code added: 123456789012',
        },
        {
            releaseId: 3,
            action: 'comment_added',
            field: 'moderatorComment',
            oldValue: null,
            newValue: 'Excellent production quality. Approved for distribution.',
            performedBy: 'admin@nightvolt.app',
            performedAt: new Date('2024-03-10T10:10:00Z').toISOString(),
            description: 'Moderator comment added',
        },
    ];

    await db.insert(releaseHistory).values(sampleReleaseHistory);
    
    console.log('✅ Release history seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});