import TextLink from '@/components/text-link';
import Alert from '@/components/ui/alert';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Building, Eye, EyeOff, IdCard, LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        userType: 'Student',
        department: '',
        matric: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [signInProcessing, setSignInProcessing] = useState(false);
    const [success, setSuccess] = useState('');
    const [errorKey, setErrorKey] = useState(0);
    const [warning, setWarning] = useState<{ msg: string; key: number } | null>(null);
    const [warningKey, setWarningKey] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setErrorKey((k) => k + 1);
        }
    }, [errors]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let newKey = warningKey + 1;
        setWarningKey(newKey);

        // Manual validation for required fields
        if (!formData.name) {
            setWarning({ msg: 'Please fill out the full name field.', key: newKey });
            return;
        }
        if (!formData.email) {
            setWarning({ msg: 'Please fill out the email address field.', key: newKey });
            return;
        }
        if (formData.userType === 'Student' && !formData.matric) {
            setWarning({ msg: 'Please fill out the matric ID field.', key: newKey });
            return;
        }
        if (formData.userType === 'Staff' && !formData.department) {
            setWarning({ msg: 'Please select a department.', key: newKey });
            return;
        }
        if (!formData.password) {
            setWarning({ msg: 'Please fill out the password field.', key: newKey });
            return;
        }

        // Validate password requirements
        if (formData.password.length < 8) {
            setWarning({ msg: 'Password must be at least 8 characters long.', key: newKey });
            return;
        }
        if (!/[A-Z]/.test(formData.password)) {
            setWarning({ msg: 'Password must contain at least one uppercase letter.', key: newKey });
            return;
        }
        if (!/[a-z]/.test(formData.password)) {
            setWarning({ msg: 'Password must contain at least one lowercase letter.', key: newKey });
            return;
        }
        if (!/[0-9]/.test(formData.password)) {
            setWarning({ msg: 'Password must contain at least one digit.', key: newKey });
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
            setWarning({ msg: 'Password must contain at least one symbol (!@#$%^&* etc.).', key: newKey });
            return;
        }

        if (!formData.password_confirmation) {
            setWarning({ msg: 'Please fill out the confirm password field.', key: newKey });
            return;
        }

        setWarning(null);
        setProcessing(true);

        try {
            const endpoint = '/register';
            const type = formData.userType === 'Student' ? 'student' : 'staff';

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

            // Use Inertia router instead of axios to preserve session data
            router.post('/register', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setSuccess('Account created successfully! Please check your email to verify your account.');
                    // Navigate to login page after 3 seconds
                    setTimeout(() => {
                        router.visit('/login');
                    }, 3000);
                },
                onError: (errors) => {
                    setErrors(errors);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            });
        } catch (error: any) {
            // This catch block is kept for any unexpected errors
            console.error('Registration error:', error);
            setProcessing(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        // Auto-capitalize matric ID
        const finalValue = field === 'matric' ? value.toUpperCase() : value;

        setFormData((prev) => ({
            ...prev,
            [field]: finalValue,
        }));
    };

    return (
        <>
            {/* Floating toast for warning */}
            {warning && <Alert key={warning.key} type="warning" message={warning.msg} />}

            {/* Floating toast for each error */}
            {Object.values(errors)
                .flat()
                .map((msg, i) => (
                    <Alert key={`${errorKey}-${i}`} type="error" message={msg as string} />
                ))}

            {/* Floating toast for success */}
            {success && <Alert type="success" message={success} duration={3000} />}

            <div className="flex min-h-screen items-center justify-center bg-[#FFE0F2] px-4 py-8 dark:bg-gray-900">
                <Link
                    href="/"
                    className="group absolute top-4 left-4 inline-flex items-center gap-0 overflow-hidden rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 hover:gap-2 hover:pr-5 hover:shadow-xl dark:bg-gray-700"
                >
                    <div className="flex h-10 w-10 items-center justify-center">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    </div>
                    <span className="max-w-0 overflow-hidden text-sm font-medium transition-all duration-300 group-hover:max-w-xs">Back</span>
                </Link>

                <div className="w-full max-w-xl">
                    {/* Registration Card */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-border dark:bg-card">
                        {/* Logo and Title */}
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-500/20">
                                <User className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-card-foreground">Create Account</h2>
                            <p className="text-sm text-gray-600 dark:text-muted-foreground">Join InstaStation today!</p>
                        </div>

                        {/* User Type Toggle */}
                        <div className="mb-6">
                            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-border dark:bg-muted">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('userType', 'Student')}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${formData.userType === 'Student'
                                        ? 'border border-[#5BA35E] bg-[#E6F7E6] text-[#5BA35E] dark:bg-green-500/20 dark:text-green-400'
                                        : 'text-gray-600 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground'
                                        }`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('userType', 'Staff')}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${formData.userType === 'Staff'
                                        ? 'border border-[#5BA35E] bg-[#E6F7E6] text-[#5BA35E] dark:bg-green-500/20 dark:text-green-400'
                                        : 'text-gray-600 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground'
                                        }`}
                                >
                                    Staff
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            {/* Full Name */}
                            <div>
                                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-card-foreground">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        disabled={processing}
                                        placeholder="Your full name"
                                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-card-foreground">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        disabled={processing}
                                        placeholder="xxxx@gmail.com"
                                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                                    />
                                </div>
                            </div>

                            {/* Matric ID for Student */}
                            {formData.userType === 'Student' && (
                                <div>
                                    <label htmlFor="matric" className="mb-2 block text-sm font-medium text-gray-700 dark:text-card-foreground">
                                        Matric ID
                                    </label>
                                    <div className="relative">
                                        <IdCard className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground" />
                                        <input
                                            id="matric"
                                            type="text"
                                            required
                                            value={formData.matric}
                                            onChange={(e) => handleInputChange('matric', e.target.value)}
                                            disabled={processing}
                                            placeholder="CB12345"
                                            className="w-full uppercase rounded-lg border border-gray-200 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Department for Staff */}
                            {formData.userType === 'Staff' && (
                                <div className="relative">
                                    <label htmlFor="department" className="mb-2 block text-sm font-medium text-gray-700 dark:text-card-foreground">
                                        Department
                                    </label>
                                    <div className="relative">
                                        <Building className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                                        <select
                                            id="department"
                                            required
                                            disabled={processing}
                                            value={formData.department || ''}
                                            onChange={(e) => handleInputChange('department', e.target.value)}
                                            className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-900 focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground"
                                        >
                                            <option value="" disabled>
                                                Select Department
                                            </option>

                                            <option value="General">Operations (General)</option>
                                            <option value="Admin">Operations (Admin)</option>
                                        </select>
                                        <svg
                                            className="pointer-events-none absolute top-3.5 right-3 h-4 w-4 text-gray-400 dark:text-muted-foreground"
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

                            {/* Password Fields */}
                            <div className="flex flex-col gap-4 md:flex-row">
                                {/* Password */}
                                <div className="w-full md:w-1/2">
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-card-foreground">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="w-full rounded-lg border border-gray-200 bg-white py-3 pr-10 pl-10 text-gray-900 placeholder-gray-500 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={processing}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed dark:text-muted-foreground dark:hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="w-full md:w-1/2">
                                    <label
                                        htmlFor="password_confirmation"
                                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-card-foreground"
                                    >
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground" />
                                        <input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            value={formData.password_confirmation}
                                            onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                            disabled={processing}
                                            placeholder="••••••••"
                                            className="w-full rounded-lg border border-gray-200 bg-white py-3 pr-10 pl-10 text-gray-900 placeholder-gray-500 focus:border-[#f0bfd7] focus:ring-2 focus:ring-[#fdceef] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={processing}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed dark:text-muted-foreground dark:hover:text-foreground"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
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
                            <p className="text-sm text-gray-600 dark:text-muted-foreground">
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
