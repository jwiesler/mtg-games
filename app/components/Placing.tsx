import Chip from "@mui/material/Chip";

function getColor(place: number): string {
  switch (place) {
    case 1:
      return "#FFAA00";
    case 2:
      return "#c0c0c0";
    case 3:
      return "#cd7f32";
    default:
      return "";
  }
}

export default function Placing({ place }: { place: number }) {
  return <Chip label={place} sx={{ backgroundColor: getColor(place) }} />;
}
