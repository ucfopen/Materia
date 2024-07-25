import os

from django.conf import settings
from django.core.management import base, call_command
from django.db import connection

from urllib import request
from util.widget.installer import WidgetInstaller

import logging
logger = logging.getLogger('django')

class Command(base.BaseCommand):
    help = 'Commands for managing widgets and widget instances'

    # TODO: the old Fuel commands provided a pretty helpful syntax for easily running commands
    #  with any number of options or arguments, but that seems to require a bit of effort with
    #  Django
    # figure out how to enable the old behavior, or figure out some kind of alternative
    def add_arguments(self, parser):
        parser.add_argument('subcommand', type=str, help='Which subcommand function to run')
    def handle(self, *args, **kwargs):
        subcommand = kwargs['subcommand']
        command_function = getattr(self, subcommand)
        try:
            command_function()
        except Exception as e:
            logger.info(e)
            logger.exception('')

    def install_from_config(self):
        widgets = settings.WIDGETS
        for w in widgets:
            self.install_from_url(w['package'], w['checksum'], w['id'])

    def install_from_url(self, package_url, checksum_url, desired_id):
        local_package = self.download_package(package_url)
        local_checksum = self.download_package(checksum_url)

        # temporarily hard-code file paths until the process is finished
        valid = self.validate_checksum(local_package, local_checksum)

        self.replace_id = desired_id
        if valid:
            self.install(local_package)

    def download_package(self, file_url):
        file_name = os.path.basename(file_url)
        output_dir = WidgetInstaller.get_temp_dir()

        logger.info(f"Downloading .wigt package {file_url}")
        download_location = f"{output_dir}{file_name}"
        with request.urlopen(file_url) as download:
            open(download_location, 'wb').write(download.read())

        logger.info(f"Package downloaded: {download_location}")
        return download_location

    def validate_checksum(self, widget_path, checksum_path):
        from yaml import safe_load, YAMLError

        checksums = None
        with open(checksum_path, 'rb') as checksum_file:
            try:
                checksums = safe_load(checksum_file)
            except YAMLError:
                raise Exception("Error trying to parse YAML from checksum file!")

        from hashlib import sha1, sha256, md5

        sha1_hash = sha1()
        sha256_hash = sha256()
        md5_hash = md5()

        with open(widget_path, 'rb') as widget_file:
            while True:
                data = widget_file.read(65536) # read the file contents 64kb at a time
                if not data:
                    break
                sha1_hash.update(data)
                sha256_hash.update(data)
                md5_hash.update(data)

        sha1_hash = sha1_hash.hexdigest()
        sha256_hash = sha256_hash.hexdigest()
        md5_hash = md5_hash.hexdigest()
        if sha1_hash != checksums["sha1"]:
            raise Exception("Error: sha1 checksum mismatch!")
        if sha256_hash != checksums["sha256"]:
            raise Exception("Error: sha256 checksum mismatch!")
        if md5_hash != checksums["md5"]:
            raise Exception("Error: md5 checksum mismatch!")

        logger.info("Checksum valid")
        logger.info(f"Build date: {checksums['build_date']}")
        logger.info(f"Git Source: {checksums['git']}")
        logger.info(f"Git Commit: {checksums['git_version']}")

        return True


    # must be passed a .wigt file reference, can use glob syntax to match multiple widgets
    def install(self, package_path):
        # TODO: figure out how to make it possible to run this from the command line
        #  as well as from an adjacent function
        # if (\Cli::option('help') || \Cli::option('?'))
        # {
        #     \Cli::write('Installs valid .wigt packages to your Materia install.');
        #     \Cli::write('');
        #     \Cli::write('Usage: widget:install [options] [git url, .widgt file url, .wigt file path, or an entire directory]', 'white');
        #     \Cli::write('');
        #     \Cli::write('Options:', 'white');
        #     \Cli::write('	--skip-upgrade: If there is a package with the same name, do not upgrade it.');
        #     \Cli::write('	--replace-id: Set a widget id youd like to replace.');
        #     \Cli::write('	--help (-h): Displays this message.');
        #     \Cli::write('');
        #     \Cli::write('Directory or .wigt file(s)', 'white');
        #     \Cli::write('');
        #     exit(0);
        # }

        # parse all the file paths passed to the task
        # used 'func_get_args()' in PHP
        # widget_files = self.get_files_from_args(however_we_get_args())
        widget_files = [package_path]

        replace_id = int(self.replace_id) # this could also possibly come from args
        # file_count = len(widget_files)
        # if not file_count:
            # raise Exception(f"No widgets found in {','.join(however_we_get_args())}")
        # if file_count > 1 and replace_id > 0:
        #     raise Exception("Multiple widgets can not be specified when using --replace_id option")

        # this seems like it's only happening to support downstream activity log creation
        # maybe just allow any activity logs for widget installation/updates done in the console
        #  to have a null user?
        for file in widget_files:
            skip_upgrade = False # get this from the CLI options somehow?
            WidgetInstaller.extract_package_and_install(file, skip_upgrade, replace_id)


