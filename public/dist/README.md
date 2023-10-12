# Materia Widget Dependencies

This package is intended for use by [Materia](https://github.com/ucfopen/Materia), an open-source platform for interactive educational games and tools developed by the University of Central Florida.

With Materia 10.0 and the conversion from AngularJS to React, the **Materia-Server-Client-Assets** repo is deprecated, but the Materia Widget Development Kit still requires access to certain CSS and JS assets from the main repo. This package contains those assets.

### Publishing New Versions

This widget uses the `workflow_dispatch` event to publish new versions through GitHub Actions. No inputs are required. The action is configured to be publish the package to NPM, and as such, the `NPM_TOKEN` value must be available in the repository's secrets. If the `workflow_dispatch` option is unavailable, you can use GitHub CLI to run the workflow manually via:

```
gh workflow run publish_widget_dependencies.yml
```

If on a branch other than master, you can additionally specify the branch in the command:

```
gh workflow run publish_widget_dependencies.yml --ref <branch name>
```
