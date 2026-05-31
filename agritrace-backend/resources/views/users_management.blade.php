@extends('layouts.app')

@section('content')
<div class="container-fluid mx-auto p-4">
    <div class="row mb-4">
        <div class="col-12">
            <h1 class="text-3xl font-extrabold text-gray-900">User Management</h1>
        </div>
    </div>

    <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <div class="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h6 class="text-lg font-bold text-gray-800">All Registered Users</h6>
            <a href="{{ route('dashboard.users.create') }}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300">
                <i class="fas fa-plus"></i> Add New User
            </a>
        </div>
        <div class="p-4">
            <div class="table-responsive">
                <table class="min-w-full divide-y divide-gray-200" id="dataTable" width="100%" cellspacing="0">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            
                            {{-- NEW FARMER/SUBSCRIPTION COLUMNS --}}
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products Left</th>
                            {{-- END NEW COLUMNS --}}
                            
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @foreach ($users as $user)
                        <tr class="hover:bg-gray-50 transition duration-150 ease-in-out">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ $user->name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ ucfirst($user->role) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    {{ $user->status === 'approved' ? 'bg-green-100 text-green-800' : ($user->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') }}">
                                    {{ $user->status }}
                                </span>
                            </td>
                            
                            {{-- DYNAMIC SUBSCRIPTION FIELDS --}}
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $user->farm_name ?? 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $user->contact_number ?? 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ $user->subscription_plan ?? 'N/A' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                @if($user->remaining_products === 9999)
                                    <span class="font-bold text-indigo-600">UNLIMITED</span>
                                @else
                                    {{ $user->remaining_products ?? '0' }}
                                @endif
                            </td>
                            {{-- END DYNAMIC SUBSCRIPTION FIELDS --}}
                            
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a href="{{ route('dashboard.users.edit', $user->id) }}" class="text-indigo-600 hover:text-indigo-900 transition duration-150">Edit</a>
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