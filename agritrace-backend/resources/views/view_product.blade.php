@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">
            Product Detail: {{ $product->crop_type }} (ID: {{ $product->id }})
        </h1>
        <a href="{{ route('dashboard.products') }}" class="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-arrow-left"></i> Back to Moderation
        </a>
    </div>

    @if (session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            {{ session('success') }}
        </div>
    @endif
    
    {{-- CRITICAL FIX: Decode photos_urls here to ensure it's an array for Blade --}}
    @php
        // Ensure the photo URLs are treated as an array.
        // If it's a string (JSON), decode it. If it's null, set to an empty array.
        $photoUrls = is_array($product->photos_urls) ? $product->photos_urls : json_decode($product->photos_urls, true) ?? [];
    @endphp

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {{-- Column 1: Core Details & Identification --}}
        <div class="lg:col-span-1 space-y-6">
            <div class="bg-white shadow-lg rounded-xl p-6 border-t-4 border-indigo-500">
                <h4 class="text-xl font-bold text-indigo-700 mb-4">Product ID & Barcode</h4>
                
                {{-- Barcode Display --}}
                @if ($product->qr_code_url)
                    <div class="text-center mb-4 border border-gray-200 p-3 rounded-lg bg-gray-50">
                        <img src="{{ $product->qr_code_url }}" alt="Product Barcode" style="width: 100%; max-height: 120px; object-fit: contain;">
                        <p class="text-sm font-semibold mt-2 text-gray-700">{{ $product->barcode_text ?? 'ID: ' . $product->id }}</p>
                    </div>
                @endif
                
                <p><strong>Status:</strong> 
                    <span class="font-bold text-white px-2 py-0.5 rounded-full text-xs 
                        @if($product->status === 'Active') bg-green-600 
                        @elseif(str_contains($product->status, 'Pending')) bg-orange-500
                        @else bg-red-600
                        @endif">
                        {{ $product->status }}
                    </span>
                </p>
                <p><strong>Submitted By:</strong> {{ $product->farmer->name ?? 'N/A' }}</p>
                <p><strong>Harvest Date:</strong> {{ $product->harvest_date ? \Carbon\Carbon::parse($product->harvest_date)->format('Y-m-d') : 'N/A' }}</p>
                <p><strong>Quality Grade:</strong> {{ $product->quality_grade }}</p>

                <hr class="my-4">

                {{-- Moderation Action Button --}}
                @if (str_contains($product->status, 'Pending') || str_contains($product->status, 'Edited'))
                    <a href="{{ route('dashboard.products.edit', $product->id) }}" class="btn w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition duration-300">
                        Review & Moderate Changes
                    </a>
                @endif
            </div>

            {{-- Product Gallery --}}
            <div class="bg-white shadow-lg rounded-xl p-6 border-t-4 border-blue-500">
                {{-- FIX: Use the prepared $photoUrls variable for count --}}
                <h4 class="text-xl font-bold text-blue-700 mb-4">Product Gallery ({{ count($photoUrls) }})</h4>
                <div class="grid grid-cols-2 gap-3">
                    {{-- FIX: Loop over the prepared array --}}
                    @forelse ($photoUrls as $url)
                        <img src="{{ $url }}" class="w-full h-24 object-cover rounded-md" alt="Product Photo">
                    @empty
                        <p class="text-gray-500 col-span-2">No photos uploaded for this product.</p>
                    @endforelse
                </div>
            </div>
        </div>

        {{-- Column 2: Trace History --}}
        <div class="lg:col-span-2 space-y-6">
            
            {{-- Traceability Timeline --}}
            <div class="bg-white shadow-lg rounded-xl p-6 border-t-4 border-green-500">
                <h4 class="text-xl font-bold text-green-700 mb-4">Traceability Timeline / Checkpoints</h4>
                
                @forelse ($product->checkpoints as $cp)
                <div class="flex space-x-4 mb-4 border-l-4 pl-4 
                    @if(str_contains($cp->location_address, 'Consumer Scan')) border-red-400 @else border-green-400 @endif">
                    
                    <div class="flex-shrink-0">
                         <span class="text-sm text-gray-500">{{ \Carbon\Carbon::parse($cp->timestamp)->format('M d, H:i') }}</span>
                    </div>
                    <div class="flex-grow">
                        <p class="font-bold text-gray-800">{{ $cp->location_address }}</p>
                        <p class="text-sm text-gray-600">User: {{ $cp->user->name ?? 'System' }}</p>
                        <p class="text-xs text-gray-500 italic">Notes: {{ $cp->notes }}</p>
                        <p class="text-xs text-gray-500">Coords: {{ $cp->location_lat }}, {{ $cp->location_lon }}</p>
                    </div>
                </div>
                @empty
                    <p class="text-gray-500">No checkpoints recorded after initial farmer submission.</p>
                @endforelse
            </div>
            
            {{-- Dynamic & Additional Fields --}}
            <div class="bg-white shadow-lg rounded-xl p-6 border-t-4 border-purple-500">
                <h4 class="text-xl font-bold text-purple-700 mb-4">Dynamic & Additional Fields</h4>
                
                <p><strong>Farming Method:</strong> {{ $product->farming_method }}</p>
                <p><strong>Estimated Yield:</strong> {{ $product->estimated_yield }}</p>
                <p><strong>Storage Method:</strong> {{ $product->storage_method }}</p>

                <hr class="my-4">

                <h5 class="font-bold text-gray-700 mb-2">Custom Dynamic Data:</h5>
                @forelse ($product->dynamicFieldValues as $dfv)
                    <p class="text-sm border-l-2 pl-2 mt-1">
                        <span class="font-semibold">{{ $dfv->dynamicField->name ?? 'Custom Field' }}:</span> 
                        {{ $dfv->value }}
                    </p>
                @empty
                    <p class="text-gray-500 text-sm">No custom dynamic fields submitted.</p>
                @endforelse
            </div>
        </div>
    </div>
</div>
@endsection