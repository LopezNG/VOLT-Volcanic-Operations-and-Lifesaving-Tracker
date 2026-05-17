const express = require("express");

const {
  findLatestTaalBulletinId,
  getLatestTaalBulletin,
  getTaalBulletinById
} = require("../services/taalBulletins.service");
const { explainBulletin } = require("../utils/explainBulletin");

const router = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseBulletinId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Bulletin id must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  return id;
}

router.get(
  "/latest",
  asyncHandler(async (_req, res) => {
    const bulletin = await getLatestTaalBulletin();
    res.json(bulletin);
  })
);

router.get(
  "/latest/explain",
  asyncHandler(async (_req, res) => {
    const bulletin = await getLatestTaalBulletin();
    res.json(explainBulletin(bulletin));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseBulletinId(req.params.id);
    const bulletin = await getTaalBulletinById(id);
    res.json(bulletin);
  })
);

router.get(
  "/:id/explain",
  asyncHandler(async (req, res) => {
    const id = parseBulletinId(req.params.id);
    const bulletin = await getTaalBulletinById(id);
    res.json(explainBulletin(bulletin));
  })
);

module.exports = router;

