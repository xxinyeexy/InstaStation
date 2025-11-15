import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Upload, X } from 'lucide-react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
    phone_no: string;
    room_no: string;
    profile_pic: File | null;
};

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        auth.user.profile_pic ? `/storage/${auth.user.profile_pic}` : null
    );

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm<ProfileForm>({
        name: auth.user.name,
        email: auth.user.email,
        phone_no: auth.user.phone_no || '',
        room_no: auth.user.room_no || '',
        profile_pic: null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('profile_pic', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeProfilePic = () => {
        setData('profile_pic', null);
        setPreviewUrl(auth.user.profile_pic ? `/storage/${auth.user.profile_pic}` : null);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <form onSubmit={submit} className="space-y-6">
                        {/* Profile Picture Upload */}
                        <div className="grid gap-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative">
                                        <img
                                            src={previewUrl}
                                            alt="Profile"
                                            className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                                        />
                                        {data.profile_pic && (
                                            <button
                                                type="button"
                                                onClick={removeProfilePic}
                                                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <Input
                                        id="profile_pic"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Label
                                        htmlFor="profile_pic"
                                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Choose Photo
                                    </Label>
                                    <p className="mt-2 text-xs text-gray-500">JPG, PNG or GIF (MAX. 2MB)</p>
                                </div>
                            </div>
                            <InputError className="mt-2" message={errors.profile_pic} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone_no">Phone Number</Label>

                            <Input
                                id="phone_no"
                                type="tel"
                                className="mt-1 block w-full"
                                value={data.phone_no}
                                onChange={(e) => setData('phone_no', e.target.value)}
                                autoComplete="tel"
                                placeholder="e.g., 0123456789"
                            />

                            <InputError className="mt-2" message={errors.phone_no} />
                        </div>

                        {auth.user.type === 'student' && (
                            <div className="grid gap-2">
                                <Label htmlFor="room_no">Room Number</Label>

                                <Input
                                    id="room_no"
                                    className="mt-1 block w-full"
                                    value={data.room_no}
                                    onChange={(e) => setData('room_no', e.target.value)}
                                    placeholder="e.g., A-101"
                                />

                                <InputError className="mt-2" message={errors.room_no} />
                            </div>
                        )}

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
