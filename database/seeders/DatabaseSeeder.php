<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test user
        User::factory()->create([
            'name' => 'Davis Workman',
            'email' => 'test@example.com',
        ]);

        // Create categories with icons matching the screenshot design
        $categories = [
            ['name' => 'Money/Investing', 'icon' => '💰'],
            ['name' => 'Design', 'icon' => '🎨'],
            ['name' => 'Business', 'icon' => '💼'],
            ['name' => 'Self Improvement', 'icon' => '🧠'],
            ['name' => 'Technology', 'icon' => '💻'],
            ['name' => 'Science', 'icon' => '🔬'],
            ['name' => 'History', 'icon' => '📜'],
            ['name' => 'Fiction', 'icon' => '📖'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // Create books for each category
        $booksData = [
            ['title' => 'The Psychology of Money', 'author' => 'Morgan Housel', 'description' => 'Timeless lessons on wealth, greed, and happiness. Doing well with money isn\'t necessarily about what you know. It\'s about how you behave. And behavior is hard to teach, even to really smart people.', 'category_id' => 1, 'published_at' => '2020-09-08'],
            ['title' => 'Company of One', 'author' => 'Paul Jarvis', 'description' => 'Why staying small is the next big thing for business. What if the real key to a richer and more fulfilling career was not to create and scale a new start-up, but to be able to work for yourself?', 'category_id' => 3, 'published_at' => '2019-01-15'],
            ['title' => 'How Innovation Works', 'author' => 'Matt Ridley', 'description' => 'And why it flourishes in freedom. Innovation is the main event of the modern age, the reason we experience both dramatic improvements in our living standards and unsettling changes in our society.', 'category_id' => 5, 'published_at' => '2020-05-19'],
            ['title' => 'The Picture of Dorian Gray', 'author' => 'Oscar Wilde', 'description' => 'A philosophical novel that tells the story of a young man named Dorian Gray, the subject of a painting by artist Basil Hallward. Dorian is enthralled by Lord Henry\'s assertion that beauty is the only worthy pursuit in life.', 'category_id' => 8, 'published_at' => '1890-07-01'],
            ['title' => 'The Subtle Art of Not Giving a F*ck', 'author' => 'Mark Manson', 'description' => 'A counterintuitive approach to living a good life. In this generation-defining self-help guide, a superstar blogger cuts through the crap to show us how to stop trying to be positive all the time.', 'category_id' => 4, 'published_at' => '2016-09-13'],
            ['title' => 'Thinking, Fast and Slow', 'author' => 'Daniel Kahneman', 'description' => 'In his mega bestseller, Daniel Kahneman, world-famous psychologist, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.', 'category_id' => 4, 'published_at' => '2011-10-25'],
            ['title' => 'Rich Dad Poor Dad', 'author' => 'Robert T. Kiyosaki', 'description' => 'What the rich teach their kids about money that the poor and middle class do not! Rich Dad Poor Dad is Robert\'s story of growing up with two dads.', 'category_id' => 1, 'published_at' => '1997-04-01'],
            ['title' => 'The Lean Startup', 'author' => 'Eric Ries', 'description' => 'How today\'s entrepreneurs use continuous innovation to create radically successful businesses. Most startups fail. But many of those failures are preventable.', 'category_id' => 3, 'published_at' => '2011-09-13'],
            ['title' => 'Sapiens: A Brief History of Humankind', 'author' => 'Yuval Noah Harari', 'description' => 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution that explores the ways in which biology and history have defined us.', 'category_id' => 7, 'published_at' => '2011-01-01'],
            ['title' => 'Don\'t Make Me Think', 'author' => 'Steve Krug', 'description' => 'A common-sense approach to Web usability. Since Don\'t Make Me Think was first published in 2000, hundreds of thousands of Web designers have relied on usability guru Steve Krug\'s guide.', 'category_id' => 2, 'published_at' => '2000-01-01'],
            ['title' => 'The Design of Everyday Things', 'author' => 'Don Norman', 'description' => 'The ultimate guide to human-centered design. Even the smartest among us can feel inept as we fail to figure out which light switch or oven burner to turn on.', 'category_id' => 2, 'published_at' => '1988-01-01'],
            ['title' => 'Clean Code', 'author' => 'Robert C. Martin', 'description' => 'A handbook of agile software craftsmanship. Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.', 'category_id' => 5, 'published_at' => '2008-08-01'],
            ['title' => 'A Brief History of Time', 'author' => 'Stephen Hawking', 'description' => 'From the Big Bang to black holes. A landmark volume in science writing by one of the great minds of our time.', 'category_id' => 6, 'published_at' => '1988-04-01'],
            ['title' => 'Atomic Habits', 'author' => 'James Clear', 'description' => 'An easy & proven way to build good habits & break bad ones. No matter your goals, Atomic Habits offers a proven framework for improving every day.', 'category_id' => 4, 'published_at' => '2018-10-16'],
            ['title' => 'Zero to One', 'author' => 'Peter Thiel', 'description' => 'Notes on startups, or how to build the future. The next Bill Gates will not build an operating system. The next Larry Page will not make a search engine.', 'category_id' => 3, 'published_at' => '2014-09-16'],
            ['title' => 'The Intelligent Investor', 'author' => 'Benjamin Graham', 'description' => 'The definitive book on value investing. A book of practical counsel. It is widely considered the greatest investment book of all time.', 'category_id' => 1, 'published_at' => '1949-01-01'],
        ];

        foreach ($booksData as $bookData) {
            Book::create($bookData);
        }
    }
}
