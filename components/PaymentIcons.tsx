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
    </div>
  );
}
