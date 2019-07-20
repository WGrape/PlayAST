/**
 *
 * Author:Lvsi
 */
(function () {


    let SQLCompiler = function (sql) {

        SQLCompiler.prototype.tool.globalVariableContainer.sql = sql;
    };

    SQLCompiler.prototype = {

        // 初始化启动
        init: function () {

            return this.compile.boot();
        },

        compile: {

            boot: function () {

                if (!this.steps.lexicalAnalysis.work()) {

                    return false;
                }

                if (!this.steps.syntacticAnalysis.work()) {

                    return false;
                }

                if (!this.steps.semanticAnalysis.work()) {

                    return false;
                }

                // OK ! Sql passed the check !
                return true;
            },

            steps: {


                /**
                 * 词法分析
                 * 遍历SQL, 生成 Token 表
                 */
                lexicalAnalysis: {

                    work() {

                        // 第 1 阶段, 使用符号表(删减版), 只要是存在于符号表中的字符, 如果其前/后没有空格的话, 加上空格
                        this.clear();

                        // 第 2 阶段, 把清洁后的 SQL 切词
                        this.demarcate();

                        // 第 3 阶段, 生成 token 表
                        this.createTokenTable();

                        return true;
                    },

                    clear() {

                        let sql = SQLCompiler.prototype.tool.globalVariableContainer.sql.toLowerCase();

                        let breakpoint_obj = SQLCompiler.prototype.tool.constContainer.referenceTable.symbolTable;
                        delete breakpoint_obj['*']; // delete breakpoint_arr['.'];
                        delete breakpoint_obj['"'];
                        delete breakpoint_obj["'"];
                        let breakpoint_arr = SQLCompiler.prototype.tool.objectPropertyToArray(breakpoint_obj);

                        SQLCompiler.prototype.tool.globalVariableContainer.sql_cleared = SQLCompiler.prototype.tool.insertWhiteSpaceInExceptChars(sql, breakpoint_arr);
                    },

                    demarcate() {

                        let sql = SQLCompiler.prototype.tool.globalVariableContainer.sql_cleared;

                        // 使用空格split, 并过滤掉空元素
                        SQLCompiler.prototype.tool.globalVariableContainer.sql_lexicon_arr = SQLCompiler.prototype.tool.trimArray(sql.split(" "));
                    },

                    createTokenTable() {

                        let token_arr = [];
                        let lexicon_arr = SQLCompiler.prototype.tool.globalVariableContainer.sql_lexicon_arr;

                        for (let lexicon of lexicon_arr) {

                            let node = this.generateTokenNode(lexicon);
                            token_arr.push(node);
                        }

                        // token 表创建成功
                        SQLCompiler.prototype.tool.globalVariableContainer.tokenTable = token_arr;
                    },

                    // 根据 lexicon 词汇类型, 生成 token node
                    generateTokenNode(lexicon) {

                        // {type:"",value:""}

                        // 词汇是关键字
                        let keywordTable = SQLCompiler.prototype.tool.constContainer.referenceTable.keywordTable;
                        if (typeof keywordTable.curdStatement[lexicon] !== "undefined" || typeof keywordTable.selectStatement[lexicon] !== "undefined") {

                            return {type: "Keyword", value: lexicon};
                        }

                        // 词汇是符号
                        let symbolTable = SQLCompiler.prototype.tool.constContainer.referenceTable.symbolTable;
                        if (typeof symbolTable[lexicon] !== "undefined") {

                            return {type: "Punctuator", value: lexicon};
                        }

                        // 词汇是 String
                        if (lexicon[0] === "'" || lexicon[0] === "\"") {

                            return {type: "String", value: lexicon};
                        }

                        // 词汇是 Numeric
                        if (!isNaN(lexicon)) {

                            return {type: "Numeric", value: lexicon};
                        }

                        // 词汇是 Identifier
                        return {type: "Identifier", value: lexicon};
                    }

                },

                /**
                 * 语法分析
                 * 通过循环Token表, 生成 AST, 语法错误则不能生成 AST
                 */
                syntacticAnalysis: {

                    work() {

                    },
                },

                /**
                 * 语义分析
                 * Traverse AST, 根据 referenceTable 分析是否有 SQL 错误, 如分析上下文环境判断是否有错
                 */
                semanticAnalysis: {

                    work() {

                    },
                },
            }

        },

        tool: {

            constContainer: {

                // 参考表
                referenceTable: {

                    // 符号表
                    symbolTable: {

                        "'": 1001,
                        "\"": 1002,
                        "`": 1003,
                        ",": 1004,
                        ";": 1005,
                        "(": 1006,
                        ")": 1007,
                        "*": 1008,
                        "!": 1009,
                        "=": 1010,
                        ">": 1011,
                        "<": 1012,
                        ".": 1013,
                    },

                    // 关键字表
                    keywordTable: {

                        curdStatement: {

                            "select": 2000,
                            "update": 2001,
                            "insert": 2002,
                            "delete": 2003,
                        },

                        selectStatement: {

                            "from": 20000,
                            "where": 20001,
                            "order": 20002,
                            "by": 20003,
                            "limit": 20004,
                            "left": 20005,
                            "right": 20006,
                            "inner": 20007,
                            "outer": 20008,
                            "full": 20009,
                            "join": 20010,
                            "on": 20011,
                            "group": 20012,
                            "distinct": 20013,
                            "like": 20014,
                            "not": 20015,
                            "between": 20016,
                            "and": 20017,
                            "in": 20018,
                            "desc": 20019,
                            "asc": 20020,
                        },

                        updateStatement: {

                            "set": 20010,
                            "where": 20002,
                        },

                        insertStatement: {

                            "into": 20020,
                            "values": 20021,
                        }
                    },

                    // scope表
                    scopeTable: {},

                    // 支持的Token类型表
                    tokenTypeTable: {

                        "KeyWord": 5000,
                        "Identifier": 5001,
                        "Punctuator": 5002,
                        "Numeric": 5003,
                        "String": 5004,
                    }
                },
            },

            globalVariableContainer: {

                sql: "",
                sql_error: false,
                sql_error_msg: "",


                /**
                 * lexicalAnalysis 词法分析阶段的产物
                 */
                sql_cleared: "", // 清洁后的SQL
                sql_lexicon_arr: "", // SQL词汇数组
                tokenTable: [], // 当前的Token表


                // 当前的AST
                ast: {},
            },

            // 在期望的字符处插入空白
            insertWhiteSpaceInExceptChars(str, except_chars) {

                // function insertStr(source, start, newStr) { return source.slice(0, start) + newStr + source.slice(start) }

                // https://blog.csdn.net/weixin_42203183/article/details/84257252
                function replacePos(text, start, stop, replace_text) {

                    return text.substring(0, stop) + replace_text + text.substring(stop + 1);
                }

                for (let i = 0; typeof str[i] !== "undefined";) {

                    // 发现符号
                    let index = except_chars.indexOf(str[i]);
                    if (index >= 0) {

                        str = replacePos(str, i, i, " " + except_chars[index] + " ");
                        i = i + 3;
                        continue;
                    }
                    ++i;
                }

                return str;
            },

            // 过滤数组空元素
            trimArray(arr) {

                return arr.filter((item) => item.length > 0 && item.trim() !== "");
            },

            // 对象转数组
            objectPropertyToArray(obj) {

                let arr = [];

                for (let property in obj) {

                    if (obj.hasOwnProperty(property)) {

                        arr.push(property); //属性
                    }
                }

                return arr;
            }
        }
    };

    $.fn.extend({

        SQLCompiler: function (sql = "") {

            return $(this).each(function () {

                (new SQLCompiler(sql)).init();
            });
        },

        SQLCompilerDebug: {

            steps: {

                lexicalAnalysis: {

                    getSQLCleared() {

                        return SQLCompiler.prototype.tool.globalVariableContainer.sql_cleared;
                    },

                    getSQLLexiconArr() {

                        return SQLCompiler.prototype.tool.globalVariableContainer.sql_lexicon_arr;
                    },

                    getTokenTable() {

                        return SQLCompiler.prototype.tool.globalVariableContainer.tokenTable;
                    },
                }
            },
        }

    });

})();