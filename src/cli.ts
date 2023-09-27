import type { Route } from "./types/Routes";
import expressListRoutes from "express-list-routes";
import minimist from "minimist";

const flags = minimist(process.argv.slice(2));

// Utils
import normalizeRoutePath from "./lib/normalize-route-path";

// TODO:
// 1. Add dynamic imports provided by the user.
// 2. Option to specify the name of the export.
// 3. Option to specify build step before.
// 4. Optional: Add an export statement yourself if there isn't one in the specified file.
// const app = require("../app");

// converters
import convertToPostmanCollection from "./lib/to-postman";

// @ts-ignore
const routes = expressListRoutes(app).map((route: Route) => ({
	...route,
	path: normalizeRoutePath(route.path),
}));

if (!routes.length) {
	console.error("There are no routes in your Express application.");
	process.exit(0);
}

if (flags.postman) {
	convertToPostmanCollection(routes, { flat: flags.flat });
	process.exit();
}
