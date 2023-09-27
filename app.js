const app = require("express")();

const authRouter = require("./router");

app.get("/", (req, res) => res.sendStatus(200));
app.post("/abc/:bcd", (req, res) => res.sendStatus(200));

app.use("/auth", authRouter);

module.exports = app;
