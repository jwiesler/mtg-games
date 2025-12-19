import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";

export default function Drawer({
  children,
  open,
  onClose,
  title,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title: string;
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
        <Box
          sx={{
            p: 2,
            fontSize: "1.25em",
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" component="h1">
            {title}
          </Typography>
        </Box>
        <Box sx={{ overflowY: "auto", p: 2, scrollbarWidth: "thin" }}>
          {children}
        </Box>
      </Box>
    </MuiDrawer>
  );
}
