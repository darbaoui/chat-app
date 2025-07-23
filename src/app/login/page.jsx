'use client'
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/icons/Logo';


const Login = () => {
    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/',
    })
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {


        setIsLoading(true);
        setErrors({});

        try {
            await login({ ...formData, setErrors, });
        } catch (error) {

            console.error(error)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-sm">
                <Card className="shadow-none border-[0.5px] bg-white/80">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-auto h-12  flex items-center justify-center mb-4">
                            <Logo className="h-8 w-auto" />
                        </div>
                        <CardTitle className="text-3xl text-title font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-description mt-2">
                            Sign in to your account to continue
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-6">
                            {errors.general && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                    {errors.general}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`pl-10 transition-all duration-200 ${errors.email
                                            ? 'border-red-300 focus-visible:ring-red-500'
                                            : 'border-slate-200 focus-visible:ring-blue-500'
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`pl-10 pr-10 transition-all duration-200 ${errors.password
                                            ? 'border-red-300 focus-visible:ring-red-500'
                                            : 'border-slate-200 focus-visible:ring-blue-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                                )}
                            </div>



                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700  text-white font-semibold py-3 transition-all duration-200 transform disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>


                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;