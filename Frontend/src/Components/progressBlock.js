import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";

export default function ProgressBlock({ color = "primary", hide = false }) {
  if (hide) return null;
  return (
    <div className="absolute flex flex-col top-0 left-0 z-10 w-full h-full rounded overflow-hidden">
      <LinearProgress color={color} className="w-full" />
      <Skeleton
        variant="rounded"
        className="w-full flex-1"
        width={"100%"}
        height={"100%"}
      ></Skeleton>
    </div>
  );
}
