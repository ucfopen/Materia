# H5P in Materia

This is a node server based on the work by LJ and Weining and their modification of Lumie Education's H5P Node Library: https://clu.cdl.ucf.edu/we352469/h5p-node-widget

### 

### Installation

```
docker build --tag h5p-server:1.0 .
```

### Running the Server
```
docker run --publish 3000:3000 --name h5p h5p-server:1.0
```

The server is currently configured to run at `localhost:3000` in the browser.


### Manual Installation  (No Docker)

Install the required node modules:
```
yarn install
```

Like the original Node Library, we need to download the H5P Core and H5P Editor files into their requisite directories.
* Place the [H5P Core](https://github.com/h5p/h5p-php-library/archive/1.24.0.zip) files into the `h5p/core` directory.
* Place the [H5p Editor](https://github.com/h5p/h5p-editor-php-library/archive/1.24.0.zip) files into the `h5/editor` directory.

You can then start with 
```
yarn start
```
and it'll run at `localhost:3000`

## Development Notes

This project is heavily WIP. Currently supported features include:

- Functional when embedded within the H5P Materia Widget (in fact, currently requires it)
- H5P Content creation, saving, and editing within the Materia Widget
- Serves the saved H5P Content in the Player

Current supported H5P Content Libraries:

- H5P MultiChoice

Here's a list of to-dos (last updated 7/13/20):

- Finalize GET and POST routes for the express server :ballot_box_with_check:
- Re-build the renderer to be more robust (instead of relying on failing an ajax request to select and render a given editor) :ballot_box_with_check:
- Re-implement communications with Materia via postMessages :ballot_box_with_check:
- Re-implement short-circuiting content creation and intercepting save data for use in a QSet :ballot_box_with_check:
- Investigate the best way to create a User object/IUser interface, required for certain H5P functions (right now it's a static object defined in express)
- Dockerize
- Automated install of H5P Core and Editor resources
- Admin tools (installing desired H5P content types)
- Hardening the editor so the user can't backtrack to the H5P Hub and select a different library
- Allow uploads of H5P library content (allowed in the default editor/H5P Hub interface)
- Allow previously saved H5P libraries to be re-edited :ballot_box_with_check:
- Re-implement the player, including loading saved H5P data from a QSet :ballot_box_with_check:
- Determine how to integrate H5P server layer with existing dev materia stack
- Implement scoring support
- Implement optional "native H5P support" toggle to allow for h5p content to be stored and served from the h5p server (`h5p/content`) if required