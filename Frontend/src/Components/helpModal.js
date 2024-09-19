import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Button from "@mui/material/Button";
import { useState } from "react";

export default function HelpModal({ title = "", descriptions = [] }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="absolute top-0 right-0">
      <IconButton aria-label="help" size="large" onClick={handleClickOpen}>
        <HelpOutlineIcon color="primary" />
      </IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
        keepMounted
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {descriptions.map((description, index) => {
              return (
                <span
                  className="block mt-2"
                  key={index}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              );
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
