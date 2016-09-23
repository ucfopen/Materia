# Materia

* [Materia Docs](http://ucfcdl.github.io/Materia/) for public how-tos and widget descriptions.
* [FuelPHP](http://fuelphp.com) 1.7.2 for the application's main backend framework.
* [Gulp](http://gulpjs.com) for compiling static resources like CoffeeScript and SASS.
* [Clu Materia Repositories](https://clu.cdl.ucf.edu/groups/materia) for existing widgets and supporting projects.
* [DevMateria](https://clu.cdl.ucf.edu/materia/devmateria) for fast widget development.

# Installation

## Developing with Docker

Start your Development server with instructions found in the [Materia Docker repository](https://clu.cdl.ucf.edu/materia/materia-docker)

## Ansible Deployment

Check out the ansible scripts used to deploy Materia on qa and production [Materia-Ansible](https://clu.cdl.ucf.edu/devops/materia-ansible
)


## Running Tests

Tests run in the docker environment to maintain consistancy.

### Full test suite

Installs the base widgets, sets up and cleans a test database, runs all the tests and generates coverage reports

`./run_tests.sh` will prepare the test environment and run all the unit tests and integration tests

### Running A single test group

Inspect the actual test command in `/.run_tests.sh` for guidance, but as of the time of writing this, you can run a subset of the tests in the docker environment to save time.

The following command will run just the **Oauth** tests rather quickly:

`docker-compose -f docker-compose.yml -f docker-compose.admin.yml run --rm phpfpm /wait-for-it.sh mysql:3306 -t 20 -- env SKIP_BOOTSTRAP_TASKS=true php oil test --group=Oauth`


### Tests for Jenkins

Jenkins has a few special requirements, so it extends run_tests.sh with it's own setup code.

