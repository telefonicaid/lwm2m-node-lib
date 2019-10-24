# Contribution Guidelines

## Overview
Being an Open Source project, everyone can contribute, provided that it respect the following points:
* Before contributing any code, the author must make sure all the tests work (see below how to launch the tests). 
* Developed code must adhere to the syntax guidelines enforced by the linters.
* Code must be developed following the branching model and changelog policies defined below.
* For any new feature added, unit tests must be provided, following the example of the ones already created.

In order to start contributing:
1. Fork this repository clicking on the "Fork" button on the upper-right area of the page.
2. Clone your just forked repository:
```
git clone https://github.com/your-github-username/lwm2m-node-lib.git
```
3. Add the main lwm2m-node-lib repository as a remote to your forked repository (use any name for your remote 
repository, it does not have to be lwm2m-node-lib, although we will use it in the next steps):
```
git remote add lwm2m-node-lib https://github.com/telefonicaid/lwm2m-node-lib.git
```

Before starting contributing, remember to synchronize the `master` branch in your forked repository with the `master` 
branch in the main lwm2m-node-lib repository, by following this steps

1. Change to your local `master` branch (in case you are not in it already):
```
  git checkout master
```
2. Fetch the remote changes:
```
  git fetch lwm2m-node-lib
```
3. Merge them:
```
  git rebase lwm2m-node-lib/master
```

Contributions following this guidelines will be added to the `master` branch, and released in the next version. The 
release process is explaind in the *Releasing* section below.


## Branching model
There is a special branch in the repository: `master`. It contains the last stable development code. New features and bug fixes are always merged to `master`.

In order to start developing a new feature or refactoring, a new branch should be created with name `task/<taskName>`.
This branch must be created from the current version of the `master` branch. Once the new functionality has been
completed, a Pull Request will be created from the feature branch to `master`. Remember to check both the linters
and the tests before creating the Pull Request.

Bug fixes work the same way as other tasks, with the exception of the branch name, that should be called `bug/<bugName>`.

In order to contribute to the repository, these same scheme should be replicated in the forked repositories, so the 
new features or fixes should all come from the current version of `master` and end up in `master` again.

All the `task/*` and `bug/*` branches are temporary, and should be removed once they have been merged.

There is another set of branches called `release/<versionNumber>`, one for each version of the product. This branches
point to each of the released versions of the project, they are permanent and they are created with each release.

## Changelog
The project contains a version changelog, called CHANGES_NEXT_RELEASE, that can be found in the root of the project.
Whenever a new feature or bug fix is going to be merged with `master`, a new entry should be added to this changelog.
The new entry should contain the reference number of the issue it is solving (if any). 

When a new version is released, the changelog is cleared, and remains fixed in the last commit of that version. The
content of the changelog is also moved to the release description in the Github release.

## Releasing
The process of making a release consists of the following steps:
1. Create a new task branch changing the development version number in the package.json (with a sufix `-next`), to the
new target version (without any sufix), and PR into `master`.
2. Create a release branch from the last version of `master` named with the version number.
3. Create a tag from `release/x.y.0` named with the version number and push it to the repository.
4. Create the release in Github, from the created tag. In the description, add the contents of the Changelog.
6. Create a new task for preparing the next release, adding the sufix `-next` to the current version number (to signal
this as the development version).
