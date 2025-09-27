<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Faq;


class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'faq_question' => 'How do I track my parcel?',
                'faq_answer' => 'You can track your parcel using the tracking number provided in your notification email or SMS. Simply enter the tracking number on our website or contact our support team.',
                'category' => 'General',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'What are the collection hours?',
                'faq_answer' => 'Collection hours are Monday to Friday from 9:00 AM to 5:00 PM, and Saturday from 9:00 AM to 1:00 PM. We are closed on Sundays and public holidays.',
                'category' => 'Collection',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'How do I pay for my parcel?',
                'faq_answer' => 'You can pay for your parcel using cash, credit/debit cards, or mobile payment methods like Apple Pay and Google Pay at the collection counter.',
                'category' => 'Payment',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'What if my parcel is damaged?',
                'faq_answer' => 'If your parcel is damaged, please report it immediately to our staff and we will assist you with the claim process. Do not sign for damaged parcels.',
                'category' => 'Collection',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'How long do you keep parcels?',
                'faq_answer' => 'We keep parcels for 30 days from the date of arrival. After this period, uncollected parcels may be returned to sender or disposed of according to our policy.',
                'category' => 'Collection',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'Can someone else collect my parcel?',
                'faq_answer' => 'Yes, someone else can collect your parcel if they have your ID and the tracking number, or a signed authorization letter from you.',
                'category' => 'Collection',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'What documents do I need for collection?',
                'faq_answer' => 'You need to bring a valid government-issued ID and the tracking number or notification message. For someone else to collect, they need authorization.',
                'category' => 'Collection',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'How do I report a missing parcel?',
                'faq_answer' => 'Please contact our staff immediately or use the online reporting system to report a missing parcel. We will investigate and provide updates.',
                'category' => 'General',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'What payment methods do you accept?',
                'faq_answer' => 'We accept cash, credit/debit cards, and mobile payment methods like Apple Pay, Google Pay, and other digital wallets.',
                'category' => 'Payment',
                'faq_status' => 'Active'
            ],
            [
                'faq_question' => 'How do I update my contact information?',
                'faq_answer' => 'You can update your contact information through your account settings on our website or by contacting our support team directly.',
                'category' => 'General',
                'faq_status' => 'Active'
            ]
        ];

        foreach ($faqs as $faq) {
            Faq::create($faq);
        }
    }
}
