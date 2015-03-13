# Materia

http://ucfcdl.github.io/Materia/

Materia is built with the FuelPHP framework.

* Version: 1.7.2
* [Website](http://fuelphp.com/)

# Installation

## OSX / Linux

### Prerequisites (on the host machine)

1. php >=5.4 
2. nodejs
3. Grunt cli
4. Git
5. python
6. Vagrant
7. required github and clu ssh keys
9. Vagrant librarian-chef plugin ```vagrant plugin install vagrant-librarian-chef```
10. Vagrant Omnibus ```vagrant plugin install vagrant-omnibus```

### Install

```
git clone git@github.com:ucfcdl/Go-Bot.git materia
cd materia
git clone git@clu.cdl.ucf.edu:materia/vagrant.git
python go init vagrant/Vagrantfile vagrant/go_config.json
vagrant up
python go stage
python go deploy

# For first time Materia setup
cd current && php oil r install
```

#### Updating Materia

run ```python go prepare``` then ```python go deploy``` in the top level directory.  This check out a copy of materia, run setup tasks, then point all the symlinks at it.

