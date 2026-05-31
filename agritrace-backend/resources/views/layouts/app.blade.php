<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgriTrace Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        /* Custom Styles for Modern Look and Collapsible Sidebar */
        #app-container {
            display: flex;
            min-height: 100vh;
        }
        #sidebar {
            width: 250px;
            min-width: 250px;
            background-color: #1e293b; /* Slate Gray 800 */
            color: #e2e8f0;
            display: flex;
            flex-direction: column;
            padding: 1rem;
            box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            z-index: 20;
            transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
            overflow-x: hidden;
        }
        /* Collapsed State */
        #sidebar.collapsed {
            width: 65px; 
            min-width: 65px;
            padding-left: 0;
            padding-right: 0;
        }
        /* Icon Alignment FIX: Center icons inside the collapsed width */
        #sidebar.collapsed .nav-link {
            justify-content: center; /* Center the icon horizontally */
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }
        #sidebar.collapsed .nav-link i {
            margin-right: 0; /* Remove margin when collapsed */
        }
        /* Hide text elements when collapsed */
        #sidebar.collapsed .nav-link span,
        #sidebar.collapsed #brand-full {
            display: none; 
        }
        #sidebar.collapsed #brand-icon {
            display: block; /* Show icon replacement */
        }
        
        #main-content-area {
            flex-grow: 1;
            background-color: #f8fafc; 
            padding-left: 250px; /* Default space for sidebar */
            transition: padding-left 0.3s ease-in-out;
        }
        #main-content-area.content-expanded {
            padding-left: 65px; /* Reduced space when collapsed */
        }
        /* Top Navbar */
        #top-navbar {
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 1.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        /* Navigation Link Styles */
        .nav-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            border-radius: 0.5rem;
            color: #cbd5e0;
            text-decoration: none;
            white-space: nowrap;
            transition: background-color 0.2s ease-in-out, color 0.2s;
            position: relative; 
        }
        .nav-link:hover {
            background-color: #334155;
            color: #ffffff;
        }
        .nav-link.active {
            background-color: #3b82f6; 
            color: #ffffff;
            box-shadow: 0 2px 5px rgba(59, 130, 246, 0.4);
        }
        .nav-link i {
            margin-right: 0.75rem;
            width: 20px;
            text-align: center;
        }
        /* Tooltip Styles (Hover on collapsed sidebar) */
        #sidebar.collapsed .nav-link:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            left: 60px; /* Position next to the icon */
            top: 50%;
            transform: translateY(-50%);
            background: #1e293b;
            color: #ffffff;
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            z-index: 50;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }
        /* Preloader Styles */
        #preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.5s;
        }
        .spinner {
            border: 8px solid #f3f3f3;
            border-top: 8px solid #3b82f6;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-100 font-sans leading-normal tracking-normal" onload="document.getElementById('preloader').style.opacity = '0'; document.getElementById('preloader').style.display = 'none';">
    
    {{-- Preloader --}}
    <div id="preloader">
        <div class="spinner"></div>
    </div>

    <div id="app-container">
        <aside id="sidebar">
            {{-- Branding Section (CRITICAL FIX: Hide text on collapse) --}}
            <div class="text-2xl font-extrabold text-white mb-8 border-b border-gray-700 pb-4 flex items-center justify-center">
                <span id="brand-full">AgriTrace <span class="text-indigo-400">Hub</span></span>
                <span id="brand-icon" style="display: none;" class="text-indigo-400 text-3xl font-bold">A</span>
            </div>

            <nav class="flex-grow">
                <ul>
                    {{-- Dashboard --}}
                    <li>
                        <a href="{{ route('dashboard') }}" class="nav-link {{ request()->routeIs('dashboard') ? 'active' : '' }}" data-tooltip="Dashboard">
                            <i class="fas fa-chart-line"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    {{-- Manage Users --}}
                    <li>
                        <a href="{{ route('dashboard.users') }}" class="nav-link {{ request()->routeIs('dashboard.users*') ? 'active' : '' }}" data-tooltip="Manage Users">
                            <i class="fas fa-users"></i>
                            <span>Manage Users</span>
                        </a>
                    </li>
                    {{-- Moderate Products --}}
                    <li>
                        <a href="{{ route('dashboard.products') }}" class="nav-link {{ request()->routeIs('dashboard.products*') ? 'active' : '' }}" data-tooltip="Moderate Products">
                            <i class="fas fa-seedling"></i>
                            <span>Moderate Products</span>
                        </a>
                    </li>
                    {{-- Moderate Reviews --}}
                    <li>
                        <a href="{{ route('dashboard.reviews') }}" class="nav-link {{ request()->routeIs('dashboard.reviews') ? 'active' : '' }}" data-tooltip="Moderate Reviews">
                            <i class="fas fa-star-half-alt"></i>
                            <span>Moderate Reviews</span>
                        </a>
                    </li>
                    {{-- Subscriptions --}}
                    <li>
                        <a href="{{ route('admin.subscriptions') }}" class="nav-link {{ request()->routeIs('admin.subscriptions*') ? 'active' : '' }}" data-tooltip="Subscriptions">
                            <i class="fas fa-credit-card"></i>
                            <span>Subscriptions</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="mt-auto pt-4 border-t border-gray-700">
                <form id="logout-form" method="POST" action="{{ route('logout') }}" class="block">
                    @csrf
                    <button type="submit" class="nav-link w-full text-left bg-red-800 hover:bg-red-700 text-white font-semibold" data-tooltip="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </form>
            </div>
        </aside>

        <div id="main-content-area">
            <header id="top-navbar" class="flex justify-between items-center">
                <button id="sidebarToggle" class="text-gray-600 hover:text-indigo-600 focus:outline-none transition duration-150 ease-in-out">
                    <i class="fas fa-bars text-xl"></i>
                </button>
                
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-3 text-gray-700">
                        @auth 
                            {{-- User Profile Circle with Initial (CRITICAL FIX) --}}
                            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-sm ring-2 ring-indigo-300">
                                {{ strtoupper(substr(Auth::user()->name, 0, 1)) }}
                            </div>

                            <span class="font-semibold text-gray-800 hidden sm:inline">{{ Auth::user()->name }}</span>
                            <span class="text-sm text-gray-500">({{ ucfirst(Auth::user()->role) }})</span>
                        @endauth
                    </div>
                </div>
            </header>

            <main id="content-wrapper">
                <div class="container mx-auto">
                    {{-- Global Alert System (for Session Success/Error/Warning) --}}
                    @if (session('success'))
                        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 transition duration-300 ease-in-out">
                            <i class="fas fa-check-circle mr-2"></i>{{ session('success') }}
                        </div>
                    @endif
                    @if ($errors->any())
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 transition duration-300 ease-in-out">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Error: {{ $errors->first() }}
                        </div>
                    @endif
                    
                    @yield('content')
                </div>
            </main>
        </div>
    </div>
    
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    @stack('scripts')

    {{-- Sidebar Toggle and Logout Confirmation Script --}}
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('main-content-area');
            const toggleButton = document.getElementById('sidebarToggle');
            const logoutForm = document.getElementById('logout-form');
            const brandFull = document.getElementById('brand-full');
            const brandIcon = document.getElementById('brand-icon');
            const isMobile = window.innerWidth <= 768;

            // Initialize sidebar state based on storage/desktop default
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true' && !isMobile;
            
            // Set initial state
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('content-expanded');
                brandFull.style.display = 'none';
                brandIcon.style.display = 'block';
            } else if (!isMobile) {
                brandIcon.style.display = 'none'; // Ensure icon is hidden when expanded on desktop
            }

            toggleButton.addEventListener('click', function() {
                const isCurrentlyCollapsed = sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('content-expanded');
                
                // Toggle branding text/icon
                brandFull.style.display = isCurrentlyCollapsed ? 'none' : 'block';
                brandIcon.style.display = isCurrentlyCollapsed ? 'block' : 'none';

                // Save state to local storage for persistence
                localStorage.setItem('sidebarCollapsed', isCurrentlyCollapsed);

                // If Leaflet Map is present, force resize/redraw after sidebar change
                if (document.getElementById('scanMap')) {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 350); 
                }
            });
            
            // LOGOUT CONFIRMATION POPUP
            logoutForm.addEventListener('submit', function(e) {
                if (!confirm("Are you sure you want to log out?")) {
                    e.preventDefault();
                }
            });
        });
    </script>
</body>
</html>