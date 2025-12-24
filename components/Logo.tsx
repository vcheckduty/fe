import Image from 'next/image';

export default function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  return (
    <div className={`relative ${className}`} style={{ width: sizes[size], height: sizes[size] }}>
      <Image
        src="/image/logoson.png"
        alt="V-Check Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
