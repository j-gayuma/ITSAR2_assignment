<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FavoriteController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user() ?? \App\Models\User::find(1);

        $favorites = $user->favorites()->with('category')->latest('favorites.created_at')->paginate(12);

        return Inertia::render('library/favorites', [
            'favorites' => $favorites,
        ]);
    }

    public function toggle(Request $request, Book $book)
    {
        $user = $request->user() ?? \App\Models\User::find(1);

        $exists = $user->favorites()->where('book_id', $book->id)->exists();

        if ($exists) {
            $user->favorites()->detach($book->id);
            $message = 'Book removed from favorites.';
        } else {
            $user->favorites()->attach($book->id);
            $message = 'Book added to favorites!';
        }

        return back()->with('success', $message);
    }
}
