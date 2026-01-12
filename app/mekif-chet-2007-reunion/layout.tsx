import { ReactNode } from 'react';

export default function ReunionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <style jsx global>{`
        /* הסתר ChatWidget בדף הזה */
        [data-chat-widget] {
          display: none !important;
        }
      `}</style>
    </>
  );
}
