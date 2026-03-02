<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::withCount('books')->get();

        return Inertia::render('library/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function show(Category $category): Response
    {
        $books = $category->books()->with('category')->paginate(12);

        return Inertia::render('library/categories/show', [
            'category' => $category,
            'books' => $books,
        ]);
    }
}
