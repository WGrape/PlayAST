/**
 *
 * Author:Lvsi
 */
(function () {

    let node

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

                try {

                    this.steps.lexicalAnalysis.work();
                    this.steps.syntacticAnalysis.work();
                    this.steps.semanticAnalysis.work();

                } catch (e) {

                    // 解析失败
                    alert("解析失败 : " + e.message);
                }

                // OK ! Sql passed the check !
                return true;
            },

            steps: {


                /**
                 * 词法分析(Lexical analyzer : https://zh.wikipedia.org/zh-hans/%E8%AF%8D%E6%B3%95%E5%88%86%E6%9E%90)
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

                        let index = 0;
                        for (let lexicon of lexicon_arr) {

                            let node = this.generateTokenNode(lexicon);
                            node.index = index++;
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
                        if (typeof keywordTable.updateStatement[lexicon] !== "undefined" || typeof keywordTable.insertStatement[lexicon] !== "undefined") {

                            return {type: "Keyword", value: lexicon};
                        }
                        if (typeof keywordTable.deleteStatement[lexicon] !== "undefined") {

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
                 * 语法分析(语法分析器,syntactic analysis也叫parsing : https://zh.wikipedia.org/zh-hans/%E8%AA%9E%E6%B3%95%E5%88%86%E6%9E%90%E5%99%A8)
                 * 是根据某种给定的形式文法对由单词序列( 如英语单词序列 )构成的输入文本进行分析并确定其语法结构的一种过程
                 * 循环Token表, 通过已有的语法结构模型, 生成 AST, 语法错误则不能生成 AST
                 */
                syntacticAnalysis: {

                    work() {

                        // 先决策是哪种Statement
                        this.decisionStatement();

                        // 根据 statement 的语法模型, 生成 AST Outline
                        this.createASTOutlineByStatementType();


                        return true;
                    },

                    decisionStatement() {

                        // 根据token表中的第一个数据判断即可
                        let token_table = SQLCompiler.prototype.tool.globalVariableContainer.tokenTable;
                        switch (token_table[0].value) {

                            case "select":
                            case "update":
                            case "delete":
                            case "insert":
                                SQLCompiler.prototype.tool.globalVariableContainer.statement_type = token_table[0].value;
                                break;

                            default:
                                let msg = "只支持CURD操作";
                                SQLCompiler.prototype.tool.globalVariableContainer.sql_error = true;
                                SQLCompiler.prototype.tool.globalVariableContainer.sql_error_msg = msg;
                                throw new Error(msg);
                        }
                    },

                    createASTOutlineByStatementType() {

                        let token_table = SQLCompiler.prototype.tool.globalVariableContainer.tokenTable;
                        let root = this.generateASTNode();

                        for (let token_obj of token_table) {

                            let token = token_obj.type.toLocaleLowerCase();

                            let node_types = SQLCompiler.prototype.tool.constContainer.tokenReferASTNodeType[token];
                            let node = null;

                            // JS没有指针, 只有引用, 但是引用也无法实现无限的递归
                            for (let node_type in node_types) {

                                if ("expression" === node_type) {

                                    continue;
                                }

                                if (node_types.hasOwnProperty(node_type)) {

                                    let next_node = this.generateASTNode({
                                        type: node_type,
                                        index: token_obj.index,
                                        next: []
                                    });

                                    // 如果node
                                    if (node === null) {

                                        node = new Object(next_node);
                                    } else {

                                        node.next.push(next_node);
                                    }
                                }
                            }

                            node !== null && root.children.push(node);
                        }

                        SQLCompiler.prototype.tool.globalVariableContainer.ast_outline = root;
                    },

                    generateASTNode(node = {}) {

                        return {

                            type: (typeof node.type !== "undefined") ? node.type : "root", // 节点类型

                            variant: (typeof node.variant !== "undefined") ? node.variant : "",

                            recursive: (typeof node.recursive !== "undefined") ? node.recursive : false,

                            ignore: (typeof node.ignore !== "undefined") ? node.ignore : false,

                            children: (typeof node.children !== "undefined") ? node.children : [],

                            index: (typeof node.index !== "undefined") ? node.index : -1, // token 下标

                            next: (typeof node.next !== "undefined") ? node.next : null, // token 下标
                        };
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
                            "as": 20021,
                        },

                        updateStatement: {

                            "set": 20010,
                            "where": 20002,
                        },

                        insertStatement: {

                            "into": 20020,
                            "values": 20021,
                        },

                        deleteStatement: {

                            "from": 20030,
                            "where": 20031,
                            "and": 20032,
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

                // 语法模型
                syntacticModel: {

                    // AST根节点
                    root: {

                        type: "root",
                        variant: "root",
                        children: [
                            {
                                type: "statement",
                                variant: "select",
                                children: [

                                    {
                                        type: "expression", variant: "column", recursive: true,
                                        children: {type: "object", variant: "column", token: "identifier"}
                                    },

                                    {
                                        type: "clause", variant: "from", token: "keyword",
                                        children: {type: "object", variant: "table", token: "identifier"}
                                    },
                                ]
                            },

                            {
                                type: "statement",
                                variant: "update",

                                children: [

                                    {type: "identifier", variant: "table", token: "identifier"},
                                    {type: "clause", variant: "set", token: "keyword"},
                                    {
                                        type: "clause", variant: "where", token: "keyword",
                                        children: {
                                            type: "expression",
                                            variant: "where",
                                            recursive: true,
                                            left: {type: "object", variant: "column", token: "identifier"},
                                            right: {type: "object", variant: "column", token: "identifier"},
                                            operator: {type: "object", variant: "column", token: "punctuator"}
                                        }
                                    },
                                ]
                            },

                            {
                                type: "statement",
                                variant: "delete",
                                token: "keyword",

                                children: [

                                    // delete 后面紧跟的是 表达式(即delete引导的表达式)
                                    {
                                        type: "expression", variant: "delete", ignore: true
                                    },

                                    // 表达式后面紧跟的是 from 子句, 由关键字 from 引导
                                    {
                                        type: "clause", variant: "from", token: "keyword",
                                    },

                                    // from后面紧跟的是 表达式(即from引导的表达式)
                                    {
                                        type: "expression", variant: "from",
                                    },

                                    // from表达式后面紧跟的是 可忽略的,可递归的 Join 谓语
                                    {
                                        type: "predicate", variant: "join", recursive: true, ignore: true,
                                    },

                                    // join后面紧跟的是 where 子句, 由关键字 where 引导, 可忽略
                                    {
                                        type: "clause", variant: "where", token: "keyword", ignore: true,
                                    },

                                    // where后面紧跟的是 表达式(即where引导的表达式)
                                    {
                                        type: "expression", variant: "where", recursive: true, ignore: true,
                                    },

                                    /*{
                                        type: "clause", variant: "where", token: "keyword",
                                        children: {
                                            type: "expression",
                                            variant: "where",
                                            recursive: true,
                                            left: {type: "object", variant: "column", token: "identifier"},
                                            right: {type: "object", variant: "column", token: "identifier"},
                                            operator: {type: "object", variant: "column", token: "punctuator"}
                                        }
                                    },*/
                                ]
                            },

                            {
                                type: "statement",
                                variant: "insert",
                            },
                        ],
                        siblings: null,
                    }
                },

                // 语法模型中的成分常量
                syntacticModelElementsConst: {

                    // 目前只有这5种节点类型
                    ASTNodeType: {

                        root: 6000,
                        statement: 6001,
                        clause: 6002,
                        expression: 6003,
                        predicate: 6004,
                    },

                    statementType: {

                        select: 60010,
                        update: 60012,
                        delete: 60013,
                        insert: 60014,
                    },

                    clauseType: {

                        from: 60020,
                        where: 60021,
                    },

                    expressionType: {

                        column: 6000,
                        from: 6001,
                        where: 6002,
                    },

                },

                // token到句子的映射关系, 即一个token会充当句子中的什么成分(tokenMapToSentence)
                // token可能是哪种AST节点类型
                tokenReferASTNodeType: {

                    keyword: {

                        statement: 7000,
                        clause: 7000,
                        predicate: 7000,
                    },
                    identifier: {

                        expression: 8000,
                    },
                    punctuator: {

                        expression: 9000,
                    },
                    numeric: {

                        expression: 10000,
                    },
                    string: {

                        expression: 11000,
                    }
                }

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

                /**
                 * syntacticAnalysis 语法分析阶段的产物
                 */
                statement_type: "", // 当前的 statement 类型
                ast_outline: {},


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
                },

                syntacticAnalysis: {

                    getStatementType() {

                        return SQLCompiler.prototype.tool.globalVariableContainer.statement_type;
                    },

                    getASTOutline() {

                        return SQLCompiler.prototype.tool.globalVariableContainer.ast_outline;
                    },
                }
            },
        }

    });

})();