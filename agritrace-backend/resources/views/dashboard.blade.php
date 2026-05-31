@extends('layouts.app')

@section('content')
<style>
    /* Custom styles for animations and professional cards */
    .dashboard-card {
        transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
    }
    .dashboard-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    /* Map and Chart Styles */
    .map-container {
        height: 400px; 
        width: 100%;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1; 
    }
    .chart-box {
        position: relative;
        height: 350px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .quota-center-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        line-height: 1;
        text-align: center;
    }
    /* Status Ring Effect for Pending Items */
    .status-ring {
        animation: pulse-ring 1s infinite;
    }
    @keyframes pulse-ring {
        0% { box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(255, 165, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 165, 0, 0); }
    }
</style>

<div class="container mx-auto p-4">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-6">Administrator Analytics Hub</h1>

    {{-- 1. CRITICAL ALERTS SECTION --}}
    <div class="space-y-4 mb-8">
        @php
            $totalScans = count($scanData); 
        @endphp

        {{-- Alert for Pending Reviews --}}
        @if ($pendingReviewsCount > 0)
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg status-ring" role="alert">
            <p class="font-bold">Action Required: {{ $pendingReviewsCount }} Reviews Pending!</p>
            <p class="text-sm">Go to <a href="{{ route('dashboard.reviews') }}" class="font-semibold underline">Moderate Reviews</a>.</p>
        </div>
        @endif
        
        {{-- Alert for Pending Users (CRITICAL LIVE DATA) --}}
        @if ($pendingUsersCount > 0)
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg status-ring" role="alert">
            <p class="font-bold">Urgent: {{ $pendingUsersCount }} New Users Awaiting Approval/Subscription!</p>
            <p class="text-sm">Check the <a href="{{ route('dashboard.users') }}" class="font-semibold underline">Manage Users</a> page.</p>
        </div>
        @endif
    </div>

    {{-- 2. QUICK STATS CARDS --}}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        @php
            $farmerCount = $userCounts->firstWhere('role', 'farmer')->count ?? 0;
            $buyerCount = $userCounts->firstWhere('role', 'buyer')->count ?? 0;
        @endphp

        {{-- Card 1: Total Products --}}
        <div class="dashboard-card bg-white p-6 rounded-xl shadow-md border-b-4 border-indigo-500">
            <p class="text-sm font-semibold text-gray-500 uppercase">Total Products</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ $totalProducts }}</p>
        </div>

        {{-- Card 2: Active Farmers (SMEs) --}}
        <div class="dashboard-card bg-white p-6 rounded-xl shadow-md border-b-4 border-green-500">
            <p class="text-sm font-semibold text-gray-500 uppercase">Active Farmers (SMEs)</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ $farmerCount }}</p>
        </div>

        {{-- Card 3: Total Scans Recorded --}}
        <div class="dashboard-card bg-white p-6 rounded-xl shadow-md border-b-4 border-blue-500">
            <p class="text-sm font-semibold text-gray-500 uppercase">Total Scans Recorded</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ $totalScans }}</p>
        </div>

        {{-- Card 4: Reviews Pending --}}
        <div class="dashboard-card bg-white p-6 rounded-xl shadow-md border-b-4 border-yellow-500">
            <p class="text-sm font-semibold text-gray-500 uppercase">Pending Reviews</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ $pendingReviewsCount }}</p>
        </div>
    </div>
    
    {{-- 3. INTERACTIVE MAP & ANALYTICS CHART AREA --}}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {{-- Left Column: Scan Activity Map --}}
        <div class="lg:col-span-2 bg-white shadow-xl rounded-xl p-6">
            <h4 class="text-xl font-bold text-gray-800 mb-4">Live Scan Activity Map</h4>
            <div id="scanMap" class="map-container"></div>
        </div>

        {{-- Right Column: Quota Health Gauge Chart (LIVE DATA) --}}
        <div class="lg:col-span-1 bg-white shadow-xl rounded-xl p-6">
            <h4 class="text-xl font-bold text-gray-800 mb-4">Sample Quota Health</h4>
            <div class="chart-box">
                 <canvas id="quotaChart" class="w-full h-full"></canvas>
                 <div class="quota-center-text">
                     @if ($quotaChartData['total'] === 1)
                        <span class="text-3xl font-extrabold text-indigo-600">UNLIMITED</span>
                     @else
                        <span class="text-3xl font-extrabold text-indigo-600">
                             {{ round(100 - ($quotaChartData['remaining'] / $quotaChartData['total'] * 100), 1) }}%
                        </span>
                        <p class="text-sm text-gray-500 mt-1">Used</p>
                     @endif
                 </div>
            </div>
        </div>
    </div>
    
    {{-- 4. RECENT ACTIVITY TABLE --}}
    <div class="bg-white shadow-xl rounded-xl p-6">
        <h4 class="text-xl font-bold text-gray-800 mb-4">Recent Trace Activity Log</h4>
        <div class="table-responsive">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location/Action</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Role</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @forelse (array_slice($scanData->toArray(), 0, 10) as $scan)
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ \Carbon\Carbon::parse($scan['created_at'])->diffForHumans() }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                            #{{ $scan['product_id'] }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {{ $scan['location_address'] ?? $scan['notes'] ?? 'N/A' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ $scan['user']['name'] ?? 'System' }} 
                            (<span class="font-semibold text-xs">{{ $scan['user']['role'] ?? 'Admin' }}</span>)
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="4" class="px-6 py-4 text-center text-gray-500">No recent activity recorded.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

