# Materia

Materia is a platform and ecosystem for small, self-contained, customizable e-learning applications called _widgets_, designed to enhance digital course content. Widgets in the catalog can be customized by instructors to suit their instructional goals and objectives, then shared with students directly or embedded in an LMS through LTI.

Materia and its associated library of widgets is an open-source project of the University of Central Florida's Center for Distributed Learning.

View the [Materia Docs](http://ucfopen.github.io/Materia-Docs/) for info on installing, using, and developing Materia and widgets.

[Join UCF Open Slack Discussions](https://dl.ucf.edu/join-ucfopen/) [![Join UCF Open Slack Discussions](https://badgen.net/badge/icon/ucfopen?icon=slack&label=slack&color=e01563)](https://dl.ucf.edu/join-ucfopen/)

# Installation

## Docker

We publish production ready docker and nginx containers in the [Materia Docker repository](https://github.com/orgs/ucfopen/packages/container/package/materia).  For more info on using Docker in Production, read the [Materia Docker Readme](docker/README.md)

## Configuration

Visit the [Server Variables](https://ucfopen.github.io/Materia-Docs/admin/server-variables.html) page on our docs site for information about configuration through environment variables.

# Development

## Local Dev with Docker

Get started with a local dev server:

```
git clone https://github.com/ucfopen/Materia.git

cd Materia/docker

./run_first.sh
```
More info about Materia Docker can be found in the [Materia Docker Readme](docker/README.md)

## Running Tests

Tests run in the docker environment to maintain consistency. View the `run_tests_*.sh` scripts in the docker directory for options.

### Running A Single Test Group

Inspect the actual test command in `/.run_tests.sh` for guidance, but as of the time of writing this, you can run a subset of the tests in the docker environment to save time.

The following command will run just the **Oauth** tests rather quickly:

```
./run_tests.sh --group=Oauth
```

## Git Hooks

There is a pre-commit hook available to ensure your code follows our linting standards. Check out the comments contained inside the hook files (in the githooks directory) to install it, you'll need a few dependencies installed to get linting working.