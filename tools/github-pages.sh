#!/bin/bash

git checkout --orphan gh-pages
git rm -rf .
git checkout master -- ghpages
mv ghpages/* .
rmdir ghpages/
echo "node_modules" > .gitignore
git add .
git commit -am "CREATE GitHub pages for the project"
git push origin gh-pages
git checkout master
git clone git://github.com/dmj/iotagent-lwm2m-lib.git site
cd site
git checkout gh-pages

