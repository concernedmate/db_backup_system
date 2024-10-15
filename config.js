const { SystemEntity, MySQLConfig, SSHConfig } = require('./entities')
const callbacks = require('./callbacks')

/**
 * @type {SystemEntity[]}
 */
const system_configs = [
    new SystemEntity({
        system_name: "example",
        type: 'SSH',
        callback: callbacks.executeScript("echo :bak"),
        mysql_config: new MySQLConfig({
            user: 'example_uid',
            password: 'example_pw',
            database: 'example_db',
            host: 'example',
            port: '3306'
        }),
        ssh_config: new SSHConfig({
            ssh_key_path: "path\\to\\your\\ssh\\key",
            mysqldump_path: 'path\\to\\your\\mysqldump',
            ssh_host: 'user@host.com',
            port: 22
        })
    })
]

module.exports = { system_configs }