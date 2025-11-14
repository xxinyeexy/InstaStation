import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();
    const isStaff = (user as any)?.type === 'staff';
    const roleLabel = isStaff ? 'Staff' : 'Student';
    const roleClasses = isStaff ? 'border-pink-200 bg-pink-50 text-pink-500' : 'border-emerald-200 bg-emerald-50 text-emerald-700';

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="flex items-center gap-2 truncate font-medium">
                    <span className="truncate">{user.name}</span>
                    <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleClasses}`}
                        title={`${roleLabel} account`}
                        aria-label={`Role: ${roleLabel}`}
                    >
                        {isStaff ? <ShieldCheck className="h-3 w-3" aria-hidden="true" /> : <GraduationCap className="h-3 w-3" aria-hidden="true" />}
                        <span>{roleLabel}</span>
                    </span>
                </span>
                {showEmail && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
            </div>
        </>
    );
}
