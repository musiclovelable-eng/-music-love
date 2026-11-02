import { db } from '@/db';
import { faq } from '@/db/schema';

async function main() {
    const sampleFaq = [
        {
            question: 'How do I submit a new release?',
            answer: 'To submit a new release, go to the Releases section and click "New Release". Fill in all required information including title, cover art, tracks, and metadata. Once completed, submit for moderation.',
            orderIndex: 1,
            createdAt: '2024-01-15T10:30:00.000Z',
        },
        {
            question: 'What is the difference between Basic and Advanced plans?',
            answer: 'Basic plan includes standard release submissions and distribution. Advanced plan adds priority moderation, editorial playlist pitching, extended analytics, and dedicated support.',
            orderIndex: 2,
            createdAt: '2024-01-15T10:35:00.000Z',
        },
        {
            question: 'How long does moderation take?',
            answer: 'Standard moderation typically takes 3-5 business days. Advanced plan users receive priority moderation within 24-48 hours. Releases marked "As Soon As Possible" are prioritized.',
            orderIndex: 3,
            createdAt: '2024-01-15T10:40:00.000Z',
        },
        {
            question: 'Can I edit my release after submission?',
            answer: 'Yes, you can edit releases in "draft" status. Once submitted for moderation, contact support if changes are needed. Approved releases cannot be edited without re-submission.',
            orderIndex: 4,
            createdAt: '2024-01-15T10:45:00.000Z',
        },
        {
            question: 'What audio format should I use for uploads?',
            answer: 'We accept WAV and FLAC files with minimum 16-bit/44.1kHz quality. For best results, use 24-bit/48kHz WAV files. Maximum file size is 500MB per track.',
            orderIndex: 5,
            createdAt: '2024-01-15T10:50:00.000Z',
        },
        {
            question: 'How do I submit lyrics for my tracks?',
            answer: 'Use the Lyrics Submissions feature to provide links to your track and lyrics document. Our team will review and upload them to streaming platforms within 7 business days.',
            orderIndex: 6,
            createdAt: '2024-01-15T10:55:00.000Z',
        },
    ];

    await db.insert(faq).values(sampleFaq);
    
    console.log('✅ FAQ seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});