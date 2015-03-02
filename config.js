var config = {};

// Configuration of the LWTM2M Server
//--------------------------------------------------
config.server = {
    port: 5683,                         // Port where the server will be listening
    udpWindow: 100,
    defaultType: 'Device',
    logLevel: 'FATAL',
    serverProtocol: 'udp6'
};

// Configuration of the LWTM2M Client
//--------------------------------------------------
config.client = {
    //lifetime: '85671',
    lifetime: '60',
    version: '1.0',
    logLevel: 'FATAL',
    observe: {
        period: 3000
    },
    ipProtocol: 'udp6'
};

config.clientProtocol = 'udp6';

module.exports = config;
