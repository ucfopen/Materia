# Materia

Materia is a platform and ecosystem for small, self-contained, customizable e-learning applications called _widgets_, designed to enhance digital course content. Widgets in the catalog can be customized by instructors to suit their instructional goals and objectives, then shared with students directly or embedded in an LMS through LTI.

Materia and its associated library of widgets is an open-source project of the University of Central Florida's Center for Distributed Learning.

# This repo is for the Materia Django Rewrite. You might be looking for [ucfopen/Materia](https://github.com/ucfopen/Materia) instead.

This version of Materia is **heavily work-in-progress**. You have been warned.

## Setup and installation

We recommend cloning this repository alongside the PHP version of Materia. The two can coexist, and you will probably need PHP Materia to reference the original codebase:

```
$ mkdir materia-django
$ git clone git@github.com:ucfopen/Materia.git materia-django
```

### Local dev with pyenv

[Install pyenv](https://github.com/pyenv/pyenv?tab=readme-ov-file#installation).
[Install pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv?tab=readme-ov-file#installation).
Using `pyenv`, make sure the required version of Python is installed and available. This may change over time.

Make sure [make](https://www.gnu.org/software/make/manual/make.html) is installed. Typically you can confirm this by checking the output of `which make` in *nix systems. Otherwise, it's up to you to determine how to use Makefiles on your operating system.

Several `make` commands are provided for your convenience:
 * `make dev-check` will check to ensure that the requisite tools `pyenv` and `pyenv-virtualenv` are installed, as well as the required version of Python. If any of the prerequisites are unavailable, you will be notified.
 * `make dev-setup` will, assuming all requirements in `dev-check` pass, automatically create a local dev environment with `pyenv` and `virtualenv`, install all necessary Python packages, and install pre-commit hooks.

---

View the [Materia Docs](http://ucfopen.github.io/Materia-Docs/) for info on installing, using, and developing Materia and widgets.

[Join UCF Open Slack Discussions](https://dl.ucf.edu/join-ucfopen/) [![Join UCF Open Slack Discussions](https://badgen.net/badge/icon/ucfopen?icon=slack&label=slack&color=e01563)](https://dl.ucf.edu/join-ucfopen/)