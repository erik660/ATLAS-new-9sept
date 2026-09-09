<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Sistem Perizinan SIA - Kimia Farma Apotek')</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --kfa-navy: #002B5B;
            --kfa-orange: #F26522;
            --kfa-bg: #F8F9FA;
        }
        body {
            background-color: var(--kfa-bg);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .navbar-kfa {
            background-color: var(--kfa-navy);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .navbar-brand {
            font-weight: 800;
            font-style: italic;
            color: var(--kfa-orange) !important;
            letter-spacing: 0.5px;
        }
        .navbar-brand span {
            color: white;
            font-style: normal;
        }
        .btn-kfa-orange {
            background-color: var(--kfa-orange);
            color: white;
            border: none;
        }
        .btn-kfa-orange:hover {
            background-color: #d95618;
            color: white;
        }
        .btn-kfa-outline {
            border: 1px solid var(--kfa-orange);
            color: var(--kfa-orange);
        }
        .btn-kfa-outline:hover {
            background-color: var(--kfa-orange);
            color: white;
        }
        .card {
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-radius: 12px;
        }
        .card-header-kfa {
            background-color: white;
            border-bottom: 2px solid var(--kfa-orange);
            border-top-left-radius: 12px !important;
            border-top-right-radius: 12px !important;
            padding: 1.25rem 1.5rem;
        }
        .badge-kfa {
            background-color: rgba(242, 101, 34, 0.1);
            color: var(--kfa-orange);
            border: 1px solid var(--kfa-orange);
        }
    </style>
    @yield('extra-css')
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark navbar-kfa sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#">kimia farma <span>Apotek</span></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-center">
                    <li class="nav-item me-4 text-white-50">
                        @if((Auth::guard('admin')->check() || Auth::check()))
                            Halo, <strong class="text-white">{{ (Auth::guard('admin')->check() ? Auth::guard('admin')->user() : Auth::user())->name }}</strong> 
                            <small>({{ (Auth::guard('admin')->check() ? Auth::guard('admin')->user() : Auth::user())->unit_bisnis ?? 'Cabang' }})</small>
                        @endif
                    </li>
                    <li class="nav-item">
                        @if((Auth::guard('admin')->check() || Auth::check()))
                            @php
                                $logoutRoute = (Auth::guard('admin')->check() ? Auth::guard('admin')->user() : Auth::user())->role === 'admin' ? route('admin.logout') : route('cabang.logout');
                            @endphp
                            <form action="{{ $logoutRoute }}" method="POST" class="d-inline">
                                @csrf
                                <button type="submit" class="btn btn-sm btn-kfa-outline bg-white">Logout</button>
                            </form>
                        @endif
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <main class="py-5">
        <div class="container">
            @if ($message = Session::get('success'))
                <div class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                    <i class="fas fa-check-circle me-2"></i>{{ $message }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            @endif

            @if ($message = Session::get('error'))
                <div class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>{{ $message }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            @endif

            @yield('content')
        </div>
    </main>

    <footer class="text-center py-4 text-muted mt-5">
        <small>&copy; {{ date('Y') }} PT Kimia Farma Apotek. Sistem Perizinan SIA.</small>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    @yield('extra-js')
</body>
</html>
