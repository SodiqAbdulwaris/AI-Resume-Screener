import { Skeleton } from "./shadcn/skeleton";

export default function SkeletonBlock({ height = 20, width = "100%", radius = 6 }) {
  return <Skeleton style={{ height, width, borderRadius: radius }} />;
}
