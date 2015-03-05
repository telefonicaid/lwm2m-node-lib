var config = {};

// Configuration of the LWTM2M Server
//--------------------------------------------------
config.server = {
    port: 5683,                         // Port where the server will be listening
    udpWindow: 100,
    defaultType: 'Device',
    logLevel: 'FATAL',
    ipProtocol: 'udp6',
    serverProtocol: 'udp6'
};

// Configuration of the LWTM2M Client
//--------------------------------------------------
config.client = {
    lifetime: '85671',
    version: '1.0',
    logLevel: 'FATAL',
    observe: {
        period: 3000
    },
    ipProtocol: 'udp6',
    serverProtocol: 'udp6'
};

module.exports = config;