'''
class Widget extends \Basetask
{

    public static function copy_instance()
    {
        // Login as someone:
        \Cli::write('You need to login to do this.  Who do you want to login as?');
        $user = self::search_for_user();
        \Auth::instance('Materiaauth')->force_login($user->id);

        $inst_id = \Cli::prompt('Widget ID');
        $inst = self::get_widget_instance($inst_id);
        $default_name = $inst->name.' (copy)';
        $new_name = \Cli::prompt('New widget name ['.$default_name.']');
        if ($new_name == '')
        {
            $new_name = $default_name;
        }

        \Materia\API::widget_instance_copy($inst_id, $new_name);
    }

    public static function show_instance($inst_id)
    {
        $inst = \Materia\Widget_Instance_Manager::get($inst_id, true);

        if (\Cli::option('dump'))
        {
            \Cli::write(print_r($inst));
        }
        else
        {
            \Cli::write(\Cli::color('Widget Instance Info:','green'));
            // print out all the variables
            foreach ($inst as $prop => $val)
            {
                if (is_array($val) || is_object($val)) $val = '{'.gettype($val).'}';
                \Cli::write(\Cli::color("$prop: ", 'green').\Cli::color($val, 'yellow'));
            }
        }
    }

    public static function show_qset($inst_id)
    {
        $inst = new \Materia\Widget_Instance();
        $inst->get_qset($inst_id);

        \Cli::write(print_r($inst->qset->data));
    }


    public static function delete_instance($inst_id)
    {
        if (\Cli::prompt(\Cli::color('Are you sure? [yes/NO]', 'red')) !== 'yes')
        {
            die('Operation aborted');
        }

        $inst = self::get_widget_instance($inst_id);
        \Materia\Perm_Manager::clear_all_perms_for_object($inst->id, \Materia\Perm::INSTANCE);
        $result = $inst->db_remove();

        if ($result)
        {
            \Cli::write('Widget deleted.', 'green');
            exit(0);
        }

        \Cli::write('Deleting widget failed.', 'red');
        exit(1); // linux exit code 1 = error
    }

    public static function show_engines()
    {
        $engines = \DB::select()
                ->from('widget')
                ->order_by('name')
                ->execute()
                ->as_array();

        foreach ($engines as $engine)
        {
            \Cli::write(
                \Cli::color(str_pad($engine['id'], 3, ' ', STR_PAD_LEFT).' : ', 'green').\Cli::color($engine['name'], 'yellow')
            );
        }
    }

    private static function search_for_user()
    {
        while (true)
        {
            $input = \Cli::prompt('Search for user (name/login)');
            if ($input == '')
            {
                if (\Cli::prompt('Exit?', ['y', 'n']) === 'y')
                {
                    exit();
                }
            }
            else
            {
                $result = \Model_User::find_by_name_search($input);
                if (count($result) === 0)
                {
                    \Cli::write('No matching users found.');
                }
                elseif (count($result) === 1)
                {
                    \Cli::write('Found:');
                    \Cli::write(self::print_user($result[0]));
                    if (\Cli::prompt('Accept this result?', ['y', 'n']) === 'y')
                    {
                        return $result[0];
                    }
                }
                else
                {
                    \Cli::write('Found multiple:');
                    $user_map = [];
                    for ($i = 0; $i < count($result); $i++)
                    {
                        $user_map[$result[$i]->id] = $result[$i];
                        \Cli::write(self::print_user($result[$i]));
                    }
                    $input2 = \Cli::prompt('Which?');
                    if ( ! is_numeric($input2) || ! isset($user_map[(int)$input2]))
                    {
                        \Cli::write('Invalid input, try again.');
                        exit(1); // linux exit code 1 = error
                    }
                    else
                    {
                        return $user_map[(int)$input2];
                    }
                }
            }
        }
    }

    public static function extract_from_config()
    {
        $widgets = \Config::get('widgets');
        foreach ($widgets as $index => $w)
        {
            static::extract_from_url_without_install($w['package'], $w['checksum'], $w['id']);
        }
    }

    // This function will verify and extract the widget files without installing
    // This is primarily used to deposit expanded widgets into a production Docker Container
    public static function extract_without_install(int $id, string $package_path): void
    {
        $success = \Materia\Widget_Installer::extract_package_files($package_path, $id);
        \Cli::write('Widget '.($success ? 'installed' : 'not installed'));
        if ($success !== true) exit(1); // linux exit code 1 = error
    }

    // This function will verify and extract the widget files without installing
    // This is primarily used to deposit expanded widgets into a production Docker Container
    public static function extract_from_url_without_install(string $package_url, string $checksum_url, int $id): void
    {
        $local_package = static::download_package($package_url);
        $local_checksum = static::download_package($checksum_url);
        $valid = static::validate_checksum($local_package, $local_checksum);

        if ($valid)
        {
            $success = \Materia\Widget_Installer::extract_package_files($local_package, $id);
            \Cli::write('Widget '.($success ? 'installed' : 'not installed'));
            if ($success !== true) exit(1); // linux exit code 1 = error
        }
    }

    private static function print_user($user)
    {
        return $user->id.':'.$user->username." - '".$user->first.' '.$user->last."' [".$user->email.']';
    }

    private static function get_widget_instance($inst_id, $load_qset = false)
    {
        $inst = new \Materia\Widget_Instance();
        $inst->db_get($inst_id, $load_qset);
        return $inst;
    }

    private static function write($message = false, $error = false, $exception = false)
    {
        if ($message)
        {
            if ($error)
            {
                \Cli::error($message);
            }
            else
            {
                \Cli::write($message);
            }
        }

        if ($exception)
        {
            throw new \Exception("Error: $message");
        }
    }

    public static function export_qset($inst_id)
    {
        $preserve_ids = \Cli::option('preserve-ids');

        $inst = \Materia\Widget_Instance_Manager::get($inst_id, true);

        if ( ! $preserve_ids)
        {
            $inst->qset->data = self::strip_qset($inst->qset->data);
        }

        $qset_yaml = \Format::forge($inst->qset->data)->to_yaml();

        \Cli::write($qset_yaml);
        exit(1);
    }

    /**
     * Removes ids from a qset
     *
     * @param object $qset The qset to strip
     * @param array $excluded_types List of materiaTypes to exclude (i.e. 'asset')
     * @param array $excluded_keys List of keys to avoiding stripping (i.e. 'option')
     */
    protected static function strip_qset($qset, $excluded_types = [], $excluded_keys = ['option'])
    {
        $inception = function(&$input, $method, $excluded_types, $excluded_keys){
            foreach ($input as $key => &$value)
            {
                if (in_array($key, $excluded_keys))
                {
                    continue;
                }
                if (isset($value['materiaType']) && in_array($value['materiaType'], $excluded_types))
                {
                    continue;
                }

                if ($value === '')
                {
                    unset($input[$key]);
                }
                elseif ($key === 'id' || $key === 'user_id' || $key === 'created_at')
                {
                    unset($input[$key]);
                }
                elseif (is_array($value) || is_object($value))
                {
                    if (is_array($value) && empty($value)) unset($input[$key]);
                    else $method($value, $method, $excluded_types, $excluded_keys);
                }
            }

        };

        $inception($qset, $inception, $excluded_types, $excluded_keys);
        return $qset;
    }
}
'''
