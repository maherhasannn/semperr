export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, overflow: "auto" }}>
      {children}
    </div>
  );
}
