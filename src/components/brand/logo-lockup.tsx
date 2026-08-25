import { LogoMark } from "./logo-mark";

type LogoLockupProps = {
  size?: number;
  className?: string;
};

export function LogoLockup({ size = 28, className }: LogoLockupProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      <span className="font-display font-semibold text-text tracking-tight text-xl">
        Alfia
      </span>
    </div>
  );
}
