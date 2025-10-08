// resources/js/Pages/Auth/Login.tsx
import { Head, useForm, Link } from '@inertiajs/react';
import { LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import Alert from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';


interface LoginProps {
    status?: string | null;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
        remember: boolean;
        role: string;
    }>({
        email: '',
        password: '',
        remember: false,
        role: '',
    });

    const [warning, setWarning] = useState<{ msg: string; key: number } | null>(null);
    const [warningKey, setWarningKey] = useState(0);
    const [errorKey, setErrorKey] = useState(0);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setErrorKey((k) => k + 1);
        }
    }, [errors]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        let newKey = warningKey + 1;
        setWarningKey(newKey);
        setSuccess('');
        if (!data.email) {
            setWarning({ msg: 'Please fill out the email field.', key: newKey });
            return;
        }
        if (!data.password) {
            setWarning({ msg: 'Please fill out the password field.', key: newKey });
            return;
        }
        if (!data.role) {
            setWarning({ msg: 'Please select a role.', key: newKey });
            return;
        }
        setWarning(null);
        post(route('login'), {
            onFinish: () => reset('password'),
            onSuccess: () => {
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            },
        });
    };

    return (
        <>
            <Head title="Login" />

            {/* Floating toast for warning */}
            {warning && <Alert key={warning.key} type="warning" message={warning.msg} />}
            {/* Floating toast for each error */}
            {Object.values(errors)
                .flat()
                .map((msg, i) => (
                    <Alert key={`${errorKey}-${i}`} type="error" message={msg as string} />
                ))}
            {/* Floating toast for success */}
            {success && <Alert type="success" message={success} />}
            {status && !success && <Alert type="success" message={status} />}


            <div className="flex min-h-screen items-center justify-center bg-[#FFE0F2] px-4">
          <Link href="/" className="absolute top-4 left-4 group inline-flex items-center gap-0 overflow-hidden rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 hover:gap-2 hover:pr-5 hover:shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="max-w-0 overflow-hidden text-sm font-medium transition-all duration-300 group-hover:max-w-xs">
              Back
            </span>
          </Link>
  
               <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-md">
                    <div className="mb-6 text-center">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-blue-100 p-3">
                                <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                                    <path d="M3 17l9 4 9-4" />
                                    <path d="M3 12l9 4 9-4" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Welcome to InstaStation</h2>
                        <p className="text-sm text-gray-500">Instant Parcel Tracking Dashboard</p>
                    </div>

                    <form onSubmit={submit} className="space-y-4" noValidate>
                        {/* Email */}
                        <div className="relative">
                            <Label htmlFor="email" className="sr-only">
                                Email
                            </Label>
                            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="xxxx@gmail.com"
                                required
                                autoComplete="email"
                                className="pl-10"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Label htmlFor="password" className="sr-only">
                                Password
                            </Label>
                            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                required
                                autoComplete="current-password"
                                className="pl-10"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Role */}
                        <div className="relative">
                            <Label htmlFor="role" className="sr-only">
                                Role
                            </Label>
                            <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <select
                                id="role"
                                required
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                                className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pr-8 pl-10 text-sm focus:border-pink-200 focus:ring-2 focus:ring-pink-200 focus:outline-none"
                            >
                                <option value="" disabled>
                                    Select Role
                                </option>
                                <option value="student">Student</option>
                                <option value="staff">Staff</option>
                            </select>
                            <svg
                                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path d="M19 9l-7 7-7-7" />
                            </svg>
                            <InputError message={errors.role} />
                        </div>

                        {/* Remember me and Forgot password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked: boolean | 'indeterminate') => setData('remember', checked === true)}
                                />
                                <span>Remember me</span>
                            </label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-green-600 hover:underline">
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>

                        {/* Sign In */}
                        <Button type="submit" className="w-full bg-pink-500 text-white hover:bg-pink-600" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In →
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-4 text-center text-sm">
                        Don’t have an account?{' '}
                        <TextLink href={route('register')} className="text-green-600 hover:underline">
                            Register now
                        </TextLink>
                    </div>

                    {/* Status Message */}
                    {status && <div className="mt-2 text-center text-sm font-medium text-green-600">{status}</div>}
                </div>
            </div>
        </>
    );
}
