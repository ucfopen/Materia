# Materia

View the [Materia Docs](http://ucfopen.github.io/Materia-Docs/) for info on installing, using, and developing Materia and widgets.

[Join UCF Open Slack Discussions](https://ucf-open-slackin.herokuapp.com/) [![Join UCF Open Slack Discussions](https://ucf-open-slackin.herokuapp.com/badge.svg)](https://ucf-open-slackin.herokuapp.com/)

## Quick Heroku Deploy

We added Heroku support as an easy way to give Materia a **free test drive** (or scale it up for production use).

[![Deploy Materia to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

> [Heroku](https://www.heroku.com/what) is a cloud service that lets you host web apps in the cloud without having to worry so much about the infrastructure.

# Installation

## Developing with Docker

Start your Development server with instructions found in the [Materia Docker repository](docker/README.md)

# Development

## Running Tests

Tests run in the docker environment to maintain consistency.

### Full test suite

Installs the base widgets, sets up and cleans a test database, runs all the tests and generates coverage reports

`./run_tests.sh` will prepare the test environment and run all the unit tests and integration tests

### Running A single test group

Inspect the actual test command in `/.run_tests.sh` for guidance, but as of the time of writing this, you can run a subset of the tests in the docker environment to save time.

The following command will run just the **Oauth** tests rather quickly:

`docker-compose -f docker-compose.yml -f docker-compose.admin.yml run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env SKIP_BOOTSTRAP_TASKS=true php oil test --group=Oauth`

### Tests for Jenkins

Jenkins has a few special requirements, so it extends run_tests.sh with it's own setup code.

## Git Hooks

There is a pre-commit hook available to ensure your code follows our linting standards. Check out the comments contained inside the hook files (in the githooks directory) to install it, you'll need a few dependencies installed to get linting working.
