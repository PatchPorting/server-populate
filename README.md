# server-populate

[![Build Status](https://travis.ibm.com/PatchPorting/server-populate.svg?token=GMH4xFrA9iezVJKqw2zH&branch=master)](https://travis.ibm.com/PatchPorting/server-populate)

Microservice to populate the database of the Patch porting project in a regular basis:

- Continuos new patch monitoring. Source file: svn://scm.alioth.debian.org/svn/secure-testing/data/CVE/list
- Patch download.
- Hunks creation from patches.
- Hunks serve.

## Install

- Install the last [Node.js](https://nodejs.org/download) stable version.
- Get a copy of the code and install the dependencies.

```sh
git clone git@github.ibm.com:PatchPorting/server-populate.git
cd server-populate
npm i
```

## Use

```sh
npm start
```

## Developer guide

Please check [this link](https://github.com/IBMResearch/backend-development-guide) before a contribution.

## Deploy

bx app push -b https://github.com/cloudfoundry-incubator/multi-buildpack#v0.1.1 patchport-populate
bx app push -b https://github.com/cloudfoundry-incubator/multi-buildpack#v0.1.1 patchport-populate-develop
