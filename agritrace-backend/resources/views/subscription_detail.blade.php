@extends('layouts.app')

@section('content')
<style>
    /* Custom Styling for visual flair */
    .highlight-box {
        background-color: #f7f9fc;
        border-radius: 12px;
        border-left: 5px solid #2563eb;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease-in-out;
    }
    .highlight-box:hover {
        transform: translateY(-2px);
    }
    .products-display {
        font-size: 5rem;
        font-weight: 900;
        color: #10b981; /* Green color */
        line-height: 1;
        margin-bottom: 0.5rem;
    }
</style>
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">Manage Subscription: {{ $farmer->name }}</h1>
        <a href="{{ route('admin.subscriptions') }}" class="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-arrow-left"></i> Back to List
        </a>
    </div>

    {{-- Session Messages --}}
    @if (session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            {{ session('success') }}
        </div>
    @endif
    @if ($errors->any())
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {{-- Account and Plan Details Card --}}
        <div class="md:col-span-2 highlight-box border-l-4 border-yellow-500">
            <h6 class="text-xl font-bold text-gray-800 mb-4">Account & Plan Overview</h6>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p class="text-gray-500">Farmer/Owner</p>
                    <p class="font-semibold text-gray-800">{{ $farmer->name }}</p>
                </div>
                <div>
                    <p class="text-gray-500">Farm/Company</p>
                    <p class="font-semibold text-gray-800">{{ $farmer->farm_name ?? 'N/A' }}</p>
                </div>
                <div>
                    <p class="text-gray-500">Email / Contact</p>
                    <p class="font-semibold text-gray-800">{{ $farmer->email }} / {{ $farmer->contact_number ?? 'N/A' }}</p>
                </div>
                <div>
                    <p class="text-gray-500">Plan Status</p>
                    <span class="text-sm font-bold text-white rounded-full px-3 py-1 
                        @if($farmer->status === 'approved') bg-green-500 
                        @elseif($farmer->status === 'pending') bg-yellow-500
                        @else bg-red-500 
                        @endif">
                        {{ $farmer->status }}
                    </span>
                </div>
            </div>
        </div>

        {{-- Product Quota Card --}}
        <div class="md:col-span-1 highlight-box border-l-4 border-green-500">
            <h6 class="text-xl font-bold text-gray-800 mb-4">Product Quota Management</h6>
            <div class="text-center">
                <div class="products-display">
                    {{ $farmer->remaining_products === 9999 ? '∞' : ($farmer->remaining_products ?? 0) }}
                </div>
                <p class="text-gray-600 text-lg">Products Remaining</p>
                
                <hr class="my-4">

                <h6 class="text-left font-semibold mb-3 text-gray-700">Manually Adjust Quota</h6>
                <form action="{{ route('admin.subscriptions.update_quota', $farmer->id) }}" method="POST" class="space-y-4">
                    @csrf
                    @method('PUT')
                    <div class="form-group">
                        <label for="products_to_add" class="float-left text-sm font-medium text-gray-700">Enter Value (e.g., 10 or -5):</label>
                        <input type="number" name="products_to_add" id="products_to_add" class="form-control border border-gray-300 rounded-lg p-2 w-full" placeholder="Enter quantity" required>
                    </div>
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 w-full">Apply Quota Change</button>
                </form>
            </div>
        </div>

        {{-- Manual Status & Plan Update Card (SECURED) --}}
        <div class="lg:col-span-3 highlight-box border-l-4 border-red-500">
            <h6 class="text-xl font-bold text-gray-800 mb-4">Manual Subscription Control (SECURED)</h6>
            
            <form id="statusUpdateForm" action="{{ route('admin.subscriptions.update_status', $farmer->id) }}" method="POST">
                @csrf
                @method('PUT')
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {{-- Plan Type and Dates --}}
                    <div class="md:col-span-2 space-y-4">
                        <h5 class="text-lg font-bold mb-1 text-indigo-600">Plan & Duration</h5>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label for="subscription_plan" class="block text-sm font-medium text-gray-700">Subscription Plan</label>
                                <select name="subscription_plan" id="subscription_plan" class="form-control border border-gray-300 rounded-lg p-2 w-full">
                                    <option value="FREE_TRIAL_3" {{ ($farmer->subscription_plan === 'FREE_TRIAL_3') ? 'selected' : '' }}>FREE_TRIAL_3</option>
                                    <option value="BASIC_5" {{ ($farmer->subscription_plan === 'BASIC_5') ? 'selected' : '' }}>BASIC_5</option>
                                    <option value="STANDARD_10" {{ ($farmer->subscription_plan === 'STANDARD_10') ? 'selected' : '' }}>STANDARD_10</option>
                                    <option value="PREMIUM_25" {{ ($farmer->subscription_plan === 'PREMIUM_25') ? 'selected' : '' }}>PREMIUM_25</option>
                                    <option value="UNLIMITED" {{ ($farmer->subscription_plan === 'UNLIMITED') ? 'selected' : '' }}>UNLIMITED</option>
                                    <option value="N/A" {{ !$farmer->subscription_plan ? 'selected' : '' }}>N/A (No Plan)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="subscription_end_date" class="block text-sm font-medium text-gray-700">Plan End Date</label>
                                <input type="date" name="subscription_end_date" id="subscription_end_date" class="form-control border border-gray-300 rounded-lg p-2 w-full" 
                                       value="{{ $farmer->subscription_end_date ? \Carbon\Carbon::parse($farmer->subscription_end_date)->format('Y-m-d') : '' }}">
                            </div>
                        </div>
                    </div>

                    {{-- Status Control & Action Button --}}
                    <div class="md:col-span-1 space-y-4">
                        <h5 class="text-lg font-bold mb-1 text-red-600">Account Status Control</h5>

                        <div class="form-group">
                            <label for="new_status" class="block text-sm font-medium text-gray-700">Account Status</label>
                            <select name="new_status" id="new_status" class="form-control border border-gray-300 rounded-lg p-2 w-full" required>
                                <option value="pending" {{ $farmer->status === 'pending' ? 'selected' : '' }}>Pending</option>
                                <option value="approved" {{ $farmer->status === 'approved' ? 'selected' : '' }}>Approved (Active)</option>
                                <option value="suspended" {{ $farmer->status === 'suspended' ? 'selected' : '' }}>Suspended</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <input type="hidden" name="admin_password" id="admin_password_input">
                            <button type="button" id="submitStatusButton" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition duration-300 shadow-lg w-full">Save All Changes</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const submitButton = document.getElementById('submitStatusButton');
        const form = document.getElementById('statusUpdateForm');
        const passwordInput = document.getElementById('admin_password_input');

        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show a secure confirmation prompt
            const password = prompt("CONFIRM SECURITY: Please enter your admin password to finalize these changes.");
            
            if (password) {
                // Set the entered password to the hidden input field
                passwordInput.value = password;
                
                // Submit the form programmatically
                form.submit();
            } else {
                alert("Action cancelled. Password is required to update subscription status.");
            }
        });
    });
</script>
@endpush