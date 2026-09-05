import { Button } from "./shadcn/button";

const VARIANTS = { primary: "default", secondary: "outline", ghost: "ghost", danger: "destructive" };
const SIZES = { sm: "sm", md: "lg" };

export default function Btn({ children, variant = "primary", size = "md", type = "button", onClick, disabled, fullWidth, style, ...props }) {
  return (
    <Button
      type={type}
      variant={VARIANTS[variant] || "default"}
      size={SIZES[size] || "lg"}
      onClick={onClick}
      disabled={disabled}
      className={fullWidth ? "w-full" : undefined}
      style={style}
      {...props}
    >
      {children}
    </Button>
  );
}
