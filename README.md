# lwm2m-node-lib

[![Dependency Status](https://david-dm.org/telefonicaid/lwm2m-node-lib.png)](https://david-dm.org/telefonicaid/lwm2m-node-lib)

## Index

* [Overview](#overview)
* [Command line applications](#commandline)
* [Usage](#libraryusage)
* [Configuration](#configuration)
* [Development Documentation](#development)
 
## <a name="overview"/> Overview
The [Open Mobile Alliance Lightweight M2M protocol](http://openmobilealliance.org/about-oma/work-program/m2m-enablers/) is a machine to machine communication protocol built over [COAP](https://tools.ietf.org/html/draft-ietf-core-coap), and meant to
communicate resource constrained devices. The protocol defines two roles for the devices: a Lightweight M2M Client (the constrained device) and a Lightweight M2M Server (meant to consume the device data and control its execution).

This library aims to provide a simple way to build Lightweight M2M Servers and Clients with Node.js, giving an abstraction over the COAP Protocol based on function calls and handlers. 

Features provided by the server library:
* Creation of a COAP server listening for Client calls for the LWTM2M Interfaces, linked to handlers defined by the user.
* Registry of devices connected to the server (transient in-memory registry and persistent MongoDB based one).
* Server calls to the registered devices in the registry (Device Management Interface) to retrieve and write resource information and entity attributes.
* Subscriptions to changes in resource values (Information Management Interface), on change or timed (and subscription management).

Features provided by the client library:
* Functions for connecting and disconnecting from remote servers.
* Creation of a COAP server listening for commands issued from the LWM2M Server side linked to handlers defined by the user.
* Transient in-memory object registry, to store the current objects and instances along with their resource values and attributes. 
* Support for subscriptions from the server (using COAP Observe) both timed and on-change (both of them based in the values of the resources currently available in the registry).

The following table shows what operations are implemented and what operations pending from the defined interfaces:

| Interfaces                				| Operatio	   | Server status   |  Client status  |
| ----------------------------------------------------- | ---------------- | --------------- | --------------- |
| Bootstrap Interface       				| Any              | Not implemented | Not implemented |
| Client Registration Interface 			| Register         | Implemented     | Implemented     |
|        						| Update Register  | Implemented     | Implemented     |
|        						| De-register      | Implemented     | Implemented     |
| Device Management & Service Enablement Interface 	| Any         	   | Not implemented | Not implemented |
|        						| Read             | Implemented     | Implemented     |
|        						| Write            | Implemented     | Implemented     |
|        						| Create /x        | Not implemented | Not implemented |
|        						| Create /x/y      | Not implemented | Not implemented |
|        						| Delete /x/y      | Not implemented | Not implemented |
|        						| Discover /x      | Implemented     | Implemented     |
|        						| Discover /x/y    | Implemented     | Implemented     |
|        						| Discover /x/y/z  | Implemented     | Implemented     |
|        						| Write Attributes | Implemented     | Implemented     |
|        						| Execute          | Implemented     | Implemented     |
| Information Reporting Interface       		| Observe          | Implemented     | Implemented     |
|        						| Notify           | Implemented     | Implemented     |
|        						| Cancel           | Implemented     | Implemented     |

The library also provides command line clients to test both its client and server capabilities.

## <a name="commandline"/> Command line applications
The library provides two command line applications in order to help developing both Lightweight M2M clients and/or servers. This applications can be used to simulate the behavior of one of the peers of the communication. Both of them use the lwm2m-node-lib library to serve all the LWTM2M requests. The following sections explain the basic features of each one.

There are multiple ways of using the applications:

* You may clone the project in your computer, and execute `npm install` from the root of the project, in order to download the dependencies. You can start both applications from the same folder using different console windows.
* Another option is to install directly with `npm install -g lwm2m-node-lib`. This will install the library in the global `node_modules`.

Take into account that all the information loaded or registered by any of the applications is transient, so it will be lost once the processes have been stopped.

### Server Command Line Application
#### Description
This application simulates the use of a Lightweight M2M server. It provides commands to start and stop the server, manage and query the devices connected to the server, and perform read and write operations over the resources provided by each of the connected devices.

#### Usage
From the root of the project type (make sure the `npm install` command has been previously executed to download all the dependencies):
```
bin/iotagent-lwm2m-server.js
```
You can type `help` in the command line at any moment to get a full list of the available commands. 

All the server configuration is read from the `config.js` file in the root of the project. You can print the configuration that is actually being used using the `config` command.

To exit the command line client, use `CTRL-C`.

#### Command reference
```
start  

	Starts a new Lightweight M2M server listening in the prefconfigured port.

stop  

	Stops the current LWTM2M Server running.

list  

	List all the devices connected to the server.

write <deviceId> <resourceId> <resourceValue>  

	Writes the given value to the resource indicated by the URI (in LWTM2M format) in the givendevice.

execute <deviceId> <resourceId> <executionArguments>  

	Executes the selected resource with the given arguments.

read <deviceId> <resourceId>  

	Reads the value of the resource indicated by the URI (in LWTM2M format) in the given device.

discover <deviceId> <objTypeId> <objInstanceId> <resourceId>  

	Sends a discover order for the given resource to the given device.

discoverObj <deviceId> <objTypeId> <objInstanceId>  

	Sends a discover order for the given instance to the given device.

discoverType <deviceId> <objTypeId>  

	Sends a discover order for the given resource to the given device.

observe <deviceId> <objTypeId> <objInstanceId> <resourceId>  

	Stablish an observation over the selected resource.

writeAttr <deviceId> <objTypeId> <objInstanceId> <resourceId> <attributes>  

	Write a new set of observation attributes to the selected resource. The attributes should be
	 in the following format: name=value(,name=value)*. E.g.: pmin=1,pmax=2.

cancel <deviceId> <objTypeId> <objInstanceId> <resourceId>  

	Cancel the observation order for the given resource (defined with a LWTM2M URI) to the given device.

config  

	Print the current config.
```
### Client Command Line Application
#### Description
This application simulates the use of a Lightweight M2M Client (typically a device or device hub). It provides the following features:
* Resource management: an internal resource registry lets the client create and update the objects and resources that will be exposed to the server. These resources will be affected by the `read` and `write` operations of the server. If there is an `Observe` command over any resource, it will be periodically reported to the observer. All this information is currently kept in memory, so it needs to be recreated if the client is restarted.
* Connection management: the client can connect, disconnect and update the connection to a remote Lightweight M2M Server. Each time the client is registered or its registration updated, the list of available objects is forwarded to the server.

#### Usage
From the root of the project type (make sure the `npm install` command has been previously executed to download all the dependencies):
```
bin/iotagent-lwm2m-client.js
```
You can type `help` in the command line at any moment to get a full list of the available commands. 

All the client configuration is read from the `config.js` file in the root of the project. You can print the configuration that is actually being used using the `config` command.

To exit the command line client, use `CTRL-C` or the `quit` command.

The command line client can also be used to execute scripts. Each line of the script is interpreted as a line in the command line. You have to take two things into account:
* The script is executed as an input to the client, line by line, and it will not end unless a `quit` command is explicitly issued. In that case, the client will end up in a prepaired state, with the prompt available to receive further commands.
* Currently, all the commands are executed asynchronously, so actions like connection and discconnection may rise errors if executed in the same script (as the disconnection could be exectued before the connection is completed).

The following is an example of script:
````
create /75001/2
create /75002/2
set /75001/2 0 440.81
set /75002/2 1 Connected
connect localhost 60001 PruebasDuplex /
quit
```

#### Command reference
```
create <objectUri>  

	Create a new object. The object is specified using the /type/id OMA notation.

get <objectUri>  

	Get all the information on the selected object.

remove <objectUri>  

	Remove an object. The object is specified using the /type/id OMA notation.

set <objectUri> <resourceId> <resourceValue>  

	Set the value for a resource. If the resource does not exist, it is created.

unset <objectUri> <resourceId>  

	Removes a resource from the selected object.

list  

	List all the available objects along with its resource names and values.

connect <host> <port> <endpointName> <url>  

	Connect to the server in the selected host and port, using the selected endpointName.

updateConnection  

	Updates the current connection to a server.

disconnect  

	Disconnect from the current server.

config  

	Print the current config.

quit  

	Exit the client.
```

## <a name="libraryusage"/> Usage
In order to use the library, add the following dependency to your package.json file:

```
"lwm2m-node-lib": "*"
```

In order to use this library, first you must require it:
```
var lwtm2m = require('lwm2m-node-lib');
```
As a Lightweight M2M Server, the library supports four groups of features, one for each direction of the communication: client-to-server and server-to-client (and each flow both for the client and the server). Each feature set is defined in the following sections.

### Server features (client -> server)

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

### Server features (server -> client)
Each writing feature is modelled as a function in the LWTM2M module. The following sections describe the implemented features, identified by its Interface and name of the operation.

#### Device Management Interface: Write
Signature:
```
function write(deviceId, objectType, objectId, resourceId, value, callback)
```
Execute a Write operation over the selected resource, identified following the LWTM2M conventions by its: deviceId, objectType, objectId and resourceId, changing its value to the value passed as a parameter. The device id can be found from the register, based on the name or listing all the available ones.

#### Device Management Interface: Execute
Signature:
```
function execute(deviceId, objectType, objectId, resourceId, arguments, callback)
```
Executes the resource identified following the LWTM2M conventions by its: deviceId, objectType, objectId and resourceId, with the arguments passed as a parameter. The device id can be found from the register, based on the name or listing all the available ones.

#### Device Management Interface: Read
Signature:
```
function read(deviceId, objectType, objectId, resourceId, callback)
```
Execute a read operation for the selected resource, identified following the LWTM2M conventions by its: deviceId, objectType, objectId and resourceId. The device id can be found from the register, based on the name or listing all the available ones.

### Client features 

#### Configuration
The LWM2M Client library has to be configured before any interaction with the remote LWM2M server. This configuration is done through the use of the `init()` function.
This function takes a configuration object (can be the same one passed to the server), that has a `client` attribute with the configuraiton for the client (as described
in the configuration section). Failing to do so may lead to unexpected results.

#### Registration
Before making any interaction with a Lightweight M2M server, a client must register to it. This registration can be done with the following function:
```
    lwm2mClient.register(host, port, endpointName, function (error, deviceInfo) {
	...
    });
```
The registration process needs the host and port of the destination server and an endpointName for the device (that must be unique for that server). The server will keep the client's IP in order to send the server-initiated requests. 

The callback of the register function returns all the information about the created connection. There are two important pieces of information in this object:
* `serverInfo`: includes all the information about the listening socket created in the client to attend server calls. It will be needed to stop the client completely.
* `location`: indicates the URL the client should use to communicate with the server (includes its client ID in the server).

When the client register to a server, it also opens a socket for listening in its machine, so to receive server-initiated requests (the port for listening can be configured in the `config` object).

The connection to the server can be closed using the following function:
```
    lwm2mClient.unregister(deviceInformation, function (error) {
	...
    })
```
If the client changes its IP for whatever reason, it must updates its registration in the server, by using the following function:
```
    lwm2mClient.update(deviceInformation, function (error) {
	...
    })
```

#### Object repository
All the information in a Lightweight M2M client is organized in objects and resources of those objects. To assist the client with the management of this information, the library provides a object repository (currently a in-memory transient repository only). This repository can be accessed in the `lwm2mClient.registry` attribute. 

The repository offers the standard CRUD operations over objects, and methods to set and unset resource values inside the objects. 

All the objects are identified by a URI that is composed of an Object ID and an Object Instance sepparated by slashes, as specified by the Lightweight M2M specification (e.g.: /1/3).

## <a name="configuration"/> Configuration
The configuration object should contain the following fields:
* `server.port`: port where the server's COAP server will start listening.
* `server.defaultType`: type that will be assigned to a device registering in the server if there is no other.
* `server.logLevel`: log level for the internal logger (could have any of the following values: DEBUG, INFO, ERROR, FATAL).
* `server.types`: in the case of multiple URLs, mapping between URL and type (see bellow [Configuring multiple southbound interfaces](#multipleinterfaces).
* `client.port`: port where the client's COAP server will start listening.
* `client.lifetime`: lifetime in miliseconds of the client registration. After that lifetime, the registration will be dismissed.
* `client.version`: version of the Lightweight M2M protocol. Currently `1.0` is the only valid option.
* `client.observe`: default parameters for resource observation (they can be overwritten from the server). 

### <a name="multipleinterfaces"/> Configuring multiple southbound interfaces
The Lightweight M2M Server library can be configured to accept registrations in multiple southbound paths (all of them sharing IP and Port). In this case, each device will be assigned a different root base for its requests (that will be returned in the `Location-path` option), and will be assigned a device type, that can be used to group devices.

The southbound interfaces can be configured in the `server.types` configuration parameter. This parameter is a list of objects composed of two attributes:
* `name`: name of the type that will be assigned to the device.
* `url`: url prefix used to identify the devices (take into account that the registration URL will be the concatenation of this value with the `/rd` standard registration path).

Devices that arrive to the global `/rd` registration path will be assigned the default type instead (configured in `server.defaultType` configuration attribute).

## <a name="development"/> Development documentation
### Contributions
All contributions to this project are welcome. Developers planning to contribute should follow the [Contribution Guidelines](./docs/contribution.md) 

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

