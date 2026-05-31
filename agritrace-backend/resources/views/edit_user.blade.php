@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">Edit User: {{ $user->name }}</h1>
        <a href="{{ route('dashboard.users') }}" class="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-arrow-left"></i> Back to Users
        </a>
    </div>

    @if (session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{{ session('success') }}</span>
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

    <div class="bg-white shadow-xl rounded-xl p-6">
        
        {{-- Form to update user details (assuming you have an API route like /api/admin/users/{user} for PUT) --}}
        <form action="{{ route('dashboard.users.edit', $user->id) }}" method="POST">
            @csrf
            @method('PUT') 
            
            <h3 class="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Basic Information</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {{-- Name --}}
                <div class="form-group">
                    <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" name="name" id="name" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('name', $user->name) }}" required>
                </div>

                {{-- Email (Read-Only) --}}
                <div class="form-group">
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="email" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" value="{{ $user->email }}" readonly>
                </div>
            </div>

            <h3 class="text-xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2">Role & Status</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {{-- Role (Read-Only) --}}
                <div class="form-group">
                    <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                    <input type="text" id="role" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 font-semibold" value="{{ ucfirst($user->role) }}" readonly>
                </div>
                
                {{-- Status --}}
                <div class="form-group">
                    <label for="status" class="block text-sm font-medium text-gray-700">Account Status</label>
                    <select name="status" id="status" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                        <option value="pending" {{ old('status', $user->status) == 'pending' ? 'selected' : '' }}>Pending</option>
                        <option value="approved" {{ old('status', $user->status) == 'approved' ? 'selected' : '' }}>Approved (Active)</option>
                        <option value="suspended" {{ old('status', $user->status) == 'suspended' ? 'selected' : '' }}>Suspended</option>
                    </select>
                </div>
            </div>

            {{-- FARMER/LOGISTICS SPECIFIC FIELDS --}}
            @if (in_array($user->role, ['farmer', 'logistics']))
            <h3 class="text-xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2">Business Details</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {{-- Contact Number --}}
                <div class="form-group">
                    <label for="contact_number" class="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input type="text" name="contact_number" id="contact_number" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('contact_number', $user->contact_number) }}">
                </div>
                
                {{-- Farm/Company Name --}}
                <div class="form-group">
                    <label for="farm_name" class="block text-sm font-medium text-gray-700">{{ $user->role === 'farmer' ? 'Farm Name' : 'Company Name' }}</label>
                    <input type="text" name="farm_name" id="farm_name" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('farm_name', $user->farm_name) }}">
                </div>
            </div>
            @endif
            
            {{-- SUBSCRIPTION FIELDS (Only visible for Farmer role) --}}
            @if ($user->role === 'farmer')
            <h3 class="text-xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2">Subscription Details</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                {{-- Subscription Plan --}}
                <div class="form-group">
                    <label for="subscription_plan" class="block text-sm font-medium text-gray-700">Plan</label>
                    <input type="text" id="subscription_plan" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" value="{{ $user->subscription_plan ?? 'N/A' }}" readonly>
                </div>
                
                {{-- Products Remaining --}}
                <div class="form-group">
                    <label for="remaining_products" class="block text-sm font-medium text-gray-700">Products Left</label>
                    <input type="text" id="remaining_products" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 font-semibold text-indigo-600" 
                           value="{{ $user->remaining_products === 9999 ? 'UNLIMITED' : ($user->remaining_products ?? 0) }}" readonly>
                </div>
                
                {{-- Plan End Date --}}
                <div class="form-group">
                    <label for="subscription_end_date" class="block text-sm font-medium text-gray-700">Plan End Date</label>
                    <input type="text" id="subscription_end_date" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" 
                           value="{{ $user->subscription_end_date ? \Carbon\Carbon::parse($user->subscription_end_date)->format('Y-m-d') : 'N/A' }}" readonly>
                </div>
            </div>
            <p class="mt-3 text-sm text-red-600">Note: To change the Plan or Quota, use the dedicated "Subscription Management" page.</p>
            @endif

            <div class="mt-8 pt-4 border-t border-gray-200">
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
                    Save Basic Changes
                </button>
            </div>
        </form>
    </div>
</div>
@endsection