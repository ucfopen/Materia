# Materia

Materia is a platform and ecosystem for small, self-contained, customizable e-learning applications called _widgets_, designed to enhance digital course content. Widgets in the catalog can be customized by instructors to suit their instructional goals and objectives, then shared with students directly or embedded in an LMS through LTI.

Materia and its associated library of widgets is an open-source project of the University of Central Florida's Center for Distributed Learning.

View the [Materia Docs](http://ucfopen.github.io/Materia-Docs/) for info on installing, using, and developing Materia and widgets.

[Join UCF Open Slack Discussions](https://dl.ucf.edu/join-ucfopen/) [![Join UCF Open Slack Discussions](https://badgen.net/badge/icon/ucfopen?icon=slack&label=slack&color=e01563)](https://dl.ucf.edu/join-ucfopen/)

## Using Materia at Your Institution

It's important to note that UCF maintains an instance of Materia for the UCF community, but it cannot grant access to users of other institutions. External institutions are welcome to host their own copy of Materia, and interested parties should contact their IT and distance learning department(s) about making Materia available to their students. We also welcome questions and inquiries on the UCF Open Slack discussion linked above.

## Widgets & Associated Repositories

While casual references to _Materia_ typically involve both the platform and its associated ecosystem of widgets, this repository only includes the Materia platform itself. Additional open-source repositories associated with Materia include:

- Most first-party widgets authored by UCF. These can be found by searching for "widget" under the UCFOpen GitHub organization or visiting the [Materia Widget Gallery](https://ucfopen.github.io/materia-widget-gallery/).
- The [Materia Widget Developer Kit (MWDK)](https://github.com/ucfopen/Materia-Widget-Dev-Kit). This is a required dependency of all widgets and includes a built-in express server and webpack configs for rapid in-situ development of widgets.
- [Materia-Theme-UCF](https://github.com/ucfopen/Materia-Theme-UCF). This is a FuelPHP module that allows for overrides of certain views (login, help pages) with institution-specific variants.

## Installation

Materia is configured to use Docker containers in production environments, orchestrated through docker compose, though other orchestration frameworks could potentially be used instead. While it may be possible to deploy Materia without Docker, we **do not recommend doing so**.

### Docker Deployment

We publish production-ready application and webserver images in the [Materia Docker repository](https://github.com/orgs/ucfopen/packages/container/package/materia), which can be used with docker compose as part of a production application instance.

The default compose file includes some minimum requirements for a local application. A production instance may require changes to the base compose file or composite additions via a `docker-compose.override.yml` file based on various needs. Note that the startup scripts mentioned below will create an override compose file for you.

### Configuration

> [!NOTE]
> Due to the ephemeral nature of docker containers, it is recommended you manage application configurations via a `.env` file on the host machine. Docker compose can import these environment variables into the application container.

Visit the [Server Variables](https://ucfopen.github.io/Materia-Docs/admin/server-variables.html) page on our docs site for information about configuration through environment variables.

## Setup

Materia provides a pair of setup scripts for out-of-the-box deployment based on two different use cases:

1. `run_first_for_dev.sh` sets up and configures your local instance of Materia for development. This includes additional volume mounts for project files and makes use of additional containers for mysql, s3, and memcached.
2. `run_first_for_nondev.sh` is ideal for users who just want to explore Materia locally and potentially transition to a production instance. The script dynamically configures the override compose file based on selections you make in the script.

> [!NOTE]
> `yq` is required for the nondev script. This may come preinstalled in some OS distributions but you should ensure the correct version is installed. Consult the [yq installation guide](https://github.com/mikefarah/yq?tab=readme-ov-file#install) for more info.

In either case, first-time setup involves the following:

```
git clone https://github.com/ucfopen/Materia.git
cd Materia/docker
```

Followed by either:
```
./run_first_for_dev.sh
```
For local development or 

```
./run_first_for_nondev.sh
```
For creating a local instance where development is not desired.

The `run_first` scripts only have to be run once for initial setup. Afterwards, your local copy will persist in a docker volume unless you explicitly use `docker compose down` or delete the volumes manually.

Use `docker compose up` to run your local instance. The compose process must persist to keep the application alive. Materia is configured to run at `https://localhost` by default.

In a separate terminal window, run `yarn dev` to enable the webpack dev server and live reloading while making changes to JS and CSS assets. This requires node and yarn to be installed on the host machine.

Note that Materia uses a self-signed certificate to facilitate https traffic locally. Your browser may require security exceptions for your application on ports `443` and `8008` (if setup for local development).

## Transitioning to Production

More information about creating a production-capable Materia instance can be found in the [Materia Docker Readme](docker/README.md).

### Creating additional users

See the wiki page for [Creating a local user](https://github.com/ucfopen/Materia/wiki#creating-a-local-user).

### Running Tests

Tests run in the docker environment to maintain consistency. View the `run_tests_*.sh` scripts in the docker directory for options.

#### Running A Single Test Group

Inspect the actual test command in `/.run_tests.sh` for guidance, but as of the time of writing this, you can run a subset of the tests in the docker environment to save time.

The following command will run just the **Oauth** tests rather quickly:

```
./run_tests.sh --group=Oauth
```

### Git Hooks

There is a pre-commit hook available to ensure your code follows our linting standards. Check out the comments contained inside the hook files (in the githooks directory) to install it, you may need a few dependencies installed to get linting working.

## Contributing

Code contributors should review the [CONTRIBUTING](CONTRIBUTING.md) document before proceeding.

## Authentication

Materia supports two forms of authentication:

- Direct authentication through direct logins. Note that Materia does not provide an out-of-the-box tool for user generation. If your goal is to connect to an external identity management platform or service, you will need to author an authentication module to support this. Review FuelPHP's [Auth package and Login driver](https://fuelphp.com/docs/packages/auth/types/login.html) documentation, as well as the `ltiauth` and `materiaauth` packages located in `fuel/packages` to get started.
- Authentication over LTI. This is the more out-of-the-box solution for user management and authentication. In fact, you can disable direct authentication altogether through the `BOOL_LTI_RESTRICT_LOGINS_TO_LAUNCHES` environment variable, making LTI authentication the only way to access Materia. Visit our [LTI Integration Overview](https://ucfopen.github.io/Materia-Docs/develop/lti-integrations.html) page on the docs site for more information.

## Asset Storage

Users can upload media assets (images and audio) for use in their widgets, facilitated through a media importer that is provided by Materia itself. Asset storage drivers include:

- `file`: Assets are stored on the local filesystem of the application. It is recommended that assets are backed up and synced with an external storage solution (such as S3) to ensure the files persist across application instances.
- `s3`: Files are uploaded to and requested directly from AWS S3. This is the most straightforward and recommended storage driver option. Be sure to consult the [Materia Docker Readme](docker/README.md) for additional environment variables associated with using S3.
- `db`: This storage driver stores asset binaries directly in the database. This option allows Materia to run on cloud hosting options with very limited storage volumes. The `db` storage driver option is not recommended for general use.

> [!WARNING]
> The `db` asset storage driver option is deprecated and will be removed in the next major version of Materia.

The storage driver is configured via the `ASSET_STORAGE_DRIVER` environment variable.

### Local Asset Storage With S3

A `fakes3` container is instantiated as part of the default development stack and the `ASSET_STORAGE_DRIVER` environment variable is set to `s3` by default in the development `.env` file located in `docker/.env`. When using `fakes3`, this is all that is required to simulate S3 usage locally.

To use an actual S3 bucket for local dev:

1. Set `DEV_ONLY_FAKES3_DISABLED` environment variable in `docker/.env` to `true`
2. Set `ASSET_STORAGE_S3_BUCKET` to your bucket name
3. Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` in `.env.local`. (Tip: You can run `aws configure export-credentials --profile YOUR_PROFILE_NAME --format env-no-export` to get these)

> [!NOTE]
> Note that `fakes3` asset storage is disabled when `FUEL_ENV` is set to `production`.

## Widget Management

A default list of widgets will be installed as part of the first-time setup process, but the widget ecosystem has many more! Peruse the [Materia Widget Gallery](https://ucfopen.github.io/materia-widget-gallery/) to view additional widgets to install.

### Installing Widgets

Widgets can be installed in one of two ways:

1. A user with the `super_user` role can visit the Widget Admin panel by navigating to `your.materia.url/admin/widget` or by selecting the orange "Admin" button at the top. Select a `.wigt` file from the file upload dialog to install it.
2. Widgets can be installed from the cli on the application container once running:

```
$ docker exec -it <container name or id> sh
$ wget url/for/materia/widget.wigt
$ php oil r widget:install widget.wigt
```

The `.wigt` files do not need to be retained once a widget is installed.


