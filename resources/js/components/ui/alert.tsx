import { useEffect, useState } from 'react';

export default function Alert({
  type = 'info',
  message,
  duration = 2000, // 2 seconds
}: {
  type?: 'success' | 'error' | 'warning' | 'info' | 'neutral',
  message: string,
  duration?: number,
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!show || !message) return null;

  // Split message for label and subtext (e.g., 'Info|Please wait a moment.')
  const [label, ...rest] = message.split('|');
  const subtext = rest.join(' ');

  let classes = 'flex items-center p-4 text-sm rounded-lg';
  let iconColor = 'text-blue-800';
  let bg = 'bg-blue-50';
  let text = 'text-blue-800';
  let icon = (
    <svg className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
    </svg>
  );
  if (type === 'error') {
    iconColor = 'text-red-800 dark:text-red-400';
    bg = 'bg-red-50 dark:bg-red-500/10';
    text = 'text-red-800 dark:text-red-400';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  } else if (type === 'success') {
    iconColor = 'text-emerald-600 dark:text-emerald-400';
    bg = 'bg-emerald-50/90 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    text = 'text-emerald-800 dark:text-emerald-300';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 inline w-5 h-5 me-3 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
      </svg>
    );
  } else if (type === 'warning') {
    iconColor = 'text-yellow-800 dark:text-yellow-400';
    bg = 'bg-yellow-50 dark:bg-yellow-500/10';
    text = 'text-yellow-800 dark:text-yellow-400';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.764-1.36 2.722-1.36 3.486 0l6.516 11.614c.75 1.338-.213 3.037-1.742 3.037H3.483c-1.53 0-2.492-1.7-1.742-3.037L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
      </svg>
    );
  } else if (type === 'info') {
    iconColor = 'text-blue-800 dark:text-blue-400';
    bg = 'bg-blue-50 dark:bg-blue-500/10';
    text = 'text-blue-800 dark:text-blue-400';
  } else if (type === 'neutral') {
    iconColor = 'text-gray-800 dark:text-gray-400';
    bg = 'bg-gray-50 dark:bg-gray-500/10';
    text = 'text-gray-800 dark:text-gray-400';
  }

  return (
    <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[250] ${classes} ${bg} ${text} shadow-sm rounded-2xl px-5 py-2.5 animate-in fade-in slide-in-from-top-2 duration-300`} role="alert">
      <div className="flex items-center gap-2.5 justify-center w-full">
        {icon}
        <div className="text-[14px] font-medium tracking-tight">
          <span className="font-medium">{label}</span>{subtext && <span> {subtext}</span>}
        </div>
      </div>
    </div>
  );
}