@push('scripts') 
{{-- Load Chart.js for the Quota Chart --}}
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script> 

<script>
    // Convert PHP data to JavaScript array (ensuring data integrity)
    const scanData = @json($scanData); 
    const quotaData = @json($quotaChartData);

    // --- LEAFLET MAP INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', function() {
        const mapElement = document.getElementById('scanMap');
        if (!mapElement) return;

        const validScans = scanData.filter(scan => scan.location_lat && scan.location_lon);

        if (validScans.length > 0) {
            let sumLat = 0;
            let sumLon = 0;
            
            validScans.forEach(scan => {
                sumLat += parseFloat(scan.location_lat);
                sumLon += parseFloat(scan.location_lon);
            });
            
            const centerLat = sumLat / validScans.length;
            const centerLon = sumLon / validScans.length;

            const map = L.map('scanMap').setView([centerLat, centerLon], 6); 

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add markers for all valid scan points
            validScans.forEach(scan => {
                const userRole = scan.user ? scan.user.role : 'Admin';
                const color = userRole === 'buyer' ? 'red' : 'green'; // Simple color coding
                
                L.marker([parseFloat(scan.location_lat), parseFloat(scan.location_lon)]).addTo(map)
                .bindPopup(`
                    <div style="font-size:12px;">
                        <b>Product:</b> #${scan.product_id} (${scan.product.crop_type})<br>
                        <b>Logged By:</b> ${scan.user.name ?? 'System'}<br>
                        <b>Action:</b> ${scan.location_address}<br>
                        <b>Time:</b> ${new Date(scan.created_at).toLocaleTimeString()}
                    </div>
                `);
            });
            // Fix: Invalidate size after map container has fully rendered
            setTimeout(() => { map.invalidateSize(); }, 400); 

        } else {
             mapElement.innerHTML = '<div class="p-4 text-gray-600 text-center">No geo-tagged scans available to display.</div>';
        }
    
        // --- QUOTA GAUGE CHART (Chart.js LIVE INTEGRATION) ---
        const ctx = document.getElementById('quotaChart');
        if (!ctx) return;

        const utilized = quotaData.total === 1 ? 1 : (quotaData.total - quotaData.remaining);
        const remaining = quotaData.total === 1 ? 0 : quotaData.remaining;
        const total = quotaData.total;
        
        const data = {
            labels: ['Used', 'Remaining'],
            datasets: [{
                data: [utilized, remaining],
                backgroundColor: ['#f59e0b', '#10b981'], // Yellow/Green
                borderWidth: 0,
            }]
        };
        
        // Configuration for the doughnut chart to act as a gauge
        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%', 
                rotation: -90, // Start from the top
                circumference: 180, // Only show top half
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += total === 1 ? 'Unlimited' : (context.raw + ' products');
                                return label;
                            },
                            title: () => null,
                        }
                    }
                }
            }
        });
    });
</script>
@endpush
@endsection