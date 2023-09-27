const app = require("./app");

// or
const expressListRoutes = require("express-list-routes");
const routes = expressListRoutes(app);

const flat = true;

const collection = {
  info: {
    name: "Postman Collection",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [],
  event: [
    {
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [""],
      },
    },
    {
      listen: "test",
      script: {
        type: "text/javascript",
        exec: [""],
      },
    },
  ],
  variable: [
    {
      key: "BASE_URL",
      value: "<Your backend's base url specific to your environment>",
      type: "string",
    },
  ],
};

if (flat) {
  for (const route of routes) {
    const routePathFragments = route.path
      .split("/")
      .map((str) => str.trim())
      .filter(Boolean);
    const routeName = routePathFragments.join("/") || "/";
    collection.item.push({
      name: routeName,
      request: {
        method: route.method,
        header: [],
        body: {
          mode: "",
        },
        url: {
          raw: `{{BASE_URL}}${route.path}`,
          host: [`{{BASE_URL}}`],
          path: routePathFragments,
        },
      },
    });
  }
} else {
  // Group close routes together
  // And nest successive paths inside folders
  const flatRoutes = [...routes];
}

const fs = require("fs");

fs.writeFileSync(
  "./express_api.postman_collection.json",
  JSON.stringify(collection, null, 4)
);
