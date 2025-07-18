import type { SortDirection } from "@mui/material/TableCell";
import React from "react";

function comparator<T>(a: T, b: T) {
  if (b < a) {
    return -1;
  }
  if (b > a) {
    return 1;
  }
  return 0;
}

function invert(invert: boolean, v: number) {
  return invert ? v : -v;
}

export function comparingBy<T, U>(
  order: SortDirection,
  extractor: (value: T) => U,
): (a: T, b: T) => number {
  const reverse = order === "desc";
  return (a, b) => invert(reverse, comparator(extractor(a), extractor(b)));
}

export function useSortingStates<O>(
  initialOrder: SortDirection,
  initialOrderBy: O,
): [SortDirection, O, (by: O) => void] {
  const [order, setOrder] = React.useState<SortDirection>(initialOrder);
  const [orderBy, setOrderBy] = React.useState<O>(initialOrderBy);
  const onRequestSort = (by: O) => {
    const isAsc = orderBy === by && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(by);
  };
  return [order, orderBy, onRequestSort];
}
