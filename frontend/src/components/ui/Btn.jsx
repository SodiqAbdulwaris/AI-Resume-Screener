import { Button } from "./shadcn/button";

const VARIANTS = { primary: "default", secondary: "outline", ghost: "ghost", danger: "destructive" };
const SIZES = { sm: "sm", md: "lg" };

export default function Btn({ children, variant = "primary", size = "md", type = "button", onClick, disabled, fullWidth, style, className, ...props }) {
  return (
    <Button
      type={type}
      variant={VARIANTS[variant] || "default"}
      size={SIZES[size] || "lg"}
      onClick={onClick}
      disabled={disabled}
      className={[fullWidth && "w-full", className].filter(Boolean).join(" ") || undefined}
      style={style}
      {...props}
    >
      {children}
    </Button>
  );
}
