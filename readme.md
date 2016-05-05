Sofe with CSS Modules
=====================

## Requirements
 * Stylesheets loaded at run-time
 * A sofe stylesheet can define global CSS rules
 * A sofe stylesheet can define local CSS rules that can be whos classes
 can be imported into a local app.
 * A sofe stylesheet can define local CSS rules which can be composed
 inside a stylesheet within a local app.
 * If the stylesheet distributable is not native CSS, it should be not
 be drastically larger in size.

## Design
Because the stylesheets must be loaded at runtime, we must handle both the
application css and the consumed service css. Handling this either has to
be at runtime or at build time.

### Run-time parsing
Process and parse both the service and app styles at runtime.

#### Pros
 * The application styles can be native CSS
 * The service styles can be native CSS
 * Any CSS file can easily be treated as a sofe css service
 * Potentially easier debugging.
#### Cons
 * Need to include a CSS parser at run-time in the browser. This would
	 increase the size of sofe.
 * It isn't necessarily trivial to write a parser. Longer implementation
	 time.
 * Runtime possibly slower.

### Build-time parsing
Pre-process the service and app styles.

#### Pros
 * No run-time parsing.
 * Probably faster.
 * Quicker to get sofe with cssm built.
 * Take advantage of Node.js CSS parsing libraries.
#### Cons
 * The distributables of the app and service styles are not CSS but
	 rather another format that doesn't require parsing.
 * That format may be larger than pure CSS.
