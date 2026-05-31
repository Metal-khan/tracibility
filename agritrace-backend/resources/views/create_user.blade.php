@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">Create New User Account</h1>
        <a href="{{ route('dashboard.users') }}" class="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-arrow-left"></i> Back to User List
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
        
        {{-- Form to create a new user --}}
        <form action="{{ route('dashboard.users.store') }}" method="POST">
            @csrf
            
            <h3 class="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Account Details</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {{-- Name --}}
                <div class="form-group">
                    <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="name" id="name" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('name') }}" required autocomplete="off">
                </div>

                {{-- Email --}}
                <div class="form-group">
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('email') }}" required autocomplete="off">
                </div>
                
                {{-- Password Input with Show/Hide Toggle (CRITICAL CHANGE) --}}
                <div class="form-group md:col-span-1">
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <div class="relative">
                        <input type="password" name="password" id="password" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 pr-10" required autocomplete="new-password">
                        <span class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onclick="togglePasswordVisibility('password')">
                            <i id="eye-icon-password" class="fas fa-eye text-gray-500"></i>
                        </span>
                    </div>
                </div>
                
                {{-- Role Selector --}}
                <div class="form-group">
                    <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" id="role" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required onchange="toggleRoleFields()">
                        <option value="farmer" {{ old('role') == 'farmer' ? 'selected' : '' }}>SME / Farmer</option>
                        <option value="buyer" {{ old('role') == 'buyer' ? 'selected' : '' }}>Buyer (End User)</option>
                        <option value="logistics" {{ old('role') == 'logistics' ? 'selected' : '' }}>Logistics</option>
                        <option value="admin" {{ old('role') == 'admin' ? 'selected' : '' }}>Admin</option>
                        <option value="super_admin" {{ old('role') == 'super_admin' ? 'selected' : '' }}>Super Admin</option>
                    </select>
                </div>
            </div>

            <h3 class="text-xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2">Business & Status</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {{-- FARMER/LOGISTICS SPECIFIC CONTAINER --}}
                <div id="farmer-fields" class="col-span-1 md:col-span-2">
                    {{-- Farm/Company Name --}}
                    <div class="form-group">
                        <label for="farm_name" class="block text-sm font-medium text-gray-700" id="farm_label">Farm / Company Name</label>
                        <input type="text" name="farm_name" id="farm_name" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('farm_name') }}" autocomplete="off">
                    </div>
                    
                    {{-- Contact Number --}}
                    <div class="form-group">
                        <label for="contact_number" class="block text-sm font-medium text-gray-700">Contact Number</label>
                        <input type="text" name="contact_number" id="contact_number" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('contact_number') }}" autocomplete="off">
                    </div>
                </div>
                
                {{-- Status --}}
                <div class="form-group">
                    <label for="status" class="block text-sm font-medium text-gray-700">Initial Status</label>
                    <select name="status" id="status" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                        <option value="pending" {{ old('status') == 'pending' ? 'selected' : '' }}>Pending (Needs Approval)</option>
                        <option value="approved" {{ old('status') == 'approved' ? 'selected' : '' }}>Approved (Active)</option>
                        <option value="suspended" {{ old('status') == 'suspended' ? 'selected' : '' }}>Suspended</option>
                    </select>
                </div>
                
                {{-- Subscription Management Link (Read-only reminder) --}}
                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700">Subscription Quota</label>
                    <p class="text-sm text-gray-500 mt-1 p-2 border border-dashed border-gray-300 rounded-md">
                        Quota and Plans are managed on the Subscriptions page after creation.
                    </p>
                </div>
            </div>

            <div class="mt-8 pt-4 border-t border-gray-200">
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
                    Create User Account
                </button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // --- START: PASSWORD TOGGLE FUNCTION ---
    function togglePasswordVisibility(fieldId) {
        const passwordInput = document.getElementById(fieldId);
        const eyeIcon = document.getElementById('eye-icon-' + fieldId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    }
    // --- END: PASSWORD TOGGLE FUNCTION ---

    function toggleRoleFields() {
        const role = document.getElementById('role').value;
        const fieldsContainer = document.getElementById('farmer-fields');
        const farmLabel = document.getElementById('farm_label');

        // Reset inputs on role switch to prevent incorrect data submission
        document.getElementById('farm_name').value = '';
        document.getElementById('contact_number').value = '';
        
        if (role === 'farmer' || role === 'logistics') {
            fieldsContainer.style.display = 'block';

            // Change label based on role
            if (role === 'farmer') {
                farmLabel.innerHTML = 'Farm Name (SME/Farmer)';
            } else if (role === 'logistics') {
                farmLabel.innerHTML = 'Company Name (Logistics)';
            }
            
            // Set required attribute dynamically
            document.getElementById('farm_name').setAttribute('required', 'required');
            document.getElementById('contact_number').setAttribute('required', 'required');
            
        } else {
            // Hide for 'buyer', 'admin', 'super_admin'
            fieldsContainer.style.display = 'none';
            
            // Remove required attribute when hidden
            document.getElementById('farm_name').removeAttribute('required');
            document.getElementById('contact_number').removeAttribute('required');
        }
    }

    // Call on load to ensure initial state is correct
    document.addEventListener('DOMContentLoaded', toggleRoleFields);
</script>
@endpush