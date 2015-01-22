var config = {};

// Configuration of the LWTM2M Server
//--------------------------------------------------
config.server = {
    port: 60001,                         // Port where the server will be listening
    defaultType: 'Device',
    logLevel: 'FATAL'
};

// Configuration of the LWTM2M Client
//--------------------------------------------------
config.client = {
    port: 5683,                          // Port where the client will be listening
    lifetime: '85671',
    version: '1.0',
    logLevel: 'FATAL',
    observe: {
        period: 3000
    }
}

module.exports = config;