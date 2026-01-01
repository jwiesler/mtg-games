import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import React from "react";

import CollapseRow from "./CollapseRow";
import DateElement from "./DateElement";
import GameResult from "./GameResult";
import Placing from "./Placing";
import { SortTableHead } from "./SortTableHead";
import { comparingBy, useSortingStates } from "~/sort";

interface Game {
  plays: {
    player: {
      id: number;
      name: string;
    };
    place: number;
    deck: {
      id: number;
      name: string;
    };
  }[];
  when: Date;
  id: number;
  duration: number;
  comment: string;
}

export default function RecentPlays<G extends Game>({
  games,
  columnKey,
  placingKey,
  placingId,
}: {
  games: G[];
  columnKey: "player" | "deck";
  placingKey: "player" | "deck";
  placingId: number;
}) {
  const [order, orderBy, onRequestSort] = useSortingStates("desc", "when");
  const sortedGames = React.useMemo(() => {
    let extract;
    const copy = games.map(g => {
      const index = g.plays.findIndex(p => p[placingKey].id === placingId);
      return { ...g, indexOfValue: index === -1 ? 0 : index };
    });
    if (orderBy == "when") {
      extract = (v: (typeof copy)[0]) => v.when;
    } else if (orderBy == "group") {
      extract = (v: (typeof copy)[0]) =>
        v.plays[v.indexOfValue][columnKey].name;
    } else {
      extract = (v: (typeof copy)[0]) => v.indexOfValue;
    }
    return copy.sort(
      comparingBy<(typeof copy)[0], number | Date | string>(order, extract),
    );
  }, [order, orderBy, games]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const sortedGamesSlice = sortedGames.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  return (
    <>
      <TableContainer component={Paper}>
        <Table stickyHeader={true}>
          <TableHead>
            <TableRow>
              <TableCell width={"5em"} />
              <SortTableHead
                width={"4em"}
                order={order}
                orderBy={orderBy}
                sortKey="place"
                onRequestSort={onRequestSort}
              >
                Platz
              </SortTableHead>
              <SortTableHead
                order={order}
                orderBy={orderBy}
                sortKey="when"
                onRequestSort={onRequestSort}
              >
                Datum
              </SortTableHead>
              <SortTableHead
                order={order}
                orderBy={orderBy}
                sortKey="group"
                onRequestSort={onRequestSort}
              >
                {columnKey === "player" ? "Spieler" : "Deck"}
              </SortTableHead>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedGamesSlice.map(game => {
              return (
                <CollapseRow
                  key={game.id}
                  cells={[
                    <TableCell key="0">
                      <Placing place={game.indexOfValue + 1} />
                    </TableCell>,
                    <TableCell key="1">
                      <DateElement date={game.when} />
                    </TableCell>,
                    <TableCell key="2">
                      {game.plays[game.indexOfValue][columnKey].name}
                    </TableCell>,
                  ]}
                  inner={<GameResult game={game} />}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={games.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={p => {
          setRowsPerPage(parseInt(p.target.value, 10));
          setPage(0);
        }}
      />
    </>
  );
}
