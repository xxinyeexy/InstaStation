import TextLink from '@/components/text-link';
import Alert from '@/components/ui/alert';
import axios from 'axios'; // Add axios for API requests
import { Building, IdCard, LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        userType: 'Student',
        department: '',
        matric: '', // Add matric to state
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [signInProcessing, setSignInProcessing] = useState(false);
    const [success, setSuccess] = useState('');
    const [errorKey, setErrorKey] = useState(0);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setErrorKey((k) => k + 1);
        }
    }, [errors]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // Always use the same endpoint
            const endpoint = '/register';
            // Map userType to type expected by backend
            const type = formData.userType === 'Student' ? 'student' : 'staff';
            // Build payload with type
            const payload: any = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
                type,
            };
            if (type === 'student') {
                payload.matric = formData.matric;
            } else {
                payload.department = formData.department;
            }
            await axios.post(endpoint, payload);
            // Redirect to sign in page after successful registration
            window.location.href = '/login';
        } catch (error: any) {
            setErrors(error.response?.data?.errors || {});
        } finally {
            setProcessing(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <>
            {/* Floating toast for each error */}
            {Object.values(errors)
                .flat()
                .map((msg, i) => (
                    <Alert key={`${errorKey}-${i}`} type="error" message={msg as string} />
                ))}
            {/* Floating toast for success */}
            {success && <Alert type="success" message={success} />}
            <div className="flex min-h-screen items-center justify-center bg-[#FFE0F2] px-4 py-8">
                <div className="w-full max-w-xl">
                    {/* Registration Card */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                        {/* Logo and Title */}
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="mb-2 text-xl font-semibold text-gray-900">Create an Account</h2>
                            <p className="text-sm text-gray-600">Join InstaStation to manage your university parcels</p>
                        </div>

                        {/* User Type Toggle */}
                        <div className="mb-6">
                            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('userType', 'Student')}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        formData.userType === 'Student'
                                            ? 'border border-[#5BA35E] bg-[#E6F7E6] text-[#5BA35E]'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('userType', 'Staff')}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        formData.userType === 'Staff'
                                            ? 'border border-[#5BA35E] bg-[#E6F7E6] text-[#5BA35E]'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    Staff
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        disabled={processing}
                                        placeholder="Your full name"
                                        className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        disabled={processing}
                                        placeholder="email@example.com"
                                        className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Matric ID for Student */}
                            {formData.userType === 'Student' && (
                                <div>
                                    <label htmlFor="matric" className="mb-2 block text-sm font-medium text-gray-700">
                                        Matric ID
                                    </label>
                                    <div className="relative">
                                        <IdCard className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <input
                                            id="matric"
                                            type="text"
                                            required
                                            value={formData.matric}
                                            onChange={(e) => handleInputChange('matric', e.target.value)}
                                            disabled={processing}
                                            placeholder="CB12345"
                                            className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Department for Staff */}
                            {formData.userType === 'Staff' && (
                                <div className="relative">
                                    <label htmlFor="department" className="mb-2 block text-sm font-medium text-gray-700">
                                        Department
                                    </label>
                                    <div className="relative">
                                        {/* Left Icon */}
                                        <Building className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-gray-400" />

                                        {/* Select Field */}
                                        <select
                                            id="department"
                                            required
                                            disabled={processing}
                                            value={formData.department || ''}
                                            onChange={(e) => handleInputChange('department', e.target.value)}
                                            className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-sm focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                Select Department
                                            </option>

                                            <option value="General">Operations - General</option>
                                            <option value="Admin">Operations - Admin</option>
                                        </select>

                                        {/* Right Dropdown Arrow */}
                                        <svg
                                            className="pointer-events-none absolute top-3.5 right-3 h-4 w-4 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Password */}
                            <div className="flex flex-col gap-4 md:flex-row">
                                {/* Password */}
                                <div className="w-full md:w-1/2">
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="w-full md:w-1/2">
                                    <label htmlFor="password_confirmation" className="mb-2 block text-sm font-medium text-gray-700">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            value={formData.password_confirmation}
                                            onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="w-full rounded-lg border border-gray-200 py-3 pr-4 pl-10 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Create Account →
                            </button>
                        </form>

                        {/* Sign In */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <TextLink href={route('login')} className="text-green-600 hover:underline">
                                    Sign in
                                </TextLink>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
