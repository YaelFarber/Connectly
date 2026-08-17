const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(204).end();
});

module.exports = router;
