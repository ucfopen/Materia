---
layout: page
title: Code Style Guide
tagline: Formatting guide for contributing code
class: developers
---
{% include JB/setup %}

# Code style guide

Any code intended to be contributed into Materia should follow the Materia coding style guide. We recommend that you use our fork of the PHP Code Sniffer Fuel PHP Standard repository which will enforce our coding standards for any PHP code. If you develop with the Sublime Text 2 editor then you'll also want to get the PhpCS plugin which will display Code Sniffer warnings.

## PHP Style Guide by Example

Look at the comments in the example below which covers all of our PHP coding style guide rules:

<pre>
	<code>
	&lt;?php
	// (File names should be all lower case. Files should be in UTF-8 encoding.)
	// (Line endings should be Unix-style LF (\n, not \r\n).)

	// Class names capitalize each word and separate words with underscores:
	class My_Class
	{
	<span class="tab">	</span>// &lt;-- Indentation should be provided with tabs, not spaces

		// Constants should be written in ALL_UPPERCASE_WITH_UNDERSCORES:
		const DEFAULT_VALUE = 0;

		// Alignment should be provided with spaces and each variable
		// should be declared on it's own line:
		protected $x<span class="space">&middot;</span><span class="space">&middot;</span><span class="space">&middot;</span><span class="space">&middot;</span><span class="space">&middot;</span><span class="space">&middot;</span><span class="space">&middot;</span>= 5;
		protected $foo_bar<span class="space">&middot;</span>= false; // &lt;-- Variables should be in snake_case

		// Methods should always declare their visibility (public, protected, private)
		// and should be written in snake_case:
		public function is_zero($number)
		{
			$number = (int)$number; // Keywords (int, array, etc) should be lowercase

			// Control flow structures should provide a space between the keyword
			// and arguments (if, for, foreach, while, switch):
			if ($number == 0)
			{
				// Keywords like true, false, null, etc should also be lowercase:
				return true;
			}

			return false;
		}

		public function get_term_id($semester)
		{ // &lt;-- All braces should always be presented on their own line.
			$id = 0;

			switch ($semester)
			{
				// (Each case block is separated from each other by an empty line.)
				// Case statements are indented:
				case 'Fall 2012':
					$id = 1;
					break;

				case 'Spring 2013':
					$id = 2;
					break;
			}

			return $id;
		}

		public function do_something($number)
		{
			// ! should be surrounded by spaces:
			if ( ! $this->foo_bar)
			{
				// Provide spaces before and after logical and math operators:
				return $number + 5;
			}

			return 'hello'; // &lt;-- Always single quote strings if possible
		}
	}

	// Braces for empty classes should be touching and should exist on the same line
	// as the class definition:
	class My_Empty_Class {}

	// &lt;-- Closing &quot;?&gt;&quot; tag should be omitted
	</code>
</pre>


# Setting up PHP Code Sniffer #

PHP Code Sniffer will allow you to check your contributions for valid syntax while working on the Materia codebase.  Some editors, like Sublime Text, have plugins that can highlight Code Sniffer errors as you work.

## Installing php5.4 on OSX ##

### Install Homebrew

* Instructions from: http://mxcl.github.com/homebrew/
* run `ruby -e "$(curl -fsSkL raw.github.com/mxcl/homebrew/go)"`

### Download PHP 5.4.x Source Code

* http://www.php.net/downloads.php

### Install libjpeg and pcre

1. run `brew install libjpeg`
2. run `brew install pcre`

### Build PHP (OSX Lion)

1. unpacked php source anywhere
2. in the unpacked directory run:

<pre><code class='bash'>
./configure  \
--prefix=/usr  \
--mandir=/usr/share/man  \
--infodir=/usr/share/info  \
--sysconfdir=/private/etc  \
--with-apxs2=/usr/sbin/apxs  \
--enable-cli  \
--with-config-file-path=/etc  \
--with-libxml-dir=/usr  \
--with-openssl=/usr  \
--with-kerberos=/usr  \
--with-zlib=/usr  \
--enable-bcmath  \
--with-bz2=/usr  \
--enable-calendar  \
--with-curl=/usr  \
--enable-dba  \
--enable-exif  \
--enable-ftp  \
--with-gd  \
--enable-gd-native-ttf  \
--with-icu-dir=/usr  \
--with-iodbc=/usr  \
--with-ldap=/usr  \
--with-ldap-sasl=/usr  \
--with-libedit=/usr  \
--enable-mbstring  \
--enable-mbregex  \
--with-mysql=mysqlnd  \
--with-mysqli=mysqlnd  \
--without-pear  \
--with-pdo-mysql=mysqlnd  \
--with-mysql-sock=/var/mysql/mysql.sock  \
--with-readline=/usr  \
--enable-shmop  \
--with-snmp=/usr  \
--enable-soap  \
--enable-sockets  \
--enable-sysvmsg  \
--enable-sysvsem  \
--enable-sysvshm  \
--with-tidy  \
--enable-wddx  \
--with-xmlrpc  \
--with-iconv-dir=/usr  \
--with-xsl=/usr  \
--enable-zip  \
--with-pcre-regex  \
--with-pgsql=/usr  \
--with-pdo-pgsql=/usr \
--with-freetype-dir=/usr/X11 \
--with-jpeg-dir=/usr  \
--with-png-dir=/usr/X11
</code></pre>

2. Run `sudo make install`
3. If /etc/php.ini doesnt exist run `cp /etc/php.ini.default /etc/php.ini`
4. Add the following to the bottom of the `/etc/php.ini`

