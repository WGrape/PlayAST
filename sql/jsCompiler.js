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

                    },

                    // 切词
                    demarcate(sql) {

                        let token_arr = [];

                        // 第 1 阶段, 使用符号表(删减版), 只要是存在于符号表中的字符, 如果其前/后没有空格的话, 加上空格
                        let breakpoint_arr = SQLCompiler.prototype.tool.constContainer.referenceTable.symbolTable;
                        delete breakpoint_arr['*'];
                        delete breakpoint_arr['.'];


                    },


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

                        "Select": 2000,
                        "Update": 2001,
                        "Insert": 2002,
                        "Delete": 2003,

                        selectStatement: {

                            "From": 20000,
                            "Where": 20001,
                            "Order": 20002,
                            "By": 20003,
                            "Limit": 20004,
                            "Left": 20005,
                            "Right": 20006,
                            "Inner": 20007,
                            "Outer": 20008,
                            "FULL": 20009,
                            "Join": 20010,
                            "On": 20011,
                            "Group": 20012,
                            "Distinct": 20013,
                            "Like": 20014,
                            "Not": 20015,
                            "Between": 20016,
                            "And": 20017,
                            "In": 20018,
                        },

                        updateStatement: {

                            "Set": 20010,
                            "Where": 20002,
                        },

                        insertStatement: {

                            "Into": 20020,
                            "Values": 20021,
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

                // 当前的Token表
                tokenTable: {},

                // 当前的AST
                ast: {},
            },

            // 在期望的字符前后插入字符
            insertChInExceptChars(str, except_chars, ch = " ") {

                function insertStr(soure, start, newStr) {

                    return soure.slice(0, start) + newStr + soure.slice(start)
                }

                // https://blog.csdn.net/weixin_42203183/article/details/84257252
                function replacepos(text,start,stop,replacetext){

                    mystr = text.substring(0,stop-1)+replacetext+text.substring(stop+1);
                    return mystr;
                }

                let length = str.length, ch_len = ch.length;
                let i = 0;
                for (i = 0; i <= length - 1;) {

                    // 发现符号
                    if (except_chars.indexOf(str[i]) >= 0) {

                        // 首位就出现了期望的字符
                        if (0 === i) {

                            // 在前面插入一个字符
                            str = insertStr(str, i, ch);
                            i = 2;
                        }

                        if (i > 0 && str[i - 1] !== " ") {

                            // 在前面插入一个字符
                            str = insertStr(str, i, ch);
                            i = i + ch_len * 2;
                        }

                        if (str[i + 1] !== " ") {

                            // 在后面插入一个字符
                            str = insertStr(str, i + 1, ch);
                            i = i + ch_len * 2;
                        }

                        continue;
                    }

                    ++i;
                }

                return str;
            }
        }
    };

    $.fn.extend({

        SQLCompiler: function (sql = "") {

            return $(this).each(function () {

                return (new SQLCompiler(sql)).init();
            });
        }
    });

})();