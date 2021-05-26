# Materia Docker Container

We publish production ready docker containers for each release in the [Materia GitHub Docker Repository](https://github.com/orgs/ucfopen/packages/container/package/materia).  These images are built and published automatically using GitHub Actions on every tagged release.

```
docker pull ghcr.io/ucfopen/materia:webserver-v8.0.0
docker pull ghcr.io/ucfopen/materia:app-v8.0.0
```

## Container Architecture

 1. [webserver (Nginx)](https://www.nginx.com/) as a web server (proxies to phpfpm for app and serves static files directly)
 3. [app (PHP-FPM)](https://php-fpm.org/) manages the PHP processes for the application
 4. [mysql](https://www.mysql.com/) for storing relational application data
 5. [memcached](https://memcached.org/) for caching data and sessions
 6. [fakeS3](https://github.com/jubos/fake-s3) mocks AWS S3 behavior for asset uploading

## Setup

Clone Materia, cd into `/docker` and execute `./run_first.sh`.

Please take note of the user accounts that are created for you in the install process.  The user names and a random password will be echoed to the terminal after Composer installs the required PHP libraries.  If you're on linux, setup should create a user with your current host machine's user name automatically.

### Common Dev Commands

* Run the containers after ./run_first.sh has finished
    ```
    docker-compose up
    ```
* Run the servers in background
    ```
    docker-compose up -d
    ```
* Tail logs from background process
    ```
    docker-compose logs -f app
    ```
* Run commands on the app container (like php, composer, or fuelphp oil commands)
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

If you wish to log into Materia, there are [3 default accounts created for you based on the config](https://github.com/ucfopen/Materia/blob/master/fuel/app/config/materia.php#L56-L78). If you're on OSX or Linux, you'll also get a user based on the username you use on the host machine.

### Updating a container

If you're wanting to update a php or mysql version, this can be done locally for testing before updating the global image.

1. finish your edits.
2. Execute `docker-compose build` to rebuild any images.
4. Removing any existing running container using that image: `docker-compose stop app` and `docker-compose rm app`
5. Start the desired container: `docker-compose up app`

## Production Ready Docker Compose

If you plan on deploying a production server using these docker images, we suggest using docker-compose. You will probably want to have an external database service (like AWS's RDS), and you'll need a place to keep backups of any uploaded files.

### Dynamic Files to Backup

* MySQL Database Contents
* Uploaded Media
* Installed Widget Engine Files

### Sample Docker Compose

```yaml
version: '3.5'

services:
  webserver:
    image: ghcr.io/ucfopen/materia:webserver-v8.0.0
    ports:
      # 443 would be terminated at the load balancer
      # Some customization required to terminate 443 here (see dev nginx config)
      - "80:80"
    networks:
      - frontend
    volumes:
      # mount css/js assets from the app image
      - compiled_assets:/var/www/html/public
      # mount installed widget engines on the host
      - ./widget/:/var/www/html/public/widget
    depends_on:
      - app

  app:
    image: ghcr.io/ucfopen/materia:app-v8.0.0
    env_file:
        # View Materia Readme for ENV vars
        - .env
    networks:
      - frontend
      - backend
    volumes:
      # share css/js assets
      - compiled_assets:/var/www/html/public
      # mount installed widget engines on the host
      - ./widget/:/var/www/html/public/widget/
      # # mount uploaded media on the host
      - ./media/:/var/www/html/fuel/app/media/
    depends_on:
      - memcached
      # - mysql

  memcached:
    image: memcached:1.6.6-alpine
    networks:
      - backend

#  Mysql in production should probably be an external server
#   mysql:
#     image: mysql:5.7.18
#     environment:
#       - MYSQL_ROOT_PASSWORD
#       - MYSQL_USER
#       - MYSQL_PASSWORD
#       - MYSQL_DATABASE
#     networks:
#       - backend

networks:
  frontend:
    name: materia_frontend
  backend:
    name: materia_backend

volumes:
  compiled_assets: {} # used to share pre-compiled assets with nginx container

```

### Troubleshooting

#### Table Not Found

When running fuelphp's install, it uses fuel/app/config/development/migrations.php file to know the current state of your database. Fuel assumes this file is truth, and won't create tables even on an empty database. You probably need to delete the file and run the setup scripts again.  run_first.sh does this for you if needed.

