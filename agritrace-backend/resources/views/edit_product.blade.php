@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">
            Moderate Product: {{ $product->crop_type }} (ID: {{ $product->id }})
        </h1>
        <a href="{{ route('dashboard.products') }}" class="bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-arrow-left"></i> Back to Products
        </a>
    </div>

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

    <div class="bg-white shadow-xl rounded-xl p-6">
        
        {{-- CRITICAL FIX: Form action changed to the PUT submission route 'dashboard.products.update' --}}
        <form action="{{ route('dashboard.products.update', $product->id) }}" method="POST" enctype="multipart/form-data">
            @csrf
            @method('PUT') 
            
            <h3 class="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Moderation & Status</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {{-- Current Status --}}
                <div class="form-group">
                    <label for="current_status" class="block text-sm font-medium text-gray-700">Current Status</label>
                    <input type="text" id="current_status" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 font-semibold" value="{{ $product->status }}" readonly>
                </div>

                {{-- New Status for Moderation --}}
                <div class="form-group">
                    <label for="status" class="block text-sm font-medium text-gray-700">New Moderation Status</label>
                    <select name="status" id="status" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                        <option value="Active" {{ $product->status == 'Active' ? 'selected' : '' }}>Approve (Active)</option>
                        <option value="Pending Approval" {{ $product->status == 'Pending Approval' ? 'selected' : '' }}>Pending Approval</option>
                        <option value="Rejected" {{ $product->status == 'Rejected' ? 'selected' : '' }}>Reject Product</option>
                        <option value="Suspended" {{ $product->status == 'Suspended' ? 'selected' : '' }}>Suspend (Deactivate)</option>
                    </select>
                </div>
                
                {{-- Quality Grade --}}
                <div class="form-group">
                    <label for="quality_grade" class="block text-sm font-medium text-gray-700">Quality Grade</label>
                    <input type="text" name="quality_grade" id="quality_grade" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('quality_grade', $product->quality_grade) }}">
                </div>

            </div>
            
            <h3 class="text-xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2">Product Details</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {{-- Crop Type --}}
                <div class="form-group">
                    <label for="crop_type" class="block text-sm font-medium text-gray-700">Crop Type</label>
                    <input type="text" name="crop_type" id="crop_type" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('crop_type', $product->crop_type) }}" required>
                </div>
                
                {{-- Variety --}}
                <div class="form-group">
                    <label for="variety" class="block text-sm font-medium text-gray-700">Variety</label>
                    <input type="text" name="variety" id="variety" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('variety', $product->variety) }}" required>
                </div>
                
                {{-- Farming Method --}}
                <div class="form-group">
                    <label for="farming_method" class="block text-sm font-medium text-gray-700">Farming Method</label>
                    <input type="text" name="farming_method" id="farming_method" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('farming_method', $product->farming_method) }}" required>
                </div>

                {{-- Harvest Date --}}
                <div class="form-group">
                    <label for="harvest_date" class="block text-sm font-medium text-gray-700">Harvest Date</label>
                    <input type="date" name="harvest_date" id="harvest_date" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" 
                        value="{{ old('harvest_date', $product->harvest_date ? \Carbon\Carbon::parse($product->harvest_date)->format('Y-m-d') : '') }}" required>
                </div>

                {{-- Packaging Type --}}
                <div class="form-group">
                    <label for="packaging_type" class="block text-sm font-medium text-gray-700">Packaging Type</label>
                    <input type="text" name="packaging_type" id="packaging_type" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('packaging_type', $product->packaging_type) }}" required>
                </div>
                
                {{-- Weight Per Unit --}}
                <div class="form-group">
                    <label for="weight_per_unit" class="block text-sm font-medium text-gray-700">Weight Per Unit (kg)</label>
                    <input type="number" step="0.01" name="weight_per_unit" id="weight_per_unit" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('weight_per_unit', $product->weight_per_unit) }}" required>
                </div>

            </div>

            <h3 class="text-xl font-bold text-gray-700 mt-8 mb-4 border-b pb-2">Traceability Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {{-- Origin Address --}}
                <div class="form-group md:col-span-1">
                    <label for="origin_location_address" class="block text-sm font-medium text-gray-700">Origin Address</label>
                    <textarea name="origin_location_address" id="origin_location_address" rows="2" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>{{ old('origin_location_address', $product->origin_location_address) }}</textarea>
                </div>
                
                {{-- Special Remarks --}}
                <div class="form-group md:col-span-1">
                    <label for="special_remarks" class="block text-sm font-medium text-gray-700">Special Remarks</label>
                    <textarea name="special_remarks" id="special_remarks" rows="2" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2">{{ old('special_remarks', $product->special_remarks) }}</textarea>
                </div>
                
                {{-- Farmer Contact --}}
                <div class="form-group">
                    <label for="contact_number" class="block text-sm font-medium text-gray-700">Farmer Contact</label>
                    <input type="text" name="contact_number" id="contact_number" class="form-control mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" value="{{ old('contact_number', $product->contact_number) }}">
                </div>
            </div>
            
            <div class="mt-8 pt-4 border-t border-gray-200">
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">
                    Save Changes & Update Status
                </button>
            </div>
        </form>
    </div>
</div>
@endsection