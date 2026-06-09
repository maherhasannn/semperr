export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="light"
      data-neutral="gray"
      data-brand="cyan"
      data-accent="cyan"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#ffffff",
        color: "#111",
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}
