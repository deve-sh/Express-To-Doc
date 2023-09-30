# 📃 Express to Doc

When you create a backend API, it can get large and lengthy very fast and documenting it is a hassle. The hardest part is often _getting started_.

This repo is a simple CLI utility to read your Express App and export standardized documentation templates like Postman Collection or OpenAPI Specification (Hit me up if you want that feature) to start documenting your APIs.

For now it supports Postman Collection exports.

### Pre-requisite

Export your Express app from your index flag.

```javascript
// app.js
module.exports = app;

// or if you're using TypeScript or ESM
export default app;
```

### Running the exporter

```bash
npm i --save-dev express-to-doc
# or
npm i -g express-to-doc

# Run the exporter
npx convert-express-app-to-doc
```

This starts a CLI session with options to export your Express app to a collection/documentation file.

![CLI Session](https://raw.githubusercontent.com/deve-sh/Express-To-Doc/main/doc-assets/cli-session.PNG)

### Passing options via CLI Flags

You can also pass options as CLI Flags when running this command in a non-interactive environment.

The following is a list of supported flags, the presence of which will disable the associated CLI prompts:

```bash
npx convert-express-app-to-doc
    --appPath=./test-app/app.js # Path to your final Express app
    --buildStep="npm run build" # If you're using a build step with something like TypeScript
    --moduleName="default" # Name of the module your Express app is exported as
    --doc=Postman
    # Applicable when setting `doc` as Postman
    --flat false    # Nest route paths recursively and create folders where needed
    --fileName="my.postman_collection.json"
    --collectionName="Express App"
```

### Possible features

-   GUI to spin up with the base app information to allow the user to add headers, query params and other information and export all that information instead.
-   Auto reading of query params, headers and body to generate a comprehensive Express app Postman collection/OpenAPI documentation.
