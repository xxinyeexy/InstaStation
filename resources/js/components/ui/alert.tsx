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
    iconColor = 'text-red-800';
    bg = 'bg-red-50';
    text = 'text-red-800';
  } else if (type === 'success') {
    iconColor = 'text-green-800';
    bg = 'bg-green-50';
    text = 'text-green-800';
  } else if (type === 'warning') {
    iconColor = 'text-yellow-800';
    bg = 'bg-yellow-50';
    text = 'text-yellow-800';
  } else if (type === 'info') {
    iconColor = 'text-blue-800';
    bg = 'bg-blue-50';
    text = 'text-blue-800';
  } else if (type === 'neutral') {
    iconColor = 'text-gray-800';
    bg = 'bg-gray-50';
    text = 'text-gray-800';
  }

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 ${classes} ${bg} ${text} min-w-[320px] max-w-xl`} role="alert">
      <svg className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
      </svg>
      <div>
        <span className="font-medium">{label}</span>{subtext && <span> {subtext}</span>}
      </div>
    </div>
  );
}
