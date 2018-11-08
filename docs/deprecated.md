# Deprecated functionality

Deprecated features are features that lwm2m-node-lib stills support but that are
not maintained or evolved any longer. In particular:

-   Bugs or issues related with deprecated features and not affecting
    any other feature are not addressed (they are closed in github.com
    as soon as they are spotted).
-   Documentation on deprecated features is removed from the repository documentation.
    Documentation is still available in the documentation set associated to older versions
    (either in the repository release branches or the pre-0.23.0 documentation in the FIWARE wiki).
-   Deprecated functionality is eventually removed from lwm2m-node-lib. Thus you
    are strongly encouraged to change your implementations using lwm2m-node-lib
    in order not rely on deprecated functionality.

A list of deprecated features and the version in which they were deprecated follows:

* Support to Node.js v4 in lwm2m-node-lib 1.1.0.

## Using old lwm2m-node-lib versions

Although you are encouraged to use always the newest lwm2m-node-lib version, take into account the following
information in the case you want to use old versions:

* Code corresponding to old releases is
  available at the [lwm2m-node-lib github repository](https://github.com/telefonicaid/lwm2m-node-lib). Each release number
  (e.g. 0.23.0) has associated the following:
	* A tag, e.g. `0.23.0`. It points to the base version.
	* A release branch, `release/0.23.0`. The HEAD of this branch usually matches the aforementioned tag. However, if some
    hotfixes were developed on the base version, this branch contains such hotfixes.

The following table provides information about the last lwm2m-node-lib version supporting currently removed features:

| **Removed feature**                                                        | **Last lwm2m-node-lib version supporting feature** | **That version release date**   |
|----------------------------------------------------------------------------|-------------------------------------------|---------------------------------|
| Support to Node.js v4                                                      | 1.0.0                                     | July 12th, 2018                  |