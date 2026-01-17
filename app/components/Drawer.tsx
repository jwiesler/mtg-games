import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";

export function Header({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 2,
        fontSize: "1.25em",
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: "0",
        zIndex: 5,
        backgroundColor:
          theme.vars != undefined
            ? theme.vars.palette.background.paper
            : theme.palette.background.paper,
      }}
    >
      <IconButton aria-label="close" onClick={onClose}>
        <CloseIcon />
      </IconButton>
      <Typography variant="h6" component="h1" flexGrow={1}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ overflowY: "auto", p: 2, scrollbarWidth: "thin" }}>
      {children}
    </Box>
  );
}

export function Root({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <MuiDrawer
      open={open}
      anchor="right"
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <Box
        sx={{
          width: "100vw",
          maxWidth: "600px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        role="presentation"
      >
        {children}
      </Box>
    </MuiDrawer>
  );
}

export default {
  Root,
  Header,
  Body,
};
