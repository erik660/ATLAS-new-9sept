import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };



    return (
        <AuthLayout 
            title="Login Portal - KFA Sistem SIA" 
            themeClass="theme-cabang"
            headerSubtitle={null}
        >
            <form onSubmit={submit}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-bold">Kode SAP / Username</label>
                    <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-user"></i></span>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            className="form-control" 
                            placeholder="Masukkan Kode SAP atau Username" 
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            required 
                            autoFocus 
                            autoComplete="username" 
                        />
                    </div>
                    {errors.username && (
                        <span className="text-danger small mt-1 d-block">
                            <i className="fas fa-exclamation-circle me-1"></i>{errors.username}
                        </span>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-bold">Password</label>
                    <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-key"></i></span>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            className="form-control" 
                            placeholder="Masukkan password" 
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required 
                            autoComplete="current-password" 
                        />
                    </div>
                </div>

                <div className="mb-3 form-check">
                    <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="remember" 
                        name="remember" 
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                    />
                    <label className="form-check-label text-white-50" style={{ fontSize: '0.88rem' }} htmlFor="remember">Ingat sesi login saya</label>
                </div>

                <button type="submit" className="btn btn-theme" disabled={processing}>
                    <span>Masuk</span>
                    <i className="fas fa-arrow-right ms-2 btn-icon"></i>
                </button>
            </form>
        </AuthLayout>
    );
}
