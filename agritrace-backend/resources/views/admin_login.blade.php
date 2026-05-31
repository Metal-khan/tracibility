@extends('layouts.auth') 

@section('content')
<div class="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-600">
    <h2 class="text-3xl font-extrabold mb-6 text-center text-gray-900">AgriTrace Admin Login</h2>
    <p class="text-center text-gray-500 mb-8">Sign in to manage traceability operations.</p>
    
    {{-- Error/Success Messages --}}
    @if ($errors->any())
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong class="font-bold">Login Failed!</strong>
            <span class="block sm:inline">{{ $errors->first() }}</span>
        </div>
    @endif
    @if (session('status'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <span class="block sm:inline">{{ session('status') }}</span>
        </div>
    @endif

    <form method="POST" action="{{ url('/admin-login') }}" class="space-y-6">
        @csrf 
        
        {{-- Email Field --}}
        <div class="mb-4">
            <label for="email" class="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <input type="email" id="email" name="email" 
                class="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150" 
                placeholder="Enter your email" value="{{ old('email') }}" required autofocus autocomplete="email">
        </div>
        
        {{-- Password Field with Toggle (CRITICAL FIX) --}}
        <div class="mb-6">
            <label for="password" class="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <div class="relative">
                <input type="password" id="password" name="password" 
                    class="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 pr-10" 
                    placeholder="Enter your password" required autocomplete="current-password">
                
                {{-- Toggle Icon --}}
                <span class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onclick="togglePasswordVisibility('password')">
                    <svg id="eye-icon-password" class="h-5 w-5 text-gray-400 hover:text-gray-600 transition duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                </span>
            </div>
        </div>
        
        {{-- Sign In Button --}}
        <div class="flex items-center justify-between">
            <button type="submit" 
                class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg w-full transition duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Sign In
            </button>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
    function togglePasswordVisibility(fieldId) {
        const passwordInput = document.getElementById(fieldId);
        const eyeIcon = document.getElementById('eye-icon-' + fieldId);

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            // Change icon to 'eye-slash' (simulated with path changes or class updates)
            eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7 1.274-4.057 5.065-7 9.542-7 1.71 0 3.33 0.443 4.743 1.246M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
            eyeIcon.setAttribute('stroke', 'currentColor');
        } else {
            passwordInput.type = 'password';
            // Change icon back to 'eye'
            eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`;
            eyeIcon.setAttribute('stroke', 'currentColor');
        }
    }
</script>
@endpush