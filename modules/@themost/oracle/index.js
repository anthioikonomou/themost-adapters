'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OracleFormatter = exports.OracleAdapter = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * MOST Web Framework 2.0 Codename Blueshift
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *                     Anthi Oikonomou anthioikonomou@gmail.com
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Use of this source code is governed by an BSD-3-Clause license that can be
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * found in the LICENSE file at https://themost.io/license
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


exports.createInstance = createInstance;

var _oracledb = require('oracledb');

var oracledb = _interopRequireDefault(_oracledb).default;

var _async = require('async');

var async = _interopRequireDefault(_async).default;

var _util = require('util');

var util = _interopRequireDefault(_util).default;

var _lodash = require('lodash');

var _ = _lodash._;

var _formatter = require('@themost/query/formatter');

var SqlFormatter = _formatter.SqlFormatter;

var _query = require('@themost/query/query');

var QueryExpression = _query.QueryExpression;
var QueryField = _query.QueryField;

var _utils = require('themost/common/utils');

var TraceUtils = _utils.TraceUtils;

var _utils2 = require('themost/query/utils');

var SqlUtils = _utils2.SqlUtils;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class
 * @augments DataAdapter
 * @property {string} connectString
 */
var OracleAdapter = exports.OracleAdapter = function () {
    /**
     * @constructor
     * @param {*} options
     */
    function OracleAdapter(options) {
        _classCallCheck(this, OracleAdapter);

        this.options = options || { host: 'localhost' };
        /**
         * Represents the database raw connection associated with this adapter
         * @type {*}
         */
        this.rawConnection = null;
        var connectString = void 0;
        //of options contains connectString parameter ignore all other params and define this as the database connection string
        if (options.connectString) {
            connectString = options.connectString;
        }
        Object.defineProperty(this, 'connectString', {
            get: function get() {
                if (typeof connectString === 'string') {
                    return connectString;
                } else {
                    //generate connectString ([//]host_name[:port][/service_name][:server_type][/instance_name])
                    //get hostname or localhost
                    connectString = options.host || 'localhost';
                    //append port
                    if (typeof options.port !== 'undefined') {
                        connectString += ':' + options.port;
                    }
                    if (typeof options.service !== 'undefined') {
                        connectString += '/' + options.service;
                    }
                    if (typeof options.type !== 'undefined') {
                        connectString += ':' + options.type;
                    }
                    if (typeof options.instance !== 'undefined') {
                        connectString += '/' + options.instance;
                    }
                    return connectString;
                }
            }
        });
    }

    _createClass(OracleAdapter, [{
        key: 'open',
        value: function open(callback) {
            var self = this;
            callback = callback || function () {};
            if (self.rawConnection) {
                callback();
            } else {
                oracledb.getConnection({
                    user: this.options.user,
                    password: this.options.password,
                    connectString: this.connectString
                }, function (err, connection) {
                    if (err) {
                        return callback(err);
                    }
                    self.rawConnection = connection;
                    callback();
                });
            }
        }
    }, {
        key: 'close',
        value: function close(callback) {
            var self = this;
            callback = callback || function () {};
            try {
                if (self.rawConnection) {
                    //close connection
                    self.rawConnection.release(function (err) {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('An error occured while closing database.');
                            console.log(err.message);
                            if (err.stack) {
                                console.log(err.stack);
                            }
                        }
                        //and finally return
                        callback();
                    });
                } else {
                    callback();
                }
            } catch (e) {
                console.log('An error occured while closing database.');
                console.log(e.message);
                //call callback without error
                callback();
            }
        }

        /**
         * @param {string} query
         * @param {*=} values
         */

    }, {
        key: 'prepare',
        value: function prepare(query, values) {
            return SqlUtils.prepare(query, values);
        }
    }, {
        key: 'executeInTransaction',


        /**
         * Begins a transactional operation by executing the given function
         * @param fn {function} The function to execute
         * @param callback {function(Error=)} The callback that contains the error -if any- and the results of the given operation
         */
        value: function executeInTransaction(fn, callback) {
            var self = this;
            //ensure parameters
            fn = fn || function () {};callback = callback || function () {};
            self.open(function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (self.transaction) {
                        fn.call(self, function (err) {
                            callback(err);
                        });
                    } else {
                        //initialize dummy transaction object (for future use)
                        self.transaction = {};
                        //execute function
                        fn.call(self, function (err) {
                            if (err) {
                                //rollback transaction
                                self.rawConnection.rollback(function () {
                                    delete self.transaction;
                                    callback(err);
                                });
                            } else {
                                //commit transaction
                                self.rawConnection.commit(function (err) {
                                    delete self.transaction;
                                    callback(err);
                                });
                            }
                        });
                    }
                }
            });
        }

        /**
         *
         * @param {string} name
         * @param {QueryExpression|*} query
         * @param {function(Error=)} callback
         */

    }, {
        key: 'createView',
        value: function createView(name, query, callback) {
            this.view(name).create(query, callback);
        }

        /*
         * @param {DataModelMigration|*} obj An Object that represents the data model scheme we want to migrate
         * @param {function(Error=)} callback
         */

    }, {
        key: 'migrate',
        value: function migrate(obj, callback) {
            var self = this;
            callback = callback || function () {};
            if (typeof obj === 'undefined' || obj === null) {
                callback();return;
            }
            /**
             * @type {DataModelMigration|*}
             */
            var migration = obj;

            var format = function format(_format, obj) {
                var result = _format;
                if (/%t/.test(_format)) result = result.replace(/%t/g, OracleAdapter.formatType(obj));
                if (/%f/.test(_format)) result = result.replace(/%f/g, obj.name);
                return result;
            };

            async.waterfall([
            //1. Check migrations table existence
            function (cb) {
                if (OracleAdapter.supportMigrations) {
                    cb(null, true);
                    return;
                }
                self.table('migrations').exists(function (err, exists) {
                    if (err) {
                        cb(err);return;
                    }
                    cb(null, exists);
                });
            },
            //2. Create migrations table, if it does not exist
            function (arg, cb) {
                if (arg) {
                    cb(null, 0);return;
                }
                //create migrations table

                async.eachSeries(['CREATE TABLE "migrations"("id" NUMBER(10) NOT NULL, "appliesTo" NVARCHAR2(255) NOT NULL, "model" NVARCHAR2(255) NULL, ' + '"description" NVARCHAR2(255),"version" NVARCHAR2(24) NOT NULL, CONSTRAINT "migrations_pk" PRIMARY KEY ("id"))', 'CREATE SEQUENCE "migrations_id_seq" START WITH 1 INCREMENT BY 1'], function (s, cb0) {
                    self.execute(s, [], cb0);
                }, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    OracleAdapter.supportMigrations = true;
                    return cb(null, 0);
                });

                //self.execute('CREATE TABLE "migrations"("id" NUMBER(10) NOT NULL, ' +
                //    '"appliesTo" NVARCHAR2(255) NOT NULL, "model" NVARCHAR2(255) NULL, ' +
                //    '"description" NVARCHAR2(255),"version" NVARCHAR2(24) NOT NULL, ' +
                //    'CONSTRAINT "migrations_pk" PRIMARY KEY ("id")); ' +
                //    'CREATE SEQUENCE "migrations_seq" START WITH 1 INCREMENT BY 1; ' +
                //    'CREATE TRIGGER "migrations_auto_inc" BEFORE INSERT ON "migrations" FOR EACH ROW BEGIN :new."id" := "migrations_seq".nextval; END;',
                //    [], function(err) {
                //        if (err) { cb(err); return; }
                //        OracleAdapter.supportMigrations=true;
                //        cb(null, 0);
                //    });
            },
            //3. Check if migration has already been applied (true=Table version is equal to migration version, false=Table version is older from migration version)
            function (arg, cb) {
                self.table(migration.appliesTo).version(function (err, version) {
                    if (err) {
                        cb(err);return;
                    }
                    cb(null, version >= migration.version);
                });
            },
            //4a. Check table existence (-1=Migration has already been applied, 0=Table does not exist, 1=Table exists)
            function (arg, cb) {
                //migration has already been applied (set migration.updated=true)
                if (arg) {
                    migration['updated'] = true;
                    cb(null, -1);
                } else {
                    self.table(migration.appliesTo).exists(function (err, exists) {
                        if (err) {
                            cb(err);return;
                        }
                        cb(null, exists ? 1 : 0);
                    });
                }
            },
            //5. Migrate target table (create or alter)
            function (arg, cb) {
                var _this = this;

                //migration has already been applied (args[0]=-1)
                if (arg < 0) {
                    cb(null, arg);
                } else if (arg === 0) {
                    self.table(migration.appliesTo).create(migration.add, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null, 1);
                    });
                } else if (arg === 1) {
                    var column = void 0,
                        newType = void 0,
                        oldType = void 0;
                    //validate operations
                    var findColumnFunc = function findColumnFunc(name) {
                        return _.find(_this, function (x) {
                            return x.name === name;
                        });
                    };

                    //1. columns to be removed
                    if (util.isArray(migration.remove)) {
                        if (migration.remove.length > 0) {
                            return cb(new Error('Data migration remove operation is not supported by this adapter.'));
                        }
                    }
                    //1. columns to be changed
                    if (util.isArray(migration.change)) {
                        if (migration.change.length > 0) {
                            return cb(new Error('Data migration change operation is not supported by this adapter. Use add collection instead.'));
                        }
                    }

                    if (util.isArray(migration.add)) {
                        //init change collection
                        migration.change = [];
                        //get table columns
                        self.table(migration.appliesTo).columns(function (err, columns) {
                            if (err) {
                                return cb(err);
                            }
                            for (var i = 0; i < migration.add.length; i++) {
                                var x = migration.add[i];
                                column = findColumnFunc.bind(columns)(x.name);
                                if (column) {
                                    //if column is primary key remove it from collection
                                    if (column.primary) {
                                        migration.add.splice(i, 1);
                                        i -= 1;
                                    } else {
                                        newType = format('%t', x);
                                        if (column.precision !== null && column.scale !== null) {
                                            oldType = util.format('%s(%s,%s) %s', column.type.toUpperCase(), column.precision.toString(), column.scale.toString(), column.nullable ? 'NULL' : 'NOT NULL');
                                        } else if (/^TIMESTAMP\(\d+\) WITH LOCAL TIME ZONE$/i.test(column.type)) {
                                            oldType = util.format('%s %s', column.type.toUpperCase(), column.nullable ? 'NULL' : 'NOT NULL');
                                        } else if (column.size !== null) {
                                            oldType = util.format('%s(%s) %s', column.type.toUpperCase(), column.size.toString(), column.nullable ? 'NULL' : 'NOT NULL');
                                        } else {
                                            oldType = util.format('%s %s', column.type.toUpperCase(), column.nullable ? 'NULL' : 'NOT NULL');
                                        }
                                        //remove column from collection
                                        migration.add.splice(i, 1);
                                        i -= 1;
                                        if (newType !== oldType) {
                                            //add column to alter collection
                                            migration.change.push(x);
                                        }
                                    }
                                }
                            }
                            //alter table
                            var targetTable = self.table(migration.appliesTo);
                            //add new columns (if any)
                            targetTable.add(migration.add, function (err) {
                                if (err) {
                                    return cb(err);
                                }
                                //modify columns (if any)
                                targetTable.change(migration.change, function (err) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    cb(null, 1);
                                });
                            });
                        });
                    } else {
                        cb(new Error('Invalid migration data.'));
                    }
                } else {
                    cb(new Error('Invalid table status.'));
                }
            }, function (arg, cb) {
                if (arg > 0) {
                    //log migration to database
                    self.execute('INSERT INTO "migrations"("id","appliesTo", "model", "version", "description") VALUES ("migrations_id_seq".nextval,?,?,?,?)', [migration.appliesTo, migration.model, migration.version, migration.description], function (err, result) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        cb(null, 1);
                    });
                } else {
                    migration['updated'] = true;
                    cb(null, arg);
                }
            }], function (err) {
                callback(err);
            });
        }

        /**
         * Produces a new identity value for the given entity and attribute.
         * @param entity {String} The target entity name
         * @param attribute {String} The target attribute
         * @param callback {Function=}
         */

    }, {
        key: 'selectIdentity',
        value: function selectIdentity(entity, attribute, callback) {

            var self = this;
            //format sequence name ([entity]_[attribute]_seg e.g. user_id_seq)
            var name = entity + "_" + attribute + "_seq";
            //search for sequence
            self.execute('SELECT SEQUENCE_OWNER,SEQUENCE_NAME FROM ALL_SEQUENCES WHERE "SEQUENCE_NAME" = ?', [name], function (err, result) {
                if (err) {
                    return callback(err);
                }
                if (result.length === 0) {
                    self.execute(util.format('CREATE SEQUENCE "%s" START WITH 1 INCREMENT BY 1', name), [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        //get next value
                        self.execute(util.format('SELECT "%s".nextval AS "resultId" FROM DUAL', name), [], function (err, result) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, result[0]['resultId']);
                        });
                    });
                } else {
                    //get next value
                    self.execute(util.format('SELECT "%s".nextval AS "resultId" FROM DUAL', name), [], function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, result[0]['resultId']);
                    });
                }
            });
        }

        /**
         * Produces a new counter auto increment value for the given entity and attribute.
         * @param entity {String} The target entity name
         * @param attribute {String} The target attribute
         * @param callback {Function=}
         */

    }, {
        key: 'nextIdentity',
        value: function nextIdentity(entity, attribute, callback) {
            this.selectIdentity(entity, attribute, callback);
        }

        /**
         * Executes an operation against database and returns the results.
         * @param {DataModelBatch} batch
         * @param {function(Error=)} callback
         */

    }, {
        key: 'executeBatch',
        value: function executeBatch(batch, callback) {
            callback = callback || function () {};
            callback(new Error('DataAdapter.executeBatch() is obsolete. Use DataAdapter.executeInTransaction() instead.'));
        }
    }, {
        key: 'table',
        value: function table(name) {
            var self = this;
            var owner = void 0;
            var table = void 0;
            var matches = /(\w+)\.(\w+)/.exec(name);
            if (matches) {
                //get schema owner (the first part of the string provided)
                owner = matches[1];
                //get table name (the second part of the string provided)
                table = matches[2];
            } else {
                //get table name (the whole string provided)
                table = name;
                //get schema name (from options)
                if (self.options && self.options.schema) {
                    owner = self.options.schema;
                }
            }

            var format = function format(_format2, obj) {
                var result = _format2;
                if (/%t/.test(_format2)) result = result.replace(/%t/g, OracleAdapter.formatType(obj));
                if (/%f/.test(_format2)) result = result.replace(/%f/g, obj.name);
                return result;
            };

            return {
                /**
                 * @param {function(Error,Boolean=)} callback
                 */
                exists: function exists(callback) {
                    var sql = void 0;
                    if (typeof owner === 'undefined' || owner === null) {
                        sql = 'SELECT COUNT(*) AS "count" FROM ALL_OBJECTS WHERE object_type IN (\'TABLE\') AND object_name = ?';
                    } else {
                        sql = 'SELECT COUNT(*) AS "count" FROM ALL_OBJECTS WHERE object_type IN (\'TABLE\') AND object_name = ? AND REGEXP_LIKE(owner,?,\'i\')';
                    }
                    self.execute(sql, [table, '^' + owner + '$'], function (err, result) {
                        if (err) {
                            callback(err);return;
                        }
                        callback(null, result[0].count > 0);
                    });
                },
                /**
                 * @param {function(Error,string=)} callback
                 */
                version: function version(callback) {
                    self.execute('SELECT MAX("version") AS "version" FROM "migrations" WHERE "appliesTo"=?', [name], function (err, result) {
                        if (err) {
                            cb(err);return;
                        }
                        if (result.length === 0) callback(null, '0.0');else callback(null, result[0].version || '0.0');
                    });
                },
                /**
                 * @param {function(Error,Boolean=)} callback
                 */
                hasSequence: function hasSequence(callback) {
                    callback = callback || function () {};
                    self.execute('SELECT COUNT(*) AS "count" FROM ALL_SEQUENCES WHERE SEQUENCE_NAME=?', [table + '_seq'], function (err, result) {
                        if (err) {
                            callback(err);return;
                        }
                        callback(null, result[0].count > 0);
                    });
                },
                /**
                 * @param {function(Error=,Array=)} callback
                 */
                columns: function columns(callback) {
                    callback = callback || function () {};

                    /*
                     SELECT c0.COLUMN_NAME AS "name", c0.DATA_TYPE AS "type", ROWNUM AS "ordinal",
                     c0.DATA_LENGTH AS "size", c0.DATA_SCALE AS "scale", CASE WHEN c0.NULLABLE='Y'
                     THEN 1 ELSE 0 END AS "nullable", CASE WHEN t0.CONSTRAINT_TYPE='P' THEN 1 ELSE 0 END AS "primaryKey"
                     FROM ALL_TAB_COLUMNS c0 LEFT JOIN (SELECT cols.table_name, cols.column_name, cols.owner, cons.constraint_type
                     FROM all_constraints cons, all_cons_columns cols WHERE cons.constraint_type = 'P'
                     AND cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner) t0 ON c0.TABLE_NAME=t0.TABLE_NAME
                     AND c0.OWNER=t0.OWNER AND c0.COLUMN_NAME=t0.COLUMN_NAME WHERE c0.TABLE_NAME = ?
                    */

                    var sql = 'SELECT c0.COLUMN_NAME AS "name", c0.DATA_TYPE AS "type", ROWNUM AS "ordinal", CASE WHEN c0."CHAR_LENGTH">0 THEN c0."CHAR_LENGTH" ELSE c0.DATA_LENGTH END as "size", ' + 'c0.DATA_SCALE AS "scale", c0.DATA_PRECISION AS "precision", CASE WHEN c0.NULLABLE=\'Y\' THEN 1 ELSE 0 END AS "nullable", CASE WHEN t0.CONSTRAINT_TYPE=\'P\' ' + 'THEN 1 ELSE 0 END AS "primary" FROM ALL_TAB_COLUMNS c0 LEFT JOIN (SELECT cols.table_name, cols.column_name, cols.owner, ' + 'cons.constraint_type FROM all_constraints cons, all_cons_columns cols WHERE cons.constraint_type = \'P\' ' + 'AND cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner) t0 ON c0.TABLE_NAME=t0.TABLE_NAME ' + 'AND c0.OWNER=t0.OWNER AND c0.COLUMN_NAME=t0.COLUMN_NAME WHERE c0.TABLE_NAME = ?';
                    if (owner) {
                        sql += ' AND REGEXP_LIKE(c0.OWNER,?,\'i\')';
                    }
                    self.execute(sql, [name, '^' + owner + '$'], function (err, result) {
                        if (err) {
                            callback(err);return;
                        }
                        callback(null, result);
                    });
                },
                /**
                 * @param {{name:string,type:string,primary:boolean|number,nullable:boolean|number,size:number, scale:number,precision:number,oneToMany:boolean}[]|*} fields
                 * @param callback
                 */
                create: function create(fields, callback) {
                    callback = callback || function () {};
                    fields = fields || [];
                    if (!util.isArray(fields)) {
                        return callback(new Error('Invalid argument type. Expected Array.'));
                    }
                    if (fields.length === 0) {
                        return callback(new Error('Invalid argument. Fields collection cannot be empty.'));
                    }
                    var strFields = _.map(_.filter(fields, function (x) {
                        return !x.oneToMany;
                    }), function (x) {
                        return format('"%f" %t', x);
                    }).join(', ');

                    //get table qualified name
                    var strTable = '';

                    var formatter = new OracleFormatter();
                    if (typeof owner !== 'undefined') {
                        strTable = formatter.escapeName(owner) + ".";
                    }
                    strTable += formatter.escapeName(table);
                    //add primary key constraint
                    var strPKFields = _.map(_.find(fields, function (x) {
                        return x.primary === true || x.primary === 1;
                    }), function (x) {
                        return formatter.escapeName(x.name);
                    }).join(', ');
                    if (strPKFields.length > 0) {
                        strFields += ', ' + util.format('CONSTRAINT "%s_pk" PRIMARY KEY (%s)', table, strPKFields);
                    }
                    var sql = util.format('CREATE TABLE %s (%s)', strTable, strFields);
                    self.execute(sql, null, function (err) {
                        callback(err);
                    });
                },
                /**
                 * Alters the table by adding an array of fields
                 * @param {{name:string,type:string,primary:boolean|number,nullable:boolean|number,size:number,oneToMany:boolean}[]|*} fields
                 * @param callback
                 */
                add: function add(fields, callback) {
                    callback = callback || function () {};
                    fields = fields || [];
                    if (!util.isArray(fields)) {
                        //invalid argument exception
                        return callback(new Error('Invalid argument type. Expected Array.'));
                    }
                    if (fields.length === 0) {
                        //do nothing
                        return callback();
                    }
                    var strFields = fields.map(function (x) {
                        return format('"%f" %t', x);
                    }).join(', ');

                    //get table qualified name
                    var strTable = '';

                    var formatter = new OracleFormatter();
                    if (typeof owner !== 'undefined') {
                        strTable = formatter.escapeName(owner) + ".";
                    }
                    strTable += formatter.escapeName(table);
                    //generate SQL statement
                    var sql = util.format('ALTER TABLE %s ADD (%s)', strTable, strFields);
                    self.execute(sql, [], function (err) {
                        callback(err);
                    });
                },
                /**
                 * Alters the table by modifying an array of fields
                 * @param {{name:string,type:string,primary:boolean|number,nullable:boolean|number,size:number,oneToMany:boolean}[]|*} fields
                 * @param callback
                 */
                change: function change(fields, callback) {
                    callback = callback || function () {};
                    fields = fields || [];
                    if (!util.isArray(fields)) {
                        //invalid argument exception
                        return callback(new Error('Invalid argument type. Expected Array.'));
                    }
                    if (fields.length === 0) {
                        //do nothing
                        return callback();
                    }
                    var strFields = fields.map(function (x) {
                        return format('"%f" %t', x);
                    }).join(', ');

                    //get table qualified name
                    var strTable = '';

                    var formatter = new OracleFormatter();
                    if (typeof owner !== 'undefined') {
                        strTable = formatter.escapeName(owner) + ".";
                    }
                    strTable += formatter.escapeName(table);
                    //generate SQL statement
                    var sql = util.format('ALTER TABLE %s MODIFY (%s)', strTable, strFields);
                    self.execute(sql, [], function (err) {
                        callback(err);
                    });
                }
            };
        }
    }, {
        key: 'view',
        value: function view(name) {
            var self = this;
            var owner = void 0;
            var view = void 0;

            var matches = /(\w+)\.(\w+)/.exec(name);
            if (matches) {
                //get schema owner
                owner = matches[1];
                //get table name
                view = matches[2];
            } else {
                view = name;
            }
            return {
                /**
                 * @param {function(Error,Boolean=)} callback
                 */
                exists: function exists(callback) {
                    var sql = 'SELECT COUNT(*) AS "count" FROM ALL_OBJECTS WHERE object_type IN (\'VIEW\') AND object_name = ?';
                    if (typeof owner !== 'undefined') {
                        sql += ' AND REGEXP_LIKE(owner,?,\'i\')';
                    }
                    self.execute(sql, [name, '^' + (owner || '') + '$'], function (err, result) {
                        if (err) {
                            callback(err);return;
                        }
                        callback(null, result[0].count > 0);
                    });
                },
                /**
                 * @param {function(Error=)} callback
                 */
                drop: function drop(callback) {
                    callback = callback || function () {};
                    self.open(function (err) {
                        if (err) {
                            return callback(err);
                        }

                        var sql = 'SELECT COUNT(*) AS "count" FROM ALL_OBJECTS WHERE object_type IN (\'VIEW\') AND object_name = ?';
                        if (typeof owner !== 'undefined') {
                            sql += ' AND REGEXP_LIKE(owner,?,\'i\')';
                        }
                        self.execute(sql, [name, '^' + (owner || '') + '$'], function (err, result) {
                            if (err) {
                                return callback(err);
                            }
                            var exists = result[0].count > 0;
                            if (exists) {
                                var _sql = util.format('DROP VIEW "%s"', name);
                                self.execute(_sql, undefined, function (err) {
                                    if (err) {
                                        callback(err);return;
                                    }
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        });
                    });
                },
                /**
                 * @param {QueryExpression|*} q
                 * @param {function(Error=)} callback
                 */
                create: function create(q, callback) {
                    var thisArg = this;
                    self.executeInTransaction(function (tr) {
                        thisArg.drop(function (err) {
                            if (err) {
                                tr(err);return;
                            }
                            try {
                                var sql = util.format('CREATE VIEW "%s" AS ', name);
                                var formatter = new OracleFormatter();
                                sql += formatter.format(q);
                                self.execute(sql, [], tr);
                            } catch (e) {
                                tr(e);
                            }
                        });
                    }, function (err) {
                        callback(err);
                    });
                }
            };
        }

        /**
         * Executes a query against the underlying database
         * @param query {QueryExpression|string|*}
         * @param values {*=}
         * @param {function(Error=,*=)} callback
         */

    }, {
        key: 'execute',
        value: function execute(query, values, callback) {
            var self = this;
            var sql = null;
            try {

                if (typeof query === 'string') {
                    //get raw sql statement
                    sql = query;
                } else {
                    //format query expression or any object that may be act as query expression
                    var formatter = new OracleFormatter();
                    sql = formatter.format(query);
                    //if query is fixed (an SQL expression without any table definition)
                    if (query.$fixed === true) {
                        //use dymmy oracle table DUAL
                        sql += ' FROM DUAL';
                    }
                }
                //validate sql statement
                if (typeof sql !== 'string') {
                    callback.call(self, new Error('The executing command is of the wrong type or empty.'));
                    return;
                }
                //ensure connection
                self.open(function (err) {
                    if (err) {
                        callback.call(self, err);
                    } else {
                        //log statement (optional)
                        if (process.env.NODE_ENV === 'development') console.log(util.format('SQL:%s, Parameters:%s', sql, JSON.stringify(values)));
                        //prepare statement - the traditional way
                        var prepared = self.prepare(sql, values);
                        //execute raw command
                        self.rawConnection.execute(prepared, [], { outFormat: oracledb.OBJECT, autoCommit: typeof self.transaction === 'undefined' }, function (err, result) {
                            if (err) {
                                //log sql
                                console.log(util.format('SQL Error:%s', prepared));
                                callback(err);
                            } else {
                                if (result) callback(null, result.rows);else callback();
                            }
                        });
                    }
                });
            } catch (e) {
                callback.call(self, e);
            }
        }
    }], [{
        key: 'formatType',
        value: function formatType(field) {
            var size = parseInt(field.size);
            var s = void 0;
            switch (field.type) {
                case 'Boolean':
                    s = 'NUMBER(1,0)';
                    break;
                case 'Byte':
                    s = 'NUMBER(3,0)';
                    break;
                case 'Number':
                    s = 'NUMBER(38)';
                    break;
                case 'Float':
                    s = 'NUMBER(19,4)';
                    break;
                case 'Counter':
                    return 'NUMBER(19,0)';
                case 'Currency':
                    s = 'NUMBER(' + (field.size || 19) + ',4)';
                    break;
                case 'Decimal':
                    s = 'NUMBER';
                    if (field.size && field.scale) {
                        s += '(' + field.size + ',' + field.scale + ')';
                    } else {
                        s += '(19,4)';
                    }
                    break;
                case 'Date':
                case 'DateTime':
                    s = 'TIMESTAMP(6) WITH LOCAL TIME ZONE';
                    break;
                case 'Time':
                    s = 'NUMBER(19,4)';
                    break;
                case 'Long':
                case 'Duration':
                    s = 'NUMBER(19,0)';
                    break;
                case 'Integer':
                    s = 'NUMBER' + (field.size ? '(' + field.size + ',0)' : '(19,0)');
                    break;
                case 'URL':
                case 'Text':
                case 'Note':
                    s = field.size ? util.format('NVARCHAR2(%s)', field.size) : 'NVARCHAR2(255)';
                    break;
                case 'Image':
                case 'Binary':
                    s = 'LONG RAW';
                    break;
                case 'Guid':
                    s = 'VARCHAR2(36)';
                    break;
                case 'Short':
                    s = 'NUMBER(5,0)';
                    break;
                default:
                    s = 'NUMBER(19,0)';
                    break;
            }
            if (field.primary) {
                return s.concat(' NOT NULL');
            } else {
                return s.concat(typeof field.nullable === 'undefined' || field.nullable === null ? ' NULL' : field.nullable ? ' NULL' : ' NOT NULL');
            }
        }
    }]);

    return OracleAdapter;
}();

