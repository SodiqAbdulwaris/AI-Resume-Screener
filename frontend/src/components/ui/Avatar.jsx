import { Avatar as AvatarRoot, AvatarFallback } from "./shadcn/avatar";
import { initials } from "../../lib/utils";

export default function Avatar({ name, size = 36, gradient }) {
  const bg = gradient || "linear-gradient(135deg, #0d9488, #0891b2)";
  return (
    <AvatarRoot style={{ width: size, height: size }} className="shrink-0">
      <AvatarFallback style={{ background: bg, fontSize: size * 0.36, letterSpacing: "0.03em" }} className="font-semibold text-white">
        {initials(name)}
      </AvatarFallback>
    </AvatarRoot>
  );
}