<pre><code class='bash'>
;***** Added by go-pear
include_path=".:/usr/share/pear"
;****
</code></pre>

5. Verify php version `php -v`

### Build PHP on OSX (Mountain Lion)

1. unpacked php source anywhere
2. in the unpacked directory run:

<pre><code class='bash'>
./configure \
--prefix=/usr \
--mandir=/usr/share/man \
--infodir=/usr/share/info \
--sysconfdir=/private/etc \
--with-apxs2=/usr/sbin/apxs \
--enable-cli \
--with-config-file-path=/etc \
--with-libxml-dir=/usr \
--with-openssl=/usr \
--with-kerberos=/usr \
--with-zlib=/usr \
--enable-bcmath \
--with-bz2=/usr \
--enable-calendar \
--disable-cgi \
--with-curl=/usr \
--enable-dba \
--enable-exif \
--enable-fpm \
--enable-ftp \
--with-gd \
--with-freetype-dir=/user/X11 \
--with-jpeg-dir=/usr \
--with-png-dir=/user/X11 \
--enable-gd-native-ttf \
--with-icu-dir=/usr \
--with-iodbc=/usr \
--with-ldap=/usr \
--with-ldap-sasl=/usr \
--with-libedit=/usr \
--enable-mbstring \
--enable-mbregex \
--with-mysql=mysqlnd \
--with-mysqli=mysqlnd \
--without-pear \
--with-pdo-mysql=mysqlnd \
--with-mysql-sock=/var/mysql/mysql.sock \
--with-readline=/usr \
--enable-shmop \
--with-snmp=/usr \
--enable-soap \
--enable-sockets \
--enable-sysvmsg \
--enable-sysvsem \
--enable-sysvshm \
--with-tidy \
--enable-wddx \
--with-xmlrpc \
--with-iconv-dir=/usr \
--with-xsl=/usr \
--enable-zip \
--with-pcre-regex \
--with-pgsql=/usr \
--with-pdo-pgsql=/usr
</code></pre>

2. Run `sudo make install`
3. If /etc/php.ini doesnt exist run `cp /etc/php.ini.default /etc/php.ini`
4. Add the following to the bottom of the `/etc/php.ini`

<pre><code class='bash'>
;***** Added by go-pear
include_path=".:/usr/share/pear"
;****
</code></pre>
5. Verify php version `php -v`

### Setup Pear

1. run `cd /usr/local`
3. run `curl http://pear.php.net/go-pear.phar > blah.php`
2. run *Using the table below* `sudo php blah.php`


<pre><code class='bash'>
1. Installation base ($prefix)                   : /usr
2. Temporary directory for processing            : /tmp/pear/install
3. Temporary directory for downloads             : /tmp/pear/install
4. Binaries directory                            : /usr/bin
5. PHP code directory ($php_dir)                 : /usr/share/pear
6. Documentation directory                       : /usr/lib/php/docs
7. Data directory                                : /usr/lib/php/data
8. User-modifiable configuration files directory : /usr/lib/php/cfg
9. Public Web Files directory                    : /usr/lib/php/htdocs
10. Tests directory                              : /usr/lib/php/tests
11. Name of configuration file                   : /private/etc/pear.conf
</code></pre>

3. After your done remove the pear installer `rm /usr/local/blah.php`

### Check Pear Conifg

1. run `pear config-show`
2. verify that the directories listed match the directories set by the previous step, if not you may need to delete or reset your `User Configuration File`

### Install PHP CodeSniffer

1. run `sudo pear install PHP_CodeSniffer`

### Download Materia's PHP Code Sniffer rules

1. Determine where you wish to checkout the code sniffer repo to (anywhere?)
2. clone the code sniffer rules `git clone https://github.com/ucfcdl/fuelphp-phpcs`

### Installing PHPCS into Sublime Text

1. Install Package Control for Sublime Text: http://wbond.net/sublime_packages/package_control/installation
2. Using Package Control install `PHPcs`
3. Optionally turn off the CodeSniffer popup by setting `"phpcs_show_quick_panel": false`
4. Configure PHPcs Sublime Text 2 &gt; Preferences &gt; Package Settings &gt; PHP Code Sniffer &gt; Settings - Default, set --standard to the FuelPHP standard in the above cloned repo:

<pre><code class='bash'>
"phpcs_additional_args": {
	"--standard": "/dir_to_your/repo/fuelphp-phpcs/Standards/FuelPHP"
}
</code></pre>

### Quick Test

<pre><code class='bash'>
# make a simple php file that has issues
echo &quot;&lt;?php if($stuff){ return FALSE;}&quot; &gt; test.php
# run the code sniffer with our rule set
phpcs test.php
</code></pre>

Correct working output:

<pre><code class='bash'>
FILE: /path/to/test.php
--------------------------------------------------------------------------------
FOUND 5 ERROR(S) AFFECTING 1 LINE(S)
--------------------------------------------------------------------------------
 1 | ERROR | Missing file doc comment
 1 | ERROR | Expected &quot;if (...) {\n&quot;; found &quot;if(...){ return FALSE;&quot;
 1 | ERROR | There must be a single space between the closing parenthesis and
   |       | the opening brace of a multi-line IF statement; found 0 spaces
 1 | ERROR | TRUE, FALSE and NULL must be lowercase; expected &quot;false&quot; but found
   |       | &quot;FALSE&quot;
 1 | ERROR | Closing brace must be on a line by itself
--------------------------------------------------------------------------------
</code></pre>