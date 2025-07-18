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
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  } else if (type === 'success') {
    iconColor = 'text-green-800';
    bg = 'bg-green-50';
    text = 'text-green-800';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
      </svg>
    );
  } else if (type === 'warning') {
    iconColor = 'text-yellow-800';
    bg = 'bg-yellow-50';
    text = 'text-yellow-800';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" className={`shrink-0 inline w-4 h-4 me-3 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.764-1.36 2.722-1.36 3.486 0l6.516 11.614c.75 1.338-.213 3.037-1.742 3.037H3.483c-1.53 0-2.492-1.7-1.742-3.037L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
      </svg>
    );
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
      {icon}
      <div>
        <span className="font-medium">{label}</span>{subtext && <span> {subtext}</span>}
      </div>
    </div>
  );
}
