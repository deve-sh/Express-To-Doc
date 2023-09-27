const { Router } = require("express");

const authRouter = Router();

authRouter.get("/", (_, res) => {});
authRouter.get("/def", (_, res) => {});

module.exports = authRouter;
