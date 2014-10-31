# iotagent-lwm2m-lib

## Overview
The [Open Mobile Alliance Lightweight M2M protocol](http://openmobilealliance.org/about-oma/work-program/m2m-enablers/) is a machine to machine communication protocol built over [COAP](https://tools.ietf.org/html/draft-ietf-core-coap), and meant to
communicate resource constrained devices. The protocol defines two roles for the devices: a Lightweight M2M Client (the constrained device) and a Lightweight M2M Server (meant to consume the device data and control its execution).

This library aims to provide a simple way to build a Lightweight M2M Server with Node.js, giving an abstraction over the 
COAP Protocol based on function calls and handlers. The provided features are:
* Creation of a server listening to Client calls for the LWTM2M Interfaces, linked to handlers defined by the user.
* Registry of devices connected to the server (in-memory registry for the first version).
* Server calls to the registered devices in the registry (for Device Management Interface mostly).

## Usage
Note: as it is not yet published in npm repositories, this module has to be currently used as a github dependency in the package.json. To do so, add the following dependency to your package.json file, indicating the commit you want to use:

```
"iotagent-lwm2m-lib": "https://github.com/dmoranj/iotagent-lwm2m-lib/tarball/43664dd4b011673dd56d52b00d825cc3cf2ef679"
```

In order to use this library, first you must require it:
```
var lwtm2m = require('iotagent-lwm2m-lib');
```
As a Lightweight M2M Server, the library supports two kind of features, one for each direction of the communication: client-to-server and server-to-client. Each feature set is defined in the following sections.

### Listening features (client -> server)

#### Starting and stopping the server
To start the LWTM2M Server execute the following command:
```
lwtm2m.start(config, function(error) {
  console.log('Listening');
});
```
The config object contains all the information required to start the server (see its structure in the Configuration section below).

Only one server can be listening at a time in the library (is treated as a singleton), so multiple calls to 'start()' without a previous call to 'stop()' will end up in an error.

To stop the server, execute the following method:
```
lwtm2m.stop(function(error) {
  console.log('Server stopped');
});
```
No information is needed to stop the server, as there is a single instance per module.

#### Handling incoming messages
The server listens to multiple kinds incoming messages from the devices, described in the different LWTM2M Interfaces. For each operation of an interface that needs to be captured by the server, this library provides a handler that will have the opportunity to manage the event.

The following table lists the current supported events along with the expected signature of the handlers. Be careful with the handler signatures, as an interruption in the callbacks pipeline may hang up your server.

| Interface        | Operation              | Code                  | Signature            |
|:---------------- |:---------------------- |:--------------------- |:-------------------- |
| Registration     | Register               | registration          | fn(endpoint, lifetime, version, binding, callback) |
| Registration     | Update                 | unregistration        | fn(device, callback) |
| Registration     | De-register            | updateRegistration    | function(object, callback) |

The meaning of each parameter should be clear reading the operation description in OMA's documentation.

### Configuration
The configuration object should contain the following fields:
* `server.port`: port where the COAP server will start listening.

### Writing features (server -> client)
Each writing feature is modelled as a function in the LWTM2M module. The following sections describe the implemented features, identified by its Interface and name of the operation.

#### Device Management Interface: Write
Signature:
```
function write(deviceId, objectType, objectId, resourceId, value, callback)
```


#### Device Management Interface: Read
Signature:
```
function read(deviceId, objectType, objectId, resourceId, callback)
```


## Development documentation
### Project build
The project is managed using Grunt Task Runner.

For a list of available task, type
```bash
grunt --help
```

The following sections show the available options in detail.


### Testing
[Mocha](http://visionmedia.github.io/mocha/) Test Runner + [Chai](http://chaijs.com/) Assertion Library + [Sinon](http://sinonjs.org/) Spies, stubs.

The test environment is preconfigured to run [BDD](http://chaijs.com/api/bdd/) testing style with
`chai.expect` and `chai.should()` available globally while executing tests, as well as the [Sinon-Chai](http://chaijs.com/plugins/sinon-chai) plugin.

Module mocking during testing can be done with [proxyquire](https://github.com/thlorenz/proxyquire)

To run tests, type
```bash
grunt test
```

Tests reports can be used together with Jenkins to monitor project quality metrics by means of TAP or XUnit plugins.
To generate TAP report in `report/test/unit_tests.tap`, type
```bash
grunt test-report
```


### Coding guidelines
jshint, gjslint

Uses provided .jshintrc and .gjslintrc flag files. The latter requires Python and its use can be disabled
while creating the project skeleton with grunt-init.
To check source code style, type
```bash
grunt lint
```

Checkstyle reports can be used together with Jenkins to monitor project quality metrics by means of Checkstyle
and Violations plugins.
To generate Checkstyle and JSLint reports under `report/lint/`, type
```bash
grunt lint-report
```


### Continuous testing

Support for continuous testing by modifying a src file or a test.
For continuous testing, type
```bash
grunt watch
```


### Source Code documentation
dox-foundation

Generates HTML documentation under `site/doc/`. It can be used together with jenkins by means of DocLinks plugin.
For compiling source code documentation, type
```bash
grunt doc
```


### Code Coverage
Istanbul

Analizes the code coverage of your tests.

To generate an HTML coverage report under `site/coverage/` and to print out a summary, type
```bash
# Use git-bash on Windows
grunt coverage
```

To generate a Cobertura report in `report/coverage/cobertura-coverage.xml` that can be used together with Jenkins to
monitor project quality metrics by means of Cobertura plugin, type
```bash
# Use git-bash on Windows
grunt coverage-report
```


### Code complexity
Plato

Analizes code complexity using Plato and stores the report under `site/report/`. It can be used together with jenkins
by means of DocLinks plugin.
For complexity report, type
```bash
grunt complexity
```

### PLC

Update the contributors for the project
```bash
grunt contributors
```


### Development environment

Initialize your environment with git hooks.
```bash
grunt init-dev-env 
```

We strongly suggest you to make an automatic execution of this task for every developer simply by adding the following
lines to your `package.json`
```
{
  "scripts": {
     "postinstall": "grunt init-dev-env"
  }
}
``` 


### Site generation

There is a grunt task to generate the GitHub pages of the project, publishing also coverage, complexity and JSDocs pages.
In order to initialize the GitHub pages, use:

```bash
grunt init-pages
```

This will also create a site folder under the root of your repository. This site folder is detached from your repository's
history, and associated to the gh-pages branch, created for publishing. This initialization action should be done only
once in the project history. Once the site has been initialized, publish with the following command:

```bash
grunt site
```

This command will only work after the developer has executed init-dev-env (that's the goal that will create the detached site).

This command will also launch the coverage, doc and complexity task (see in the above sections).

