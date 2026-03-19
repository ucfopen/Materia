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

## Getting Started

Visit our [Getting Started page for Materia administrators](https://ucfopen.github.io/Materia-Docs/v11/admin/getting-started.html) to review the Materia system architecture and steps to run your own copy of Materia.

## Quick Startup for Local Development

If you want to run Materia locally for development purposes:

1. Clone this repository on your host machine.
2. Copy the environment variables template and populate the required values: `cp docker/.env_template docker/.env`.
3. Build and run the containers via `docker compose up` in the docker directory.
4. Perform first-time post-install tasks via `make post-install`.
5. Compile static assets via `yarn install` and `yarn build` in the repository root directory.

Materia is hosted on port `80` by default, but this can be changed by modifying the mapped port in the `docker/docker-compose.yml` file.

## Contributing to Materia

We accept issues and pull requests, but please review our [CONTRIBUTING](https://github.com/ucfopen/Materia/blob/master/CONTRIBUTING.md) file before proceeding.