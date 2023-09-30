// Algo Ref: https://stackoverflow.com/a/45075542

import type { Route } from "../types/Routes";

type HierarchyNode = {
	path: "root" | string;
	name?: string;
	children?: HierarchyNode[];
	fullPath?: string;
	relativePath?: string;
} & Partial<Route>;

class Flattener {
	private hierarchyFieldName: "children" | "item" = "children";
	private processRouteMatch:
		| ((route: Route, relativePath: string) => void)
		| null = null;

	constructor(
		options: Partial<{
			hierarchyFieldName: Flattener["hierarchyFieldName"];
			processRouteMatch: Flattener["processRouteMatch"];
		}> = {}
	) {
		this.hierarchyFieldName = options.hierarchyFieldName || "children";
		this.processRouteMatch = options.processRouteMatch || null;
	}

	private buildNodeRecursive(
		node: HierarchyNode,
		pathFragments: string[],
		index: number
	) {
		if (index < pathFragments.length) {
			let item = pathFragments[index];
			let dir = node[this.hierarchyFieldName]?.find(
				(child: HierarchyNode) => child.path == item
			);
			if (!dir)
				node[this.hierarchyFieldName]?.push(
					(dir = { path: item || "/", [this.hierarchyFieldName]: [] })
				);
			this.buildNodeRecursive(
				dir as HierarchyNode,
				pathFragments,
				index + 1
			);
		}
	}

	private convertToHierarchy(paths: string[]) {
		const rootNode = {
			path: "root",
			[this.hierarchyFieldName]: [],
		} as HierarchyNode;
		for (let path of paths)
			this.buildNodeRecursive(rootNode, path.split("/"), 0);
		return rootNode[this.hierarchyFieldName];
	}

	private recursivelyFillRouteInfoIntoNodes(
		hierarchy: HierarchyNode[],
		flatRoutes: Route[],
		parentPathname?: string
	) {
		for (let i = 0; i < hierarchy.length; i++) {
			const node = hierarchy[i];

			const fullPathnameToSearchWith = !parentPathname
				? node.path
				: ["/", parentPathname, node.path]
						.join("/")
						.replace(/(\/+)/g, "/");

			const matchingRoute = flatRoutes.find(
				(route) => route.path === fullPathnameToSearchWith
			);

			if (matchingRoute)
				hierarchy[i] = (
					this.processRouteMatch
						? this.processRouteMatch(matchingRoute, node.path)
						: {
								...node,
								...matchingRoute,
								path: node.path,
								relativePath: node.path,
								fullPath: matchingRoute.path,
						  }
				) as HierarchyNode;
			else hierarchy[i].name = node.path;

			if (!node[this.hierarchyFieldName]?.length) continue;
			hierarchy[i][this.hierarchyFieldName] =
				this.recursivelyFillRouteInfoIntoNodes(
					node[this.hierarchyFieldName] as HierarchyNode[],
					flatRoutes,
					fullPathnameToSearchWith
				);
		}
		return hierarchy;
	}

	turnFlatRoutesToTree(routes: Route[]) {
		let hierarchy = this.convertToHierarchy(
			// Ignore the starting `/`
			routes.map((route) => route.path.slice(1))
		);
		// We have the hierarchy now, time to fill in the route information at the right places if there are.
		hierarchy = this.recursivelyFillRouteInfoIntoNodes(
			hierarchy as HierarchyNode[],
			routes
		);
		return hierarchy;
	}
}

export default Flattener;
