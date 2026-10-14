export default function Alert({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-brick/40 bg-brick-light text-brick-dark",
    success: "border-brand/40 bg-brand-light text-brand-dark",
    info: "border-sun/60 bg-sun-light text-sun-dark",
  }[kind];

  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}
