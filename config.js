var config = {};

// Configuration of the LWTM2M Server
//--------------------------------------------------
config.server = {
    port: 60001                         // Port where the server will be listening
};

// Configuration of the LWTM2M Client
//--------------------------------------------------
config.client = {
    port: 5631                          // Port where the client will be listening
}

module.exports = config;