import { COLORS } from "../../constants/colors";

export default function SkeletonBlock({ height = 20, width = "100%", radius = 6 }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${COLORS.bg3} 25%, ${COLORS.card} 50%, ${COLORS.bg3} 75%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}
