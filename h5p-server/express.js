const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const upload = require("express-fileupload");
const cors = require("cors");
const H5PServer = require("@lumieducation/h5p-server");
const { h5pAjaxExpressRouter } = require("@lumieducation/h5p-express");
const dotenv = require("dotenv");
const cron = require("node-cron");
const morgan = require("morgan");

const { editorRenderer } = require("./renderers/editor");
const { playerRenderer } = require("./renderers/player");
const { adminRenderer } = require("./renderers/admin");
const hooks = require("./custom/hooks");
import MateriaTempFileStorage from "./interfaces/MateriaTempFileStorage.js";

const app = express();

const port = 3000;

// if in development use '.env.local' file, else use '.env' file
const envFile = process.env.ENVIRONMENT == "prod" ? `.env` : ".env.local";
dotenv.config({ path: path.resolve(envFile) });

function User() {
  this.id = "1";
  this.name = "Firstname Surname";
  this.canInstallRecommended = true;
  this.canUpdateAndInstallLibraries = true;
  this.canCreateRestricted = true;
  this.type = "local";
  this.email = "test@example.com";
}

let h5pEditor = {};
let h5pPlayer = {};

const setupConfig = (resolve, reject) => {
  new H5PServer.H5PConfig(
    new H5PServer.fsImplementations.JsonStorage(path.resolve("h5p-config.json"))
  )
    .load()
    .then(config => {
      resolve(config);
    });
};

const setupPlayerAndEditor = config => {
  // using cached library storage to cache most common calls to the libraries, improving performance
  // also using custom tempfilestorage to automate uploading media to materia from h5p server
  const editor = new H5PServer.H5PEditor(
    new H5PServer.fsImplementations.InMemoryStorage(),
    config,
    // new H5PServer.fsImplementations.FileLibraryStorage(
    //   path.resolve("h5p/libraries")
    // ),
    new H5PServer.cacheImplementations.CachedLibraryStorage(
      new H5PServer.fsImplementations.FileLibraryStorage(
        path.resolve("h5p/libraries")
      )
    ),
    new H5PServer.fsImplementations.FileContentStorage(
      path.resolve("h5p/content")
    ),
    // new H5PServer.fsImplementations.DirectoryTemporaryFileStorage(
    //   path.resolve("h5p/temporary-storage")
    // )
    new MateriaTempFileStorage(),
    undefined,
    undefined,
    {
      customization: {
        global: {
          scripts: ["/custom/fullscreen.js"]
        },
        alterLibrarySemantics: hooks.alterLibrarySemanticsHook
      }
    }
  );

  const player = new H5PServer.H5PPlayer(
    editor.libraryStorage,
    editor.contentStorage,
    config
  );

  return [editor, player];
};

const setupServer = ([editor, player]) => {
  h5pEditor = editor;
  h5pPlayer = player;

  const setupServerPromise = (resolve, reject) => {
    // TODO replace whitelist with hosts from context env var
    app.use(
      cors({
        origin: [
          "http://localhost:8118",
          "http://localhost",
          "http://localhost:8008",
          "http://127.0.0.1",
          "http://127.0.0.1:8008"
        ]
      })
    );

    app.use(morgan("combined"));

    app.use(bodyParser.json({ limit: "500mb" }));
    app.use(
      bodyParser.urlencoded({
        extended: true
      })
    );

    app.use(
      upload({
        limits: { fileSize: h5pEditor.config.maxFileSize }
      })
    );

    // inject user data into request
    // TODO don't just make an arbitrary user object!
    app.use((req, res, next) => {
      req.user = new User();
      next();
    });

    // load custom styles and js
    app.use("/styles", express.static("styles"));
    app.use("/custom", express.static("custom"));

    // RENDERER OVERRIDES
    // ASSUMING DIRECT CONTROL
    h5pEditor.setRenderer(editorRenderer);
    h5pPlayer.setRenderer(playerRenderer);

    app.use(
      h5pEditor.config.baseUrl,
      h5pAjaxExpressRouter(
        h5pEditor,
        path.resolve("h5p/core"), // the path on the local disc where the files of the JavaScript client of the player are stored
        path.resolve("h5p/editor") // the path on the local disc where the files of the JavaScript client of the editor are stored
        // undefined,
        // "auto" // You can change the language of the editor here by setting
        // the language code you need here. 'auto' means the route will try
        // to use the language detected by the i18next language detector.
      )
    );

    // cron job runs once daily at 3:00am to delete temporary files that have expired.
    // expired time being 24 hours after initial upload
    cron.schedule("0 3 * * *", () => {
      h5pEditor.temporaryFileManager.cleanUp();
    });

    resolve();
  };
  return new Promise(setupServerPromise);
};

