# Contributing to Materia

Materia is an open-source project created and maintained by the [University of Central Florida's Center for Distributed Learning](https://cdl.ucf.edu/) and its [Techrangers](https://techrangers.cdl.ucf.edu/) team. We appreciate your interest in contributing: Materia would be nothing without the passion, dedication, and vision of its many contributors over the years. Below are guidelines we expect prospective contributors to abide by.

## Issues, Bug Reports, and Feature Requests

Be sure to peruse the list of [open issues](https://github.com/ucfopen/Materia/issues) and [pull requests](https://github.com/ucfopen/Materia/pulls) before submitting a bug report or feedback, to ensure the bug or issue you identified has not already been reported by someone else, or already addressed in a PR.

Please keep in mind that feedback or feature requests submitted as issues are not guaranteed to be worked on. The Materia team has the ultimate authority to determine what will or will not make it in to the codebase.

#### Issues Related to Widgets

Please bear in mind that the Materia repository represents the codebase for the Materia _platform_, but does not contain any of the widgets installed to the system. Most first-party widgets are open source as well, and issues (as well as feedback and feature requests) should be submitted in the repository for the widget itself. Visit the [UCFOpen](https://github.com/ucfopen) GitHub page and search for the widget(s) in question to find them. If you cannot find the repository for a specific widget, we recommend visiting the [UCFOpen Slack Discussion](https://dl.ucf.edu/join-ucfopen/) and bringing up your question in the `#materia` channel.

## How to Contribute

Before making any code commits to Materia, you should [fork the repository](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project) on GitHub and push changes to your fork. External contributors cannot push code changes directly to the UCFOpen repository or any of its branches. Generally, we advise the following workflow for code contributions to Materia or any of its widget repositories:

1. Choose an issue to work on, or submit a new one.
2. Fork the Materia (or widget) repository.
3. Create an issue branch. We prefer the following branch naming convention: `<issue_number>/stub-describing-the-issue`. For example, `1234/add-wobble-mode`.
4. Make the code changes necessary to resolve the issue.
5. Test the code in your own environment and ensure it passes the test suites.
6. Commit and push the code to your fork.
7. Create a pull request back to the `ucfopen/Materia` (or widget) repository.
8. Write a description of what you did in the description field.
9. Link the pull request to the issue.
10. Pay attention to the pull request and respond to any questions others have about it. It may take a few back-and-forth communications and changes for your pull request to be approved and merged.

Keep in mind that code submitted as a pull request is not guaranteed to be merged. Producing quality code that addresses a clear bug, deficit, or issue, and communicating effectively over the course of the PR's review process will give your work the best chance of approval.

## Branching and Versioning

Generally, we maintain branches as follows:

#### Master

The master branch represents the most up-to-date, stable version of Materia. We do not at present maintain specific `stable` branches, but rather, commits on `master` will be tagged for release using [Semantic Versioning](https://semver.org/). A commit tagged with a version represents a production-ready release. Releases are also published on our [Releases Page](https://github.com/ucfopen/Materia/releases) as well as the [GitHub package registry](https://github.com/ucfopen/Materia/pkgs/container/materia).

### Dev Branches

Dev branches represent working branches for specific upcoming releases. Generally, these are are `MAJOR` or `MINOR` version releases, with `PATCH` versions reserved for hotfixes. As soon as a dev branch is merged into `master` and tagged for release, a new dev branch is spun up for the next expected version release. For example, `dev/10.0.0` was the dev branch associated with the `v10.0.0` version of Materia released in October 2023. Following that, `dev/10.1.0` became the next dev branch, then `dev/10.2.0`, etc.

### Issue, Feature, and Hotfix Branches

As mentioned under the How to Contribute section, we generally prefer issue branches are formatted as follows: `<issue_number>/stub-describing-the-issue`. For example, `1234/add-wobble-mode`.

Some major additions may not have a specific issue they fall under. These can be prepended by `feature`, such as `feature/add-wobble-mode`. Similarly, hotfixes are often named with the `hotfix/` prefix, such as `hotfix/wobble-mode-too-wobbly`.

### Alpha and RC Releases

As a dev branch matures towards release, commits will be tagged as `alpha` or `rc` (Release Candidate) versions. Alpha tags should be considered semi-stable and are not suitable for production use. Release candidate builds are expected to be stable or mostly stable, but have not yet been upgraded to full releases. Alpha and RC tags should conform to semver: `v1.1.0-alpha.1` or `v1.1.2-rc.1`, etc. Note that not every dev branch will have alpha or release candidate versions. Tags should always be signed (`git tag -s ...`) to ensure trust.

## License

Materia is published under the [AGPL-3.0](https://github.com/ucfopen/Materia?tab=AGPL-3.0-1-ov-file#readme) license, and code contributions, forks, and derivatives are expected to conform to the spirit and letter of the license. Contributors to AGPL-3.0 projects should be aware of the following:

#### Contribution Licensing:

Contributors who submit modifications or additions to the software must do so under the AGPL-3.0, ensuring that all contributions remain free and open.

#### Distribution of Modified Versions:

When distributing modified versions, contributors must provide access to the source code of their modifications. This can be done by providing a written offer or a direct link to the source code.

#### Interaction Over a Network:

If contributors use the software to provide a service over a network (e.g., a web application), they must ensure that users can access the source code of the service, including any modifications.

#### Patent Provisions:

Contributors grant a patent license to users, protecting them from patent claims related to the use of the software. This encourages a collaborative environment without the threat of patent litigation.

#### License Compatibility and Mixing Code:

Contributors can mix AGPL-3.0 licensed code with GPL-3.0 licensed code, allowing for flexibility in combining different free software projects.