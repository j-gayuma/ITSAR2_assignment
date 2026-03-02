<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function discover(Request $request): Response
    {
        $categories = Category::withCount('books')->get();

        $recommendedBooks = Book::with('category')
            ->latest()
            ->take(10)
            ->get();

        $query = $request->input('search');
        $categoryId = $request->input('category');

        $searchResults = null;
        if ($query || $categoryId) {
            $searchQuery = Book::with('category');

            if ($query) {
                $searchQuery->where(function ($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('author', 'like', "%{$query}%");
                });
            }

            if ($categoryId) {
                $searchQuery->where('category_id', $categoryId);
            }

            $searchResults = $searchQuery->paginate(12);
        }

        return Inertia::render('library/discover', [
            'categories' => $categories,
            'recommendedBooks' => $recommendedBooks,
            'searchResults' => $searchResults,
            'filters' => [
                'search' => $query,
                'category' => $categoryId,
            ],
        ]);
    }

    public function index(Request $request): Response
    {
        $query = Book::with('category');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%");
            });
        }

        if ($categoryId = $request->input('category')) {
            $query->where('category_id', $categoryId);
        }

        $books = $query->latest()->paginate(12);
        $categories = Category::all();

        return Inertia::render('library/books/index', [
            'books' => $books,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $categoryId,
            ],
        ]);
    }

    public function manage(Request $request): Response
    {
        $query = Book::with('category');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%");
            });
        }

        if ($categoryId = $request->input('category')) {
            $query->where('category_id', $categoryId);
        }

        $books = $query->latest()->paginate(15);
        $categories = Category::all();

        return Inertia::render('library/books/manage', [
            'books' => $books,
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? null,
                'category' => $categoryId ?? null,
            ],
        ]);
    }

    public function show(Book $book): Response
    {
        $book->load(['category', 'borrows.user']);

        $isCurrentlyBorrowed = $book->borrows()
            ->whereNull('returned_at')
            ->exists();

        $userHasBorrowed = false;
        if (auth()->check()) {
            $userHasBorrowed = $book->borrows()
                ->where('user_id', auth()->id())
                ->whereNull('returned_at')
                ->exists();
        }

        $user = auth()->user() ?? \App\Models\User::find(1);
        $isFavorited = $user ? $user->favorites()->where('book_id', $book->id)->exists() : false;

        return Inertia::render('library/books/show', [
            'book' => $book,
            'isCurrentlyBorrowed' => $isCurrentlyBorrowed,
            'userHasBorrowed' => $userHasBorrowed,
            'isFavorited' => $isFavorited,
        ]);
    }

    public function create(): Response
    {
        $categories = Category::all();

        return Inertia::render('library/books/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
            'category_id' => 'required|exists:categories,id',
        ]);

        if ($request->hasFile('cover_image')) {
            $validated['cover_image'] = $request->file('cover_image')
                ->store('covers', 'public');
        }

        Book::create($validated);

        return redirect()->route('library.discover')
            ->with('success', 'Book added successfully!');
    }

    public function edit(Book $book): Response
    {
        $categories = Category::all();

        return Inertia::render('library/books/edit', [
            'book' => $book,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Book $book)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
            'category_id' => 'required|exists:categories,id',
        ]);

        if ($request->hasFile('cover_image')) {
            // Delete old cover image if exists
            if ($book->cover_image) {
                Storage::disk('public')->delete($book->cover_image);
            }
            $validated['cover_image'] = $request->file('cover_image')
                ->store('covers', 'public');
        }

        $book->update($validated);

        return redirect()->route('library.books.show', $book)
            ->with('success', 'Book updated successfully!');
    }

    public function destroy(Book $book)
    {
        if ($book->cover_image) {
            Storage::disk('public')->delete($book->cover_image);
        }

        $book->delete();

        return redirect()->route('library.discover')
            ->with('success', 'Book deleted successfully!');
    }
}
