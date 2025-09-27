<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;


/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Faq>
 */
class FaqFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $questions = [
            'How do I track my parcel?',
            'What are the collection hours?',
            'How do I pay for my parcel?',
            'What if my parcel is damaged?',
            'How long do you keep parcels?',
            'Can someone else collect my parcel?',
            'What documents do I need for collection?',
            'How do I report a missing parcel?',
            'What payment methods do you accept?',
            'How do I update my contact information?'
        ];

        $answers = [
            'You can track your parcel using the tracking number provided in your notification email or SMS.',
            'Collection hours are Monday to Friday from 9:00 AM to 5:00 PM, and Saturday from 9:00 AM to 1:00 PM.',
            'You can pay for your parcel using cash, card, or mobile payment methods at the collection counter.',
            'If your parcel is damaged, please report it immediately to our staff and we will assist you with the claim process.',
            'We keep parcels for 30 days from the date of arrival. After this period, uncollected parcels may be returned to sender.',
            'Yes, someone else can collect your parcel if they have your ID and the tracking number, or a signed authorization letter.',
            'You need to bring a valid government-issued ID and the tracking number or notification message.',
            'Please contact our staff immediately or use the online reporting system to report a missing parcel.',
            'We accept cash, credit/debit cards, and mobile payment methods like Apple Pay and Google Pay.',
            'You can update your contact information through your account settings or by contacting our support team.'
        ];

        $categories = ['General', 'Collection', 'Payment'];

        $randomIndex = $this->faker->numberBetween(0, count($questions) - 1);

        return [
            'faq_question' => $questions[$randomIndex],
            'faq_answer'   => $answers[$randomIndex],
            'category'     => $this->faker->randomElement($categories),
            'faq_status'   => $this->faker->randomElement(['Active', 'Inactive']),
        ];
    }
}
