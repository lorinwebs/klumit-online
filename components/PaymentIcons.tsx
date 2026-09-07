/** Monochrome payment method badges for the footer SHOP column. */
export default function PaymentIcons({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
      aria-label="Payment methods"
    >
      {/* Visa */}
      <svg viewBox="0 0 48 32" className="h-6 w-9" role="img" aria-label="Visa">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <text
          x="24"
          y="21"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>

      {/* Mastercard */}
      <svg viewBox="0 0 48 32" className="h-6 w-9" role="img" aria-label="Mastercard">
        <rect width="48" height="32" rx="4" fill="#000" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path
          d="M24 10.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6z"
          fill="#FF5F00"
        />
      </svg>

      {/* American Express */}
      <svg viewBox="0 0 48 32" className="h-6 w-9" role="img" aria-label="American Express">
        <rect width="48" height="32" rx="4" fill="#2E77BC" />
        <text
          x="24"
          y="14"
          textAnchor="middle"
          fill="white"
          fontSize="6"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
        >
          AMERICAN
        </text>
        <text
          x="24"
          y="22"
          textAnchor="middle"
          fill="white"
          fontSize="6"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
        >
          EXPRESS
        </text>
      </svg>

      {/* bit */}
      <svg viewBox="0 0 48 32" className="h-6 w-9" role="img" aria-label="bit">
        <rect width="48" height="32" rx="4" fill="#000" />
        <text
          x="24"
          y="21"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
          fontStyle="italic"
        >
          bit
        </text>
      </svg>

      {/* Apple Pay */}
      <svg viewBox="0 0 48 32" className="h-6 w-9" role="img" aria-label="Apple Pay">
        <rect width="48" height="32" rx="4" fill="#000" />
        <text
          x="24"
          y="20"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="500"
          fontFamily="Arial, sans-serif"
        >
          Pay
        </text>
        {/* Apple logo mark */}
        <path
          d="M14.2 12.8c.5-.6.8-1.4.7-2.2-.7 0-1.5.4-2 1-.5.5-.9 1.4-.8 2.2.8.1 1.6-.3 2.1-1zm.7 1.1c-1.1 0-2 .6-2.5.6s-1.3-.6-2.2-.6c-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 0.8 6.6.5.8 1.2 1.7 2 1.6.8 0 1.1-.5 2.1-.5s1.2.5 2.1.5c.9 0 1.4-.8 2-1.6.6-.9.9-1.7.9-1.8-.02 0-1.7-.7-1.7-2.6 0-1.6 1.3-2.4 1.4-2.5-.8-1.1-2-1.3-2.2-1.4z"
          fill="white"
          transform="translate(2, -1) scale(0.85)"
        />
      </svg>

      {/* Google Pay */}
      <svg viewBox="0 0 48 32" className="h-6 w-9" role="img" aria-label="Google Pay">
        <rect width="48" height="32" rx="4" fill="#fff" stroke="#D9D9D9" />
        {/* Google "G" mark */}
        <path d="M17.6 16.2c0-.5-.05-.9-.13-1.3h-5.3v2.4h3.1c-.13.7-.55 1.3-1.17 1.7v1.5h1.9c1.1-1 1.6-2.5 1.6-4.3z" fill="#4285F4" />
        <path d="M12.2 22c1.6 0 2.9-.5 3.9-1.4l-1.9-1.5c-.5.4-1.2.6-2 .6-1.5 0-2.8-1-3.3-2.4H7v1.6c1 2 3 3.1 5.2 3.1z" fill="#34A853" />
        <path d="M8.9 17.3c-.1-.4-.2-.8-.2-1.3s.1-.9.2-1.3v-1.6H7c-.4.8-.6 1.8-.6 2.9s.2 2.1.6 2.9l1.9-1.6z" fill="#FBBC04" />
        <path d="M12.2 12.3c.9 0 1.6.3 2.2.9l1.7-1.7c-1-.9-2.3-1.5-3.9-1.5-2.2 0-4.2 1.3-5.2 3.1l1.9 1.6c.5-1.4 1.8-2.4 3.3-2.4z" fill="#EA4335" />
        <text
          x="30"
          y="20"
          textAnchor="middle"
          fill="#3C4043"
          fontSize="8"
          fontWeight="500"
          fontFamily="Arial, sans-serif"
        >
          Pay
        </text>
      </svg>
    </div>
  );
}
