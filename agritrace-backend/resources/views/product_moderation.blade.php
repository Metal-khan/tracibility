@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">Product Moderation & Overview</h1>
        {{-- Button for creating new user/product can be added here if needed --}}
    </div>

    @if (session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{{ session('success') }}</span>
        </div>
    @endif
    
    <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <div class="p-4 border-b border-gray-200 bg-gray-50">
            <h6 class="text-lg font-bold text-gray-800">All Products in Traceability System</h6>
        </div>
        
        <div class="p-4">
            <div class="table-responsive">
                <table class="min-w-full divide-y divide-gray-200" id="dataTable" width="100%" cellspacing="0">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop / Variety</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @foreach ($products as $product)
                        <tr class="hover:bg-gray-50 transition duration-150 ease-in-out">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ $product->id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $product->crop_type }} / {{ $product->variety }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $product->farmer->name ?? 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $product->harvest_date ? \Carbon\Carbon::parse($product->harvest_date)->format('Y-m-d') : 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $product->quality_grade }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                @php
                                    $status_class = 'bg-gray-500';
                                    if ($product->status === 'Active') $status_class = 'bg-green-600';
                                    elseif ($product->status === 'Pending Approval') $status_class = 'bg-yellow-500';
                                    elseif ($product->status === 'Edited Pending Approval') $status_class = 'bg-orange-500';
                                    // Handle Suspended/Rejected
                                    elseif ($product->status === 'Suspended' || $product->status === 'Rejected') $status_class = 'bg-red-600';
                                @endphp
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ $status_class }} text-white">
                                    {{ $product->status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <a href="{{ route('dashboard.products.view', $product->id) }}" class="text-indigo-600 hover:text-indigo-900 transition duration-150">View</a>
                                
                                {{-- ADDED EDIT LINK --}}
                                <a href="{{ route('dashboard.products.edit', $product->id) }}" class="text-blue-600 hover:text-blue-900 transition duration-150">Edit</a>
                                {{-- The 'Moderate' link is usually the same as 'Edit' but we keep it distinct for context --}}
                                
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection