<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Borrow;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BorrowController extends Controller
{
    public function index(Request $request): Response
    {
        $borrows = Borrow::with('book.category')
            ->latest('borrowed_at')
            ->paginate(12);

        return Inertia::render('library/my-library', [
            'borrows' => $borrows,
        ]);
    }

    public function store(Request $request, Book $book)
    {
        // Check if book is already borrowed
        $activeBorrow = $book->borrows()->whereNull('returned_at')->first();

        if ($activeBorrow) {
            return back()->withErrors(['book' => 'This book is currently borrowed by someone else.']);
        }

        Borrow::create([
            'user_id' => $request->user()?->id ?? 1,
            'book_id' => $book->id,
            'borrowed_at' => now(),
            'due_at' => now()->addDays(14),
        ]);

        $book->update(['is_available' => false]);

        return back()->with('success', 'Book borrowed successfully! Due in 14 days.');
    }

    public function returnBook(Request $request, Borrow $borrow)
    {
        $borrow->update(['returned_at' => now()]);
        $borrow->book->update(['is_available' => true]);

        return back()->with('success', 'Book returned successfully!');
    }
}