new Promise(setupConfig)
  .then(setupPlayerAndEditor)
  .then(setupServer)
  .then(page => {
    app.get("/status", (req, res) => {
      res.status(200).end();
    });

    // only expose /admin route if in development
    if (process.env.ENVIRONMENT != "prod") {
      app.get("/admin", (req, res) => {
        h5pEditor.setRenderer(adminRenderer);
        h5pEditor
          .render(undefined, "en", req.user)
          .then(page => {
            res.send(page);
            res.status(200).end();
          })
          .catch(error => {
            console.error("Error GET /admin:");
            console.error(error);
            res.status(500).end();
          });
      });
    }

    // create new h5p content of a given type
    app.get("/new/:type", (req, res) => {
      h5pEditor.setRenderer(editorRenderer);

      h5pEditor
        .render(undefined, "en", req.user)
        .then(page => {
          res.send(page);
          res.status(200).end();
        })
        .catch(error => {
          console.error("Error GET /new/:type :");
          console.error(error);
          res.status(500).end();
        });
    });

    app.get("/edit/:type", (req, res) => {
      h5pEditor.setRenderer(editorRenderer);

      h5pEditor
        .render(undefined, "en", req.user)
        .then(page => {
          res.send(page);
          res.status(200).end();
        })
        .catch(error => {
          console.error("Error GET /edit/:type :");
          console.error(error);
          res.status(500).end();
        });
    });

    app.get(`${h5pEditor.config.playUrl}/:type`, (req, res) => {
      // TODO provide h5pPlayer with content id depending on h5P | materia toggle? Is that needed?
      // otherwise, we're looking for req.params.contentId
      if (req.params.type == "undefined") {
        // TODO: probly need to display a 404 for this
        console.error("Error GET /play/:type : type undefined");
        res.status(404).end();
      }

      // type directs to render configs located at h5p/content/:type
      h5pPlayer
        .render(req.params.type, "en", req.user)
        .then(h5pPage => {
          res.send(h5pPage);
          res.status(200).end();
        })
        .catch(error => {
          console.error("Error GET /play/:type :");
          console.error(error);
          res.status(500).end();
        });
    });

    // return a new h5p widget
    // used for materia to check for specific library
    // should be deprecated as there is no need to save this information on the server
    app.post("/new/:type", (req, res) => {
      h5pEditor
        .saveOrUpdateContent(
          undefined,
          req.body.params.params,
          req.body.params.metadata,
          req.body.library,
          req.user
        )
        .then(contentId => {
          //returns contentID of widget for materia to put in the qset
          res.send(JSON.stringify({ contentId }));
          res.status(200).end();
        })
        .catch(error => {
          console.error("Error POST /new/:type :");
          console.error(error);
          res.status(500).end();
        });
    });

    var key = fs.readFileSync('/etc/nginx/conf.d/key.pem');
    var cert = fs.readFileSync('/etc/nginx/conf.d/cert.pem');
    var options = {
      key: key,
      cert: cert
    };

    const server = https.createServer(options, app);

    server.listen(port, () => {
      console.log(
        `Server is running at http(s)://localhost:${port}. Current Materia context: ${process.env.ENVIRONMENT}.`
      )
    });
  })
  .catch(error => {
    console.error("Error setting up the h5p node express server:");
    console.error(error);
  });
