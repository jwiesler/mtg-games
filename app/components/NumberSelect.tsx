import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import React from "react";

export function NumberSelect({
  label,
  values,
  selected,
  setSelected,
}: {
  label: string;
  values: number[];
  selected: number[];
  setSelected: (selected: number[]) => void;
}) {
  const handleChange = (event: SelectChangeEvent<number[]>) => {
    const {
      target: { value },
    } = event;
    const values: number[] =
      typeof value === "string" ? value.split(",").map(v => Number(v)) : value;
    setSelected(values);
  };

  return (
    <div>
      <FormControl sx={{ width: "100%" }}>
        <InputLabel>{label}</InputLabel>
        <Select
          multiple
          value={selected}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
        >
          {values.map(i => {
            return (
              <MenuItem key={i} value={i}>
                {i}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}
