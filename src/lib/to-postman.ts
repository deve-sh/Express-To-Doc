import fs from "node:fs";
import path from "node:path";

import { type RouteList } from "../types/Routes";

import { normalizeOptions } from "./normalize-options";
import turnFlatRoutesToTree from "./flat-to-tree";
import Flattener from "./flat-to-tree";

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
		// Group close routes together
		// And nest successive paths inside folders

		// Pre-process list of flat routes, find any routes that are parent of other routes and add `/` at the end.
		// This is due to the way our tree-building algo works and just nests path under path
		const processedFlatRoutes = [...routes];
		for (let i = 0; i < processedFlatRoutes.length; i++) {
			for (let j = 0; j < processedFlatRoutes.length; j++) {
				if(j === i) continue;
				
				const baseRoutePath = processedFlatRoutes[i].path;
				const childRoutePath = processedFlatRoutes[j].path;
				const hasSlashAtTheEnd = baseRoutePath.endsWith("/");
				const isAFolderButAlsoRoute =
					childRoutePath.includes(baseRoutePath);

				if (!hasSlashAtTheEnd && isAFolderButAlsoRoute) {
					processedFlatRoutes[i].path = baseRoutePath.concat("/");
					break;
				}
			}
		}
		const flattener = new Flattener({
			hierarchyFieldName: "item",
			processRouteMatch(route, relativePath) {
				return {
					name: relativePath,
					request: {
						method: route.method,
						header: [],
						body: { mode: "" },
						url: {
							raw: `{{BASE_URL}}${route.path}`,
							host: [`{{BASE_URL}}`],
							path: getRoutePathFragments(route.path),
						},
					},
				};
			},
		});
		const treeRoutes = flattener.turnFlatRoutesToTree(routes);
		collectionBaseTemplate.item = treeRoutes;
	}

	fs.writeFileSync(
		options.fileName,
		JSON.stringify(collectionBaseTemplate, null, 4)
	);
};

export default convertToPostmanCollection;
