---
layout: page
title: Contributing Code
tagline: How to contribute to Materia
class: developers
---
{% include JB/setup %}

# Mindset #

We open sourced Materia so that the world can use this great tool we've invested so much time into.  We thoroughly encourage community contributions, but keep in mind we still have a vision for where Materia is headed.  From time to time great ideas just won't fit with the goals of Materia and we will have to exclude them. If this happens to be some of your work, don't take our rejection as a negative response. We respect and recognize the effort put forth by all contributors. We have nothing but gratitude for you guys/gals.

# Code Formatting and Style #

Materia follows a our [Style Guide](style-guide.html) religiously. Follow it.

# Stay Connected #
Check out [Platform Community]({{BASE_PATH}}/develop/platform-community.html) for more information on getting in touch and getting help from other developers.

# Git Work-flow #

Materia follows the **Fork &amp; Pull Request** model of shared development, so any code that you contribute will be done via a pull request on Github. If you're not familiar with these topics then take a few minutes to read [Using Pull Requests](https://help.github.com/articles/using-pull-requests).

## Quick Do's and Don't's ##

* **Don't develop directly on master branches.** Always create a development branch specific to your task or issue.  The master branch is considered sacred, and can only be updated by the project managers.  When your development is complete, issue a pull request.

* **Name your branch appropriately.** If you decide to work on another issue mid-stream, create a new branch.  Keep in mind a single development branch should represent changes related to a single topic. If you decide to work on another issue, create another branch.
 * Create an issue for everything.  Consider it our way of tracking tasks, features, and bugs.
 * Issues should use *issue/999-description*. EX: if you're working on Issue #100, a retweet bugfix, your development branch should be called "issue/100-retweet-bugfix"

* **Squash your issue branch** when you're finished.  This can be accomplished via a merge --squash or an interactive rebase.

* **Don't commit your configuration files**, logs, or throwaway test files to your GitHub repo. These files can contain information you wouldn’t want publicly viewable, and may only pertain to you.

* **Review the files you're committing.** You should carefully review the files you have modified and added before staging them and committing them to your repo. It is usually a bad idea to use "git add .". Carefully add only the files that should be in the repository.

## Step by Step Guide ##

0. Clone the GitHub Repository
0. Create new branch for your issue
0. Develop on your branch (git add, git commit)
0. Push (if needed) for backup or collaboration purposes
0. Fetch from origin to update your clone's entire database (git fetch origin)
0. Finalize your branch by rebasing or merging in changes from the parent dev or master branch.
0. Test test test
0. Test test test
0. Commit (referencing the issue number) and push to the remote
0. Submit a Pull Request

## Cloning the Repository ##

	$ git clone git@github.com:ucfcdl/repository-name.git

## Creating your Branch ##

	$ git checkout -b issue/55-feature-name

## Pushing your Branch ##

On the first push, you'll want to use -u to make this a tracked branch.

	$ git push -u origin issue/55-feature-name

From that point on you'll have a tracked branch, which is automatically linked with the remote branch of the same name.  You can use the shortened version, your branch and the origin are assumed.

	$ git push

## Your branch: Merge or rebase to get updates ##

	$ git fetch origin
	$ git rebase origin/master

<aside>
	Rebasing can be cleaner if you're the only developer working on this branch
</aside>

If not, then use merge to get updates

	$ git fetch origin
	$ git merge origin/dev/ifrit

## Closing your Issue Branch: Squash Merge ##

We don't care about the little details, so we'll squash all of your incremental commits into a single commit that describes all the changes.  You could have rebased or merged anything you like into your issue branch prior to this step.  Here's the workflow we'll go through to collect your contributions.

	$ git fetch origin
	$ git checkout dev/branch-name
	$ git pull --rebase
	# Rebasing usually will work well for you, but if you run into problems try a simple merge via "git pull"
	$ git merge --squash issue/55-adding-user-profiles
	# the changes appear in your working tree - there is no commit
	# so carefully go through, test, and verify everything is clean and happy
	$ git add -u
	$ git commit
	# commit first line should look like "#55 Added user Profiles", followed by verbose change descriptions
	$ git push

## Commit Messages ##

The first line must be short, sweet, and encompassing.  Think of it as the title to your commit.  Add details about your changes to the following lines in the commit message

After squashing your commits, the first line must address your branch's purpose.  This will make sure the history log properly describes the changes in your commit.

	6b73cded263655edf5aa4903aef73904550b4eee #124: Login button updated for 508
	d139ac9c018e72d76248d5f7945027fb4b5a110b Feature: Stats Section Created
	59a772f5a8d780efc098811453785f6375794609 #421: 500 on update class association
	...
