import TableCell, {
  type SortDirection,
  type TableCellProps,
} from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

export function SortTableHead<O>({
  order,
  orderBy,
  sortKey,
  onRequestSort,
  children,
  ...props
}: TableCellProps & {
  order: SortDirection;
  orderBy: O;
  sortKey: O;
  onRequestSort: (key: O) => void;
}) {
  return (
    <TableCell {...props} sortDirection={orderBy === sortKey ? order : false}>
      <TableSortLabel
        active={orderBy === sortKey}
        direction={
          orderBy === sortKey ? (order === false ? undefined : order) : "asc"
        }
        onClick={() => onRequestSort(sortKey)}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  );
}
