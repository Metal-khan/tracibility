@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-extrabold text-gray-900">Subscription Management</h1>
        <a href="{{ route('admin.subscriptions.detail', ['farmer' => 0]) }}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
            <i class="fas fa-plus"></i> Manual Subscription
        </a>
    </div>

    @if (session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{{ session('success') }}</span>
        </div>
    @endif

    <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <div class="p-4 border-b border-gray-200 bg-gray-50">
            <h6 class="text-lg font-bold text-gray-800">Farmer Account Subscriptions Overview</h6>
        </div>
        <div class="p-4">
            <div class="table-responsive">
                <table class="min-w-full divide-y divide-gray-200" id="dataTable">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products Left</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @foreach ($farmers as $farmer)
                        <tr class="hover:bg-gray-50 transition duration-150 ease-in-out">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ $farmer->id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $farmer->name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                @php
                                    $plan_color = 'bg-gray-400';
                                    if ($farmer->subscription_plan === 'FREE_TRIAL_3') $plan_color = 'bg-blue-500';
                                    elseif ($farmer->status === 'approved') $plan_color = 'bg-green-500';
                                @endphp
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ $plan_color }} text-white">
                                    {{ $farmer->subscription_plan ?? 'N/A' }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                @if($farmer->remaining_products === 9999)
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">UNLIMITED</span>
                                @else
                                    {{ $farmer->remaining_products ?? 0 }}
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                @php
                                    $status_color = 'bg-red-500';
                                    if ($farmer->status === 'approved') $status_color = 'bg-green-500';
                                    elseif ($farmer->status === 'pending') $status_color = 'bg-yellow-500';
                                @endphp
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ $status_color }} text-white">
                                    {{ $farmer->status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a href="{{ route('admin.subscriptions.detail', $farmer->id) }}" class="text-indigo-600 hover:text-indigo-900 transition duration-150">Manage</a>
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