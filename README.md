# Materia

Materia is a platform and ecosystem for small, self-contained, customizable e-learning applications called _widgets_, designed to enhance digital course content. Widgets in the catalog can be customized by instructors to suit their instructional goals and objectives, then shared with students directly or embedded in an LMS through LTI.

Materia and its associated library of widgets is an open-source project of the University of Central Florida's Center for Distributed Learning.

View the [Materia Docs](http://ucfopen.github.io/Materia-Docs/) for info on installing, using, and developing Materia and widgets.

[Join UCF Open Slack Discussions](https://dl.ucf.edu/join-ucfopen/) [![Join UCF Open Slack Discussions](https://badgen.net/badge/icon/ucfopen?icon=slack&label=slack&color=e01563)](https://dl.ucf.edu/join-ucfopen/)

## Using Materia at Your Institution

It's important to note that UCF maintains an instance of Materia for the UCF community, but it cannot grant access to users of other institutions. External institutions are welcome to host their own copy of Materia, and interested parties should contact their IT and distance learning department(s) about making Materia available to their students. We also welcome questions and inquiries on the UCF Open Slack discussion linked above.

## Installation

Materia is configured to use Docker containers in production environments, orchestrated through docker compose, though other orchestration frameworks could potentially be used instead. While it may be possible to deploy Materia without Docker, we **do not recommend doing so**.

### Docker Deployment

We publish production ready docker and nginx containers in the [Materia Docker repository](https://github.com/orgs/ucfopen/packages/container/package/materia).  For more info on using Docker in Production, read the [Materia Docker Readme](docker/README.md)

### Configuration

Visit the [Server Variables](https://ucfopen.github.io/Materia-Docs/admin/server-variables.html) page on our docs site for information about configuration through environment variables.

## Development

Code contributors should review the [CONTRIBUTING](CONTRIBUTING.md) document before proceeding.

### Local Dev with Docker

Get started with a local dev server:

```
git clone https://github.com/ucfopen/Materia.git

cd Materia/docker

./run_first.sh
```

The `run_first.sh` script only has to be run once for initial setup. Afterwards, your local copy will persist in a docker volume unless you explicitly use `docker-compose down` or delete the volume manually.

Use `docker-compose up` to run your local instance. The compose process must persist to keep the application alive. Materia is configured to run at `https://127.0.0.1` by default.

In a separate terminal window, run `yarn dev` to enable the webpack dev server and live reloading while making changes to JS and CSS assets. 

Note that Materia uses a self-signed certificate to facilitate https traffic locally. Your browser may require security exceptions for both `127.0.0.1:443` and `127.0.0.1:8008`.

More info about Materia Docker can be found in the [Materia Docker Readme](docker/README.md)

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

## Authentication

Materia supports two forms of authentication:

- Direct authentication through direct logins. Note that Materia does not provide an out-of-the-box tool for user generation. If your goal is to connect to an external identity management platform or service, you will need to author an authentication module to support this. Review FuelPHP's [Auth package and Login driver](https://fuelphp.com/docs/packages/auth/types/login.html) documentation, as well as the `ltiauth` and `materiaauth` packages located in `fuel/packages` to get started.
- Authentication over LTI. This is the more out-of-the-box solution for user management and authentication. In fact, you can disable direct authentication altogether through the `BOOL_LTI_RESTRICT_LOGINS_TO_LAUNCHES` environment variable, making LTI authentication the only way to access Materia. Visit our [LTI Integration Overview](https://ucfopen.github.io/Materia-Docs/develop/lti-integrations.html) page on the docs site for more information.

## Asset Storage

Materia enables users to upload media assets for their widgets, including images and audio. There are two asset storage drivers available out of the box: `file` and `db`. `file` is the default asset storage driver, which can be explicitly set via the `ASSET_STORAGE_DRIVER` environment variable.