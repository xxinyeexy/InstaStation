<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FaqController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $q = trim((string) $request->get('q', ''));
        $category = trim((string) $request->get('category', ''));

        $faqsQuery = Faq::query();
        if ($q !== '') {
            $faqsQuery->where(function ($qb) use ($q) {
                $qb->where('faq_question', 'like', "%$q%")
                    ->orWhere('faq_answer', 'like', "%$q%");
            });
        }
        if ($category !== '') {
            $faqsQuery->where('category', $category);
        }

        $faqs = $faqsQuery->orderByDesc('updated_at')->get()->map(function (Faq $f) {
            return [
                'faq_id' => $f->faq_id,
                'faq_question' => $f->faq_question,
                'faq_answer' => $f->faq_answer,
                'category' => $f->category,
                'faq_status' => $f->faq_status,
                'views' => rand(50, 300), // demo metric; replace with real analytics if available
                'created_at' => optional($f->created_at)->toDateString(),
                'updated_at' => optional($f->updated_at)->toDateString(),
            ];
        });

        $summary = [
            'total' => $faqs->count(),
            'published' => $faqs->where('faq_status', 'Active')->count(),
            'total_views' => $faqs->sum('views'),
            'avg_views' => $faqs->count() ? intval($faqs->avg('views')) : 0,
        ];

        // Get unique categories from all FAQs
        $categories = Faq::query()
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('staff/manage-faq', [
            'rows' => $faqs,
            'summary' => $summary,
            'filters' => ['q' => $q, 'category' => $category],
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'faq_question' => 'required|string|min:10|max:500',
                'faq_answer' => 'required|string|min:20|max:5000',
                'category' => 'required|string|max:50',
                'faq_status' => 'nullable|in:Active,Inactive',
            ]);
            $data['faq_status'] = $data['faq_status'] ?? 'Inactive';
            $faq = Faq::create($data);
            return response()->json(['success' => true, 'faq' => $faq]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
                'message' => 'Validation failed'
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Faq $faq)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Faq $faq)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Faq $faq)
    {
        $data = $request->validate([
            'faq_question' => 'sometimes|string|max:150',
            'faq_answer' => 'sometimes|string|max:5000',
            'category' => 'sometimes|nullable|string|max:20',
            'faq_status' => 'sometimes|in:Active,Inactive',
        ]);
        $faq->update($data);
        return response()->json(['success' => true, 'faq' => $faq]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Faq $faq)
    {
        $faq->delete();
        return response()->json(['success' => true]);
    }

    public function publish(Faq $faq)
    {
        $faq->update(['faq_status' => 'Active']);
        return response()->json(['success' => true]);
    }

    public function unpublish(Faq $faq)
    {
        $faq->update(['faq_status' => 'Inactive']);
        return response()->json(['success' => true]);
    }

    /**
     * Display FAQs for students
     */
    public function studentIndex(Request $request)
    {
        $q = trim((string) $request->get('q', ''));
        $category = trim((string) $request->get('category', ''));

        $faqsQuery = Faq::where('faq_status', 'Active');

        if ($q !== '') {
            $faqsQuery->where(function ($qb) use ($q) {
                $qb->where('faq_question', 'like', "%$q%")
                    ->orWhere('faq_answer', 'like', "%$q%");
            });
        }

        if ($category !== '') {
            $faqsQuery->where('category', $category);
        }

        $faqs = $faqsQuery->orderByDesc('updated_at')->get()->map(function (Faq $f) {
            return [
                'faq_id' => $f->faq_id,
                'faq_question' => $f->faq_question,
                'faq_answer' => $f->faq_answer,
                'category' => $f->category,
                'created_at' => optional($f->created_at)->toDateString(),
                'updated_at' => optional($f->updated_at)->toDateString(),
            ];
        });

        // Get unique categories from active FAQs
        $categories = Faq::where('faq_status', 'Active')
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('student/faq', [
            'faqs' => $faqs,
            'categories' => $categories,
            'filters' => ['q' => $q, 'category' => $category],
        ]);
    }
}
