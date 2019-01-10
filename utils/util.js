module.exports = {
    getEnv:function (key, value) {
        return process.env[key] ? process.env[key]: value
    }

};