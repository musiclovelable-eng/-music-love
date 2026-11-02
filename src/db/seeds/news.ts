import { db } from '@/db';
import { news } from '@/db/schema';

async function main() {
    const sampleNews = [
        {
            title: 'Welcome to Music Love Artist Portal',
            content: 'We are excited to announce the launch of our new artist portal! Here you can manage your releases, track submissions, and connect with the Music Love community.',
            links: '["https://nightvolt.app", "https://support.nightvolt.app"]',
            createdBy: 1,
            createdAt: '2024-01-20T10:00:00.000Z',
            published: true,
        },
        {
            title: 'New Release Guidelines 2024',
            content: 'We have updated our release guidelines for 2024. Please review the new requirements for cover art, audio quality, and metadata standards before submitting your next release.',
            links: '["https://nightvolt.app/guidelines", "https://docs.nightvolt.app/releases"]',
            createdBy: 1,
            createdAt: '2024-02-01T14:00:00.000Z',
            published: true,
        },
        {
            title: 'Advanced Plan Features Now Available',
            content: 'Artists on the Advanced plan can now access priority moderation, editorial playlist submissions, and extended analytics. Upgrade your plan in settings to unlock these features.',
            links: '["https://nightvolt.app/pricing"]',
            createdBy: 1,
            createdAt: '2024-02-15T09:30:00.000Z',
            published: true,
        },
        {
            title: 'March Release Schedule',
            content: 'Our March release schedule is now live! Check out the upcoming releases from our talented artists. Submit your releases early to be included in our promotional campaigns.',
            links: null,
            createdBy: 1,
            createdAt: '2024-03-01T11:00:00.000Z',
            published: true,
        }
    ];

    await db.insert(news).values(sampleNews);
    
    console.log('✅ News seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});