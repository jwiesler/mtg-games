import Skeleton from "@mui/material/Skeleton";

import { ClientOnly } from "./ClientOnly";
import { FORMAT } from "~/format";

export default function DateElement({ date }: { date: Date }) {
  return (
    <ClientOnly fallback={<Skeleton variant="text" sx={{ width: "8.14em" }} />}>
      {() => FORMAT.format(date)}
    </ClientOnly>
  );
}
