@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">Review Moderation</h1>
        <a href="{{ route('dashboard') }}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-tachometer-alt"></i> Back to Dashboard
        </a>
    </div>

    {{-- AJAX Status Message Container --}}
    <div id="status-message" class="hidden px-4 py-3 rounded-lg relative mb-4"></div>

    <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <div class="p-4 border-b border-gray-200 bg-gray-50">
            <h6 class="text-lg font-bold text-gray-800">All Customer Reviews</h6>
        </div>
        
        <div class="p-4">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200" id="reviewsTable">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @forelse ($reviews as $review)
                        <tr class="hover:bg-gray-100 transition duration-150 ease-in-out" id="review-row-{{ $review->id }}">
                            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{{ $review->id }}</td>
                            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                                <a href="{{ route('dashboard.products.view', $review->product->id) }}" class="text-indigo-600 hover:text-indigo-800 font-medium">
                                    {{ $review->product->crop_type }} (#{{ $review->product->id }})
                                </a>
                            </td>
                            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{{ $review->buyer->name ?? 'Deleted User' }}</td>
                            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                                <span class="font-bold text-lg text-yellow-500">
                                    {{ $review->rating }}
                                </span> / 5
                            </td>
                            <td class="py-3 px-4 text-sm text-gray-600">
                                {{ Str::limit($review->comment, 60) }}
                            </td>
                            <td class="py-3 px-4 whitespace-nowrap">
                                @php
                                    $status_color = [
                                        'pending' => 'bg-yellow-500',
                                        'approved' => 'bg-green-600',
                                        'rejected' => 'bg-red-600',
                                        'hide' => 'bg-gray-500',
                                    ][$review->status] ?? 'bg-gray-500';
                                @endphp
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white {{ $status_color }}" id="review-status-badge-{{ $review->id }}">
                                    {{ ucfirst($review->status) }}
                                </span>
                            </td>
                            <td class="py-3 px-4 whitespace-nowrap">
                                <div id="review-actions-{{ $review->id }}" class="flex flex-col space-y-1">
                                    @if($review->status == 'pending')
                                        <button onclick="moderateReview({{ $review->id }}, 'approved')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition duration-150">Approve</button>
                                        <button onclick="moderateReview({{ $review->id }}, 'rejected')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition duration-150">Reject</button>
                                    @elseif($review->status == 'approved')
                                        <button onclick="moderateReview({{ $review->id }}, 'hide')" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition duration-150">Hide</button>
                                    @elseif($review->status == 'rejected' || $review->status == 'hide')
                                        <button onclick="moderateReview({{ $review->id }, 'approved')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition duration-150">Re-Approve</button>
                                    @endif
                                </div>
                            </td>
                        </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="py-4 px-4 text-center text-gray-500 text-lg">No reviews found awaiting moderation.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const statusMessage = document.getElementById('status-message');

    const statusClasses = {
        'approved': 'bg-green-600',
        'rejected': 'bg-red-600',
        'pending': 'bg-yellow-500',
        'hide': 'bg-gray-500'
    };

    function updateActions(reviewId, newStatus) {
        const reviewActionsDiv = document.getElementById(`review-actions-${reviewId}`);
        if (!reviewActionsDiv) return;
        
        let newActionsHtml = '';
        
        if (newStatus === 'pending') {
            newActionsHtml = `
                <button onclick="moderateReview(${reviewId}, 'approved')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition duration-150">Approve</button>
                <button onclick="moderateReview(${reviewId}, 'rejected')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition duration-150">Reject</button>
            `;
        } else if (newStatus === 'approved') {
            newActionsHtml = `
                <button onclick="moderateReview(${reviewId}, 'hide')" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition duration-150">Hide</button>
                <button onclick="moderateReview(${reviewId}, 'rejected')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition duration-150">Reject</button>
            `;
        } else if (newStatus === 'rejected' || newStatus === 'hide') {
            newActionsHtml = `
                <button onclick="moderateReview(${reviewId}, 'approved')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition duration-150">Re-Approve</button>
            `;
        }
        reviewActionsDiv.innerHTML = newActionsHtml;
    }


    async function moderateReview(reviewId, action) {
        if (!confirm(`Are you sure you want to ${action} this review?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/reviews/${reviewId}/moderate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ action: action })
            });

            const data = await response.json();

            if (response.ok) {
                const newStatus = data.review.status;
                const reviewStatusBadge = document.getElementById(`review-status-badge-${reviewId}`);
                
                // 1. Update status badge
                reviewStatusBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusClasses[newStatus]}`;
                reviewStatusBadge.textContent = ucfirst(newStatus);
                
                // 2. Update action buttons
                updateActions(reviewId, newStatus);

                // 3. Show success message
                statusMessage.textContent = data.message;
                statusMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4';
            } else {
                const errors = data.errors ? Object.values(data.errors).flat().join(' ') : (data.message || 'An error occurred.');
                statusMessage.textContent = 'Error: ' + errors;
                statusMessage.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4';
            }
            statusMessage.classList.remove('hidden');

        } catch (error) {
            console.error('Error moderating review:', error);
            statusMessage.textContent = 'Network error during moderation. Please try again.';
            statusMessage.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4';
            statusMessage.classList.remove('hidden');
        }
    }
    
    // Helper function used in the PHP block
    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
</script>
@endpush
@endsection