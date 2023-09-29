import fs from "node:fs";
import path from "node:path";

import { Route, type RouteList } from "../types/Routes";
import { normalizeOptions } from "./normalize-options";

export type PostmanCollection = {
	info: {
		name: string;
		schema: string;
	};
	item: {
		name: string;
		request: {
			method: string;
			header: [];
			body: { mode: string };
			url: { raw: string; path: string[]; host: string[] };
		};
		// Nested folders or requests
		item?: PostmanCollection["item"];
	}[];
	event: {
		listen: string;
		script: {
			type: string;
			exec: [string];
		};
	}[];
	variable: { key: string; value: string; type: "string" }[];
};
export type ConversionOptions = {
	flat: boolean;
	fileName: string;
	collectionName: string;
};

export const defaultOptions: ConversionOptions = {
	flat: true,
	fileName: "./export.postman_collection.json",
	collectionName: "Postman Collection",
};

const getRoutePathFragments = (path: string) =>
	path
		.split("/")
		.map((fragment) => fragment.trim())
		.filter(Boolean);

const nestRoutes = (routes: RouteList) => {
	const nestedCountMap: Record<string, { count: number; children: Route[] }> =
		{};

	for (let route of routes) {
		for (let otherRoute of routes) {
			if (
				otherRoute.path.includes(route.path) &&
				otherRoute.path !== route.path
			) {
				if (!nestedCountMap[route.path])
					nestedCountMap[route.path] = { count: 0, children: [] };

				nestedCountMap[route.path].count++;
				nestedCountMap[route.path].children.push(otherRoute);
			}
		}
	}

	fs.writeFileSync('routePaths.json', JSON.stringify(nestedCountMap, null, 4));
};

const convertToPostmanCollection = (
	routes: RouteList,
	options: Partial<ConversionOptions>
) => {
	options = normalizeOptions(options, defaultOptions);
	options.fileName = path.resolve(process.cwd(), options.fileName as string);

	const collectionBaseTemplate: PostmanCollection = {
		info: {
			name: options.collectionName as string,
			schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
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

	if (options.flat) {
		for (const route of routes) {
			// Clean route path
			const routePathFragments = getRoutePathFragments(route.path);
			const routeName = routePathFragments.join("/") || "/";

			collectionBaseTemplate.item.push({
				name: routeName,
				request: {
					method: route.method,
					header: [],
					body: { mode: "" },
					url: {
						raw: `{{BASE_URL}}${route.path}`,
						host: [`{{BASE_URL}}`],
						path: routePathFragments,
					},
				},
			});
		}
	} else {
		// TODO:

		// Group close routes together
		// And nest successive paths inside folders

		// Sort route by the lengths of their paths
		const flatRoutes = [...routes];
		nestRoutes(flatRoutes)
	}

	// fs.writeFileSync(
	// 	options.fileName,
	// 	JSON.stringify(collectionBaseTemplate, null, 4)
	// );
};

export default convertToPostmanCollection;
