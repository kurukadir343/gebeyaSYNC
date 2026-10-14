/** Green / yellow / red band used as the app's signature mark. */
export default function Stripe({ className = "h-1.5" }: { className?: string }) {
  return (
    <div className={`flex w-full ${className}`} aria-hidden="true">
      <span className="flex-1 bg-brand" />
      <span className="flex-1 bg-sun" />
      <span className="flex-1 bg-brick" />
    </div>
  );
}
