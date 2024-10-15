class SystemEntity {
    /**
     * 
     * @param {{ 
     *  type: 'CONN' | 'SSH', 
     *  mysql_config: MySQLConfig, 
     *  ssh_config: SSHConfig, 
     *  system_name: string,
     *  callback?: (file: string)=>{} 
     * }} object 
     */
    constructor(object = { type: null, mysql_config: null, ssh_config: null, system_name: null, callback: null }) {
        try {
            if (object.system_name == null || object.type == null) { throw new Error("Null object property") }
            if (object.mysql_config == null) { throw new Error("Null object property") }

            this.mysql_config = object.mysql_config
            this.system_name = object.system_name
            this.type = object.type
            this.callback = object.callback
            if (object.type == 'SSH') {
                if (object.ssh_config == null) { throw new Error("Null object property") }
                this.ssh_config = object.ssh_config
            }
        } catch (error) {
            console.log("Invalid config on one or more system!", error.message)
            process.exit()
        }
    }
}

class SSHConfig {
    /**
     * 
     * @param {{ ssh_key_path: string, mysqldump_path: string, ssh_host: string, port: number }} object 
     */
    constructor(object = { ssh_key_path: null, mysqldump_path: null, ssh_host: null, port: null }) {
        try {
            if (object.mysqldump_path == null || object.ssh_host == null || object.ssh_key_path == null) { throw new Error("Null object property") }
            this.mysqldump_path = object.mysqldump_path
            this.ssh_key_path = object.ssh_key_path
            this.ssh_host = object.ssh_host
            this.port = object.port
        } catch (error) {
            console.log("Invalid config on one or more system!")
            process.exit()
        }
    }
}

class MySQLConfig {
    /**
     * 
     * @param {{ user: string, password: string, database: string, host: string, port: number }} object 
     */
    constructor(object = { user: null, password: null, database: null, host: null, port: null }) {
        try {
            if (object.user == null, object.password == null, object.database == null, object.host == null, object.port == null) { throw new Error("Null object property") }
            this.user = object.user
            this.password = object.password
            this.database = object.database
            this.host = object.host
            this.port = object.port
        } catch (error) {
            console.log("Invalid config on one or more system!", error.message)
            process.exit()
        }
    }
}

module.exports = { SystemEntity, MySQLConfig, SSHConfig }