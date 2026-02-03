'use client'

import { useState } from 'react'
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' - Removing as we are different package
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { getURL } from '@/lib/utils'
import { Eye, EyeOff, Loader2, Lock, Mail, UserPlus, ArrowRight, User } from 'lucide-react'
import { useEffect } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const savedEmail = localStorage.getItem('vikki_remembered_email')
        const savedRemember = localStorage.getItem('vikki_remember_me')

        if (savedRemember === 'true' && savedEmail) {
            setEmail(savedEmail)
            setRememberMe(true)
        }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        if (rememberMe) {
            localStorage.setItem('vikki_remembered_email', email)
            localStorage.setItem('vikki_remember_me', 'true')
        } else {
            localStorage.removeItem('vikki_remembered_email')
            localStorage.removeItem('vikki_remember_me')
        }

        try {
            if (isForgotPassword) {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${getURL()}auth/callback?next=/auth/update-password`,
                })
                if (resetError) throw resetError
                setSuccess('Password reset link sent! Check your email.')
                // Keep them on the screen but maybe clear loading
            } else if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${getURL()}auth/callback`,
                        data: {
                            full_name: fullName,
                        }
                    },
                })
                if (signUpError) throw signUpError
                setSuccess('Account created! Please check your email to confirm your subscription.')
                setIsSignUp(false)
                setPassword('')
                setFullName('')
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (signInError) throw signInError
                router.push('/') // Redirect to dashboard
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleMode = (mode: 'login' | 'signup' | 'forgot') => {
        setError(null)
        setSuccess(null)
        if (mode === 'login') {
            setIsSignUp(false)
            setIsForgotPassword(false)
        } else if (mode === 'signup') {
            setIsSignUp(true)
            setIsForgotPassword(false)
        } else if (mode === 'forgot') {
            setIsForgotPassword(true)
            setIsSignUp(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-border">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Welcome back')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {isForgotPassword
                            ? 'Enter your email to receive a reset link'
                            : (isSignUp ? 'Sign up to get started' : 'Sign in to access your account')}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        {success && (
                            <div className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/50">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                {error}
                            </div>
                        )}

                        {isSignUp && (
                            <div>
                                <label htmlFor="fullName" className="sr-only">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        required={isSignUp}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required={!isForgotPassword}
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isForgotPassword && (
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                                <span>Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => toggleMode('forgot')}
                                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    {isForgotPassword ? (
                                        <span>Send Reset Link</span>
                                    ) : (isSignUp ? (
                                        <>
                                            <UserPlus className="h-5 w-5" />
                                            <span>Create Account</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign in</span>
                                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    ))}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        {isForgotPassword ? (
                            <p className="text-gray-600 dark:text-gray-400">
                                Remember your password?{' '}
                                <button
                                    type="button"
                                    onClick={() => toggleMode('login')}
                                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                                >
                                    Sign In
                                </button>
                            </p>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                <button
                                    type="button"
                                    onClick={() => toggleMode(isSignUp ? 'login' : 'signup')}
                                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                                >
                                    {isSignUp ? 'Sign In' : 'Create Account'}
                                </button>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
