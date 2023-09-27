const normalizeRoutePath = (path: string) => {
	// For platform consistencies to ensure varying types of slashes don't creep into the names of route elements in the collection.
	return path.replace(/\\/g, "/");
};

export default normalizeRoutePath;