function zeroPad(number, length) {
    number = number || 0;
    var res = number.toString();
    while (res.length < length) {
        res = '0' + res;
    }
    return res;
}

/**
 * @class
 * @augments {SqlFormatter}
 */

var OracleFormatter = exports.OracleFormatter = function (_SqlFormatter) {
    _inherits(OracleFormatter, _SqlFormatter);

    /**
     * @constructor
     */
    function OracleFormatter() {
        _classCallCheck(this, OracleFormatter);

        var _this2 = _possibleConstructorReturn(this, (OracleFormatter.__proto__ || Object.getPrototypeOf(OracleFormatter)).call(this));

        _this2.settings = {
            nameFormat: OracleFormatter.NAME_FORMAT,
            forceAlias: true
        };
        return _this2;
    }

    _createClass(OracleFormatter, [{
        key: 'escapeName',
        value: function escapeName(name) {
            if (typeof name === 'string') return name.replace(/(\w+)/ig, this.settings.nameFormat);
            return name;
        }

        /**
         * Escapes an object or a value and returns the equivalent sql value.
         * @param {*} value - A value that is going to be escaped for SQL statements
         * @param {boolean=} unquoted - An optional value that indicates whether the resulted string will be quoted or not.
         * returns {string} - The equivalent SQL string value
         */

    }, {
        key: 'escape',
        value: function escape(value, unquoted) {
            if (typeof value === 'boolean') {
                return value ? '1' : '0';
            }
            if (value instanceof Date) {
                return util.format('TO_TIMESTAMP_TZ(%s, \'YYYY-MM-DD HH24:MI:SS.FF3TZH:TZM\')', this.escapeDate(value));
            }
            var res = _get(OracleFormatter.prototype.__proto__ || Object.getPrototypeOf(OracleFormatter.prototype), 'escape', this).bind(this)(value, unquoted);
            if (typeof value === 'string') {
                if (/\\'/g.test(res)) {
                    //escape single quote (that is already escaped)
                    res = res.replace(/\\'/g, SINGLE_QUOTE_ESCAPE);
                    if (/\\"/g.test(res))
                        //escape double quote (that is already escaped)
                        res = res.replace(/\\"/g, DOUBLE_QUOTE_ESCAPE);
                    if (/\\\\/g.test(res))
                        //escape slash (that is already escaped)
                        res = res.replace(/\\\\/g, SLASH_ESCAPE);
                }
            }
            return res;
        }

        /**
         * @param {Date|*} val
         * @returns {string}
         */

    }, {
        key: 'escapeDate',
        value: function escapeDate(val) {
            var year = val.getFullYear();
            var month = zeroPad(val.getMonth() + 1, 2);
            var day = zeroPad(val.getDate(), 2);
            var hour = zeroPad(val.getHours(), 2);
            var minute = zeroPad(val.getMinutes(), 2);
            var second = zeroPad(val.getSeconds(), 2);
            //var millisecond = zeroPad(dt.getMilliseconds(), 3);
            //format timezone
            var offset = new Date().getTimezoneOffset(),
                timezone = (offset <= 0 ? '+' : '-') + zeroPad(-Math.floor(offset / 60), 2) + ':' + zeroPad(offset % 60, 2);
            return "'" + year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + "." + zeroPad(val.getMilliseconds(), 3) + timezone + "'";
        }

        /**
         *
         * @param {QueryExpression} obj
         * @returns {string}
         */

    }, {
        key: 'formatLimitSelect',
        value: function formatLimitSelect(obj) {

            var sql = this.formatSelect(obj);
            if (obj.$take) {
                if (obj.$skip) {
                    return 'SELECT * FROM ( ' + sql + ' ) where ROWNUM <= ' + (obj.$take + obj.$skip).toString() + ' ROWNUM > ' + obj.$skip.toString();
                } else {
                    return 'SELECT * FROM ( ' + sql + ' ) where ROWNUM <= ' + obj.$take.toString();
                }
            }
            return sql;
        }

        /**
         * Implements indexOf(str,substr) expression formatter.
         * @param {string} p0 The source string
         * @param {string} p1 The string to search for
         * @returns {string}
         */

    }, {
        key: '$indexof',
        value: function $indexof(p0, p1) {
            return util.format('(INSTR(%s,%s)-1)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements contains(a,b) expression formatter.
         * @param {string} p0 The source string
         * @param {string} p1 The string to search for
         * @returns {string}
         */

    }, {
        key: '$text',
        value: function $text(p0, p1) {
            return util.format('(INSTR(%s,%s)-1)>=0', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements concat(a,b) expression formatter.
         * @param {*} p0
         * @param {*} p1
         * @returns {string}
         */

    }, {
        key: '$concat',
        value: function $concat(p0, p1) {
            return util.format('CONCAT(%s,%s)', this.escape(p0), this.escape(p1));
        }

        /**
         * Implements substring(str,pos) expression formatter.
         * @param {String} p0 The source string
         * @param {Number} pos The starting position
         * @param {Number=} length The length of the resulted string
         * @returns {string}
         */

    }, {
        key: '$substring',
        value: function $substring(p0, pos, length) {
            if (length) return util.format('SUBSTR(%s,%s,%s)', this.escape(p0), pos.valueOf() + 1, length.valueOf());else return util.format('SUBSTR(%s,%s)', this.escape(p0), pos.valueOf() + 1);
        }

        /**
         * Implements length(a) expression formatter.
         * @param {*} p0
         * @returns {string}
         */

    }, {
        key: '$length',
        value: function $length(p0) {
            return util.format('LENGTH(%s)', this.escape(p0));
        }
    }, {
        key: '$ceiling',
        value: function $ceiling(p0) {
            return util.format('CEIL(%s)', this.escape(p0));
        }
    }, {
        key: '$startswith',
        value: function $startswith(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return 'REGEXP_LIKE(' + this.escape(p0) + ',\'^' + this.escape(p1, true) + '\')';
        }
    }, {
        key: '$contains',
        value: function $contains(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return 'REGEXP_LIKE(' + this.escape(p0) + ',\'' + this.escape(p1, true) + '\')';
        }
    }, {
        key: '$endswith',
        value: function $endswith(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return 'REGEXP_LIKE(' + this.escape(p0) + ',\'' + this.escape(p1, true) + '$\')';
        }
    }, {
        key: '$day',
        value: function $day(p0) {
            return util.format('EXTRACT(DAY FROM %s)', this.escape(p0));
        }
    }, {
        key: '$month',
        value: function $month(p0) {
            return util.format('EXTRACT(MONTH FROM %s)', this.escape(p0));
        }
    }, {
        key: '$year',
        value: function $year(p0) {
            return util.format('EXTRACT(YEAR FROM %s)', this.escape(p0));
        }
    }, {
        key: '$hour',
        value: function $hour(p0) {
            return util.format('EXTRACT(HOUR FROM %s)', this.escape(p0));
        }
    }, {
        key: '$minute',
        value: function $minute(p0) {
            return util.format('EXTRACT(MINUTE FROM %s)', this.escape(p0));
        }
    }, {
        key: '$second',
        value: function $second(p0) {
            return util.format('EXTRACT(SECOND FROM %s)', this.escape(p0));
        }
    }, {
        key: '$date',
        value: function $date(p0) {
            //alternative date solution: 'TO_TIMESTAMP_TZ(TO_CHAR(%s, 'YYYY-MM-DD'),'YYYY-MM-DD')'
            return util.format('TRUNC(%s)', this.escape(p0));
        }

        /**
         * Implements contains(a,b) expression formatter.
         * @param {string} p0 The source string
         * @param {string} p1 The string to search for
         * @returns {string}
         */

    }, {
        key: '$regex',
        value: function $regex(p0, p1) {
            //validate params
            if (_.isNil(p0) || _.isNil(p1)) return '';
            return 'REGEXP_LIKE(' + this.escape(p0) + ',\'' + this.escape(p1, true) + '\')';
        }
    }]);

    return OracleFormatter;
}(SqlFormatter);

OracleFormatter.NAME_FORMAT = '"$1"';

var REGEXP_SINGLE_QUOTE = /\\'/g,
    SINGLE_QUOTE_ESCAPE = '\'\'',
    REGEXP_DOUBLE_QUOTE = /\\"/g,
    DOUBLE_QUOTE_ESCAPE = '"',
    REGEXP_SLASH = /\\\\/g,
    SLASH_ESCAPE = '\\';

/**
 * Creates an instance of OracleAdapter object that represents an Oracle database connection.
 * @param {*} options An object that represents the properties of the underlying database connection.
 * @returns {DataAdapter|*}
 */
function createInstance(options) {
    return new OracleAdapter(options);
}
//# sourceMappingURL=index.js.map