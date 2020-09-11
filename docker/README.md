# Materia Docker Container

Materia development environment using docker containers.

## Container Architecture

 1. [Nginx](https://www.nginx.com/) as a web server (proxies to phpfpm for app and serves static files directly)
 3. [PHP-FPM](https://php-fpm.org/) manages the PHP processes for the application
 4. [MySQL](https://www.mysql.com/) for storing relational application data
 5. [Memcached](https://memcached.org/) for caching data and sessions
 6. [Node.js](https://nodejs.org/en/) compiles all the js and css assets
 7. [FakeS3](https://github.com/jubos/fake-s3) mocks AWS S3 behavior for asset uploading

## Setup

Clone Materia, cd into `/docker` and execute `./run_first.sh`.

Please take note of the user accounts that are created for you in the install process.  The user names and a random password will be echoed to the terminal after Composer installs the required PHP libraries.

### Common Dev Commands

* Run the containers after ./run_first.sh has finished
	```
	docker-compose up
	```
* Run the servers in background
	```
	docker-compose up -d
	```
* Tail logs from backgrounded servers
	```
	docker-compose logs -f phpfpm
	```
* Run commands on the phpfpm container (like php, composer, or fuelphp oil commands)
	```
	./run.sh php -i 
	./run.sh php oil r admin:help
	./run.sh composer run --list
	```
* Stop containers (db data is retained)
	```
	docker-compose stop
	```
* Stop and destroy the containers (deletes database data!, first_run.sh required after)
	```
	docker-compose down
	```
* Compile the javascript and sass
	```
	./run_build_assets.sh
	```
* Install composer libraries
	```
	./run.sh composer install
	```
* Install all Widgets in fuel/app/tmp/widget_packages/*.wigt
	```
	./run_widgets_install.sh '*.wigt'
	```
* Run Tests for development
 	```
	./run_tests.sh
	```
* Run Tests for as like the CI server
 	```
	./run_tests_ci.sh
	```
* Run Tests with code coverage
 	```
	./run_tests_coverage.sh
	```
* Create a user based on your docker host machine's current user
 	```
	$ iturgeon@ucf: ./run_create_me.sh
	User Created: iturgeon password: kogneato
	iturgeon now in role: super_user
	iturgeon now in role: basic_author
	```
* Create the [default users outlined in the config](https://github.com/ucfopen/Materia/blob/master/fuel/app/config/materia.php#L56-L78)
	```
	./run_create_default_users.sh
	```
* Build a deployable materia package (zip w/ compiled assets, and dependencies; see [assets on our releases](https://github.com/ucfopen/Materia/releases))
	```
	./run_build_github_release_package.sh
	```
* Installing widgets: Copy the widget file you want to install into **app/fuel/app/tmp/widget\_packages/** and then run **install_widget.sh** passing the name of the widget file to install. Example:

    ```
    cp my_widget.wigt ~/my_projects/materia_docker/app/fuel/app/tmp
    cd ~/my_projects/materia_docker
    ./run_widgets_install.sh my_widget.wigt
    ```
* Installing test widgets?
    ```
    traverse to app/fuel/packages/materia/test/widget_source/
    Update test widgets as desired.
    traverse into the widget folder.
    read build instructions in that widget's README.md
    Note: these widget are necessary when running run_tests.sh
    ```
### Default User Accounts

If you wish to log into Materia, there are [3 default accounts created for you based on the config](https://github.com/ucfopen/Materia/blob/master/fuel/app/config/materia.php#L56-L78). If you're on osx or linux, you'll also get a user based on the username you use on the host machine.

### Updating a container

If you're wanting to update a php or mysql version, this can be done locally for testing before updating the global image.

1. edit the desired dockerfile (or just alter the image in docker-compose if there is no dockerfile).
2. Execute `./run_docker_build_web.sh` to build a new local web/php image.
3. OVERWRITE your locally tagged image: `docker tag materia-web-base:latest ucfopen/materia-web-base:latest`
4. Removing any existing running container using that image
5. Start the desired container
6. Verify the container is running the new version
7. Test Materia
8. submit a pull request (the containers are built and published automatically)

### Troubleshooting

#### Table Not Found

When running fuelphp's install, it uses fuel/app/config/development/migrations.php file to know the current state of your database. Fuel assumes this file is truth, and won't create tables even on an empty database. You probably need to delete the file and run the setup scripts again.

#### No space left on dev error

If you get a *no space left on dev* error: Remove the machine with `docker-machine rm default` then start over from step 3 in OSX Docker Setup. You may need to attempt the rm command twice before it removes the VM successfully.)

Run oil commands: `docker-compose run --rm phpfpm php oil ......`

You can clone the repositories from the repositories from the materia widget config:
`./run_build_widgets.sh`

Then install them all
`./run_widgets_install.sh '*.wigt'`

## Running on different platform containers

We've included Alpine, Amazon Linux 2, and Debian (default) Docker files so that you can run, test, and compare production installs.

Note the [Dockerfiles](https://github.com/ucfopen/Materia/tree/master/docker/dockerfiles) and corrisponding Docker Compose files for each platform.

To run in an Amazon Linux Docker environment, all of the above commands need to be run with an environment variable set.  
```sh
export COMPOSE_WITH=alpine
./run_first.sh
```
or
```sh
COMPOSE_WITH=alpine ./run_first.sh

```
Then docker-compose up needs to be run using the selected config

```sh
docker-commpose -f docker-commpose.yml -f docker-compose.alpine.yml up

```
