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

Clone repo and execute `./run_first.sh`

Please take note of the user accounts that are created for you in the install process.  The user names and a random password will be echoed to the terminal after Composer installs the required PHP libraries.

### Common Dev Commands

* Run the server
	```
	docker-compose up
	```
* Compile the javascript and sass
	```
	./run_assets_build.sh
	```
* Install composer libraries
	```
	docker-compose run --rm phpfpm composer install
	```
* Clone main materia widgets packages into fuel/app/tmp/widget_packages/*.wigt
	```
	./run_widgets_build.sh
	```
* Install all Widgets in fuel/app/tmp/widget_packages/*.wigt
	```
	./run_widgets_install.sh '*.wigt'
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

If you wish to log into Materia, there are 2 default accounts created for you.

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

### Building new docker images

Use the `build_xxxx.sh` scripts to build new versions of the images.  You'll need write access to the aws docker repository to upload them.
