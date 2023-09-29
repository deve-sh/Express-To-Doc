// Ref: https://stackoverflow.com/a/45075542

import type { Route } from "../types/Routes";

type HierarchyNode = {
	path: "root" | string;
	children: HierarchyNode[];
	fullPath?: string;
	relativePath?: string;
} & Partial<Route>;

function convertToHierarchy(paths: string[]) {
	const rootNode = { path: "root", children: [] } as HierarchyNode;
	for (let path of paths) buildNodeRecursive(rootNode, path.split("/"), 0);
	return rootNode["children"];
}

function buildNodeRecursive(
	node: HierarchyNode,
	pathFragments: string[],
	idx: number
) {
	if (idx < pathFragments.length) {
		let item = pathFragments[idx];
		let dir = node.children.find((child) => child.path == item);
		if (!dir)
			node.children.push((dir = { path: item || "/", children: [] }));
		buildNodeRecursive(dir, pathFragments, idx + 1);
	}
}

function recursivelyFillRouteInfoIntoNodes(
	hierarchy: HierarchyNode[],
	flatRoutes: Route[],
	parentPathname?: string
) {
	for (let i = 0; i < hierarchy.length; i++) {
		const node = hierarchy[i];

		const fullPathnameToSearchWith = !parentPathname
			? node.path
			: ["/", parentPathname, node.path].join("/").replace(/(\/+)/g, "/");

		const matchingRoute = flatRoutes.find(
			(route) => route.path === fullPathnameToSearchWith
		);

		if (matchingRoute)
			hierarchy[i] = {
				...node,
				...matchingRoute,
				path: node.path,
				relativePath: node.path,
				fullPath: matchingRoute.path,
			};

		if (!node.children.length) continue;
		hierarchy[i].children = recursivelyFillRouteInfoIntoNodes(
			node.children,
			flatRoutes,
			fullPathnameToSearchWith
		);
	}
	return hierarchy;
}

export default function turnFlatRoutesToTree(routes: Route[]) {
	let hierarchy = convertToHierarchy(
		// Ignore the starting `/`
		routes.map((route) => route.path.slice(1))
	);
	// We have the hierarchy now, time to fill in the route information at the right places if there are.
	hierarchy = recursivelyFillRouteInfoIntoNodes(hierarchy, routes);
	return hierarchy;
}
