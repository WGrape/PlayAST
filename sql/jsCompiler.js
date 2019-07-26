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
                    throw e;
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

                        let sql = SQLCompiler.prototype.tool.globalVariableContainer.sql.toLowerCase().trim();
                        if (";" !== sql[sql.length - 1]) {

                            sql += ";";
                        }

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
                        if (keywordTable.curdStatement[lexicon] || keywordTable.selectStatement[lexicon]) {

                            return {type: "Keyword", value: lexicon};
                        }
                        if (keywordTable.updateStatement[lexicon] || keywordTable.insertStatement[lexicon]) {

                            return {type: "Keyword", value: lexicon};
                        }
                        if (keywordTable.deleteStatement[lexicon]) {

                            return {type: "Keyword", value: lexicon};
                        }

                        // 词汇是符号
                        let symbolTable = SQLCompiler.prototype.tool.constContainer.referenceTable.symbolTable;
                        if (symbolTable[lexicon]) {

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

                        // 如果语法错误则会生成一棵带有错误信息的AST, 并结束整个编译

                        // 先决策是哪种Statement
                        this.decisionStatement();

                        // 生成 AST Outline (创建出 AST 的轮廓)
                        this.createASTOutline();

                        // 为 AST Outline 剪枝
                        this.makeASTOutlinePruning();

                        // 为 AST Outline diff
                        this.makeASTOutlineDiffing();

                        // 将转换 AST Outline 转换成一棵 AST
                        this.makeASTOutlineTransforming();

                        // 优化 AST
                        this.optimizeAST();

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

                    createASTOutline() {

                        let token_table = SQLCompiler.prototype.tool.globalVariableContainer.tokenTable;
                        let root = this.generateASTNode({children: []});

                        let tokenReferASTNodeType = SQLCompiler.prototype.tool.constContainer.tokenReferASTNodeType;

                        for (let token_obj of token_table) {

                            let token = token_obj.type.toLocaleLowerCase();

                            let node = null, node_type = null;

                            if (token_obj.index === 0 && token === "keyword" && tokenReferASTNodeType.statement.indexOf(token_obj.value) > -1) {

                                node_type = "statement";
                            } else if (token === "keyword" && tokenReferASTNodeType.predicate.indexOf(token_table[token_obj.index - 1].value) < 0 && tokenReferASTNodeType.predicate.indexOf(token_obj.value) > -1) {

                                node_type = "predicate";
                            } else if (token === "keyword" && tokenReferASTNodeType.clause.indexOf(token_obj.value) > -1) {

                                node_type = "clause";
                            } else {

                                node_type = "expression";
                            }

                            let tokenValueMapVariant = SQLCompiler.prototype.tool.constContainer.tokenValueMapVariant;
                            node = this.generateASTNode({
                                type: node_type,
                                variant: (tokenValueMapVariant[token_obj.value]) ? tokenValueMapVariant[token_obj.value] : token_obj.value,
                                value: token_obj.value,
                                index: token_obj.index
                            });

                            node !== null && root.children.push(node);
                        }

                        SQLCompiler.prototype.tool.globalVariableContainer.ast_outline = root;
                    },

                    makeASTOutlinePruning() {

                        // let root = Object.assign({}, SQLCompiler.prototype.tool.globalVariableContainer.ast_outline); 引用传递, 故使用 JSON.parse 来禁止引用传递
                        let root = JSON.parse(JSON.stringify(SQLCompiler.prototype.tool.globalVariableContainer.ast_outline));

                        // 对 子查询 剪枝
                        let sub_query_num = SQLCompiler.prototype.tool.getSubQueryNum();
                        for (let i = 1; i <= sub_query_num; ++i) {

                            SQLCompiler.prototype.tool.pruning.pruningSubQuery(root, i);
                        }

                        // 对 Clause 剪枝
                        SQLCompiler.prototype.tool.pruning.pruningClause(root);

                        // 对 Predicate 剪枝
                        SQLCompiler.prototype.tool.pruning.pruningPredicate(root);

                        // 对 Expression 剪枝
                        SQLCompiler.prototype.tool.pruning.pruningExpression(root);

                        // 对 空节点 剪枝
                        root = SQLCompiler.prototype.tool.pruning.pruningEmptyNode(root);

                        SQLCompiler.prototype.tool.globalVariableContainer.ast_outline_pruned = root;
                    },

                    makeASTOutlineDiffing() {

                        // 内部会根据语法模型进行 diff
                        let statement_type = SQLCompiler.prototype.tool.globalVariableContainer.statement_type;
                        let syntacticModel = SQLCompiler.prototype.tool.constContainer.syntacticModel[statement_type];

                    },


                    makeASTOutlineTransforming() {

                        // 剪枝后的 ast outline
                        let root = SQLCompiler.prototype.tool.globalVariableContainer.ast_outline_pruned;

                        SQLCompiler.prototype.tool.globalVariableContainer.ast_outline_transformed = root;
                    },

                    optimizeAST() {

                        // 转换后的 AST
                        let root = SQLCompiler.prototype.tool.globalVariableContainer.ast_outline_transformed;

                        SQLCompiler.prototype.tool.globalVariableContainer.ast = root;
                    },

                    generateASTNode(node = {}) {

                        let obj = Object.assign({}, node);

                        if (!node.type) {

                            obj.type = "root";
                        }

                        if (!node.variant) {

                            obj.variant = "root";
                        }

                        if (!node.value) {

                            // obj.value = "root";
                        }

                        if (!node.index) {

                            // obj.index = -1; // token 的下标(即可以查到当前所属的token)
                        }

                        if (!node.children) {

                            // obj.children = []; // token 下标
                        }

                        return obj;
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

                /**
                 * 语法模型
                 * 组成 : statement + clause + predicate + expression
                 */
                syntacticModel: {

                    select: {

                        // AST根节点
                        root: {

                            type: "root",
                            variant: "root",
                            children: [

                                {
                                    type: "statement",
                                    variant: "select",
                                    value: "select"
                                },

                                {
                                    type: "expression",
                                    variant: "select",
                                },

                                {
                                    type: "clause",
                                    variant: "from",
                                },

                                {
                                    type: "expression",
                                    variant: "from",
                                },

                                {
                                    type: "grouping",
                                    variant: "",
                                    grouping: [

                                        {
                                            type: "predicate",
                                            variant: "join",
                                        },

                                        {
                                            type: "expression",
                                            variant: "join",
                                        },
                                    ],
                                    negligible: true,
                                },

                                {
                                    type: "grouping",
                                    variant: "",
                                    grouping: [

                                        {
                                            type: "clause",
                                            variant: "group",
                                        },

                                        {
                                            type: "expression",
                                            variant: "group",
                                        },
                                    ],
                                    negligible: true,
                                },

                                {
                                    type: "grouping",
                                    variant: "",
                                    grouping: [

                                        {
                                            type: "clause",
                                            variant: "where",
                                        },

                                        {
                                            type: "expression",
                                            variant: "where",
                                        },
                                    ],
                                    negligible: true,
                                },

                                {
                                    type: "grouping",
                                    variant: "",
                                    grouping: [

                                        {
                                            type: "clause",
                                            variant: "order",
                                        },

                                        {
                                            type: "expression",
                                            variant: "order",
                                        },
                                    ],
                                    negligible: true,
                                },

                                {
                                    type: "grouping",
                                    variant: "",
                                    grouping: [

                                        {
                                            type: "clause",
                                            variant: "limit",
                                        },

                                        {
                                            type: "expression",
                                            variant: "limit",
                                        },
                                    ],
                                    negligible: true,
                                },

                            ],
                        }
                    },

                    update: {

                        // AST根节点
                        root: {

                            type: "root",
                            variant: "root",
                            children: [

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
                            ],
                        }
                    },

                    delete: {

                        // AST根节点
                        root: {

                            type: "root",
                            variant: "root",
                            children: [

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
                            ],
                        }
                    },

                    insert: {

                        // AST根节点
                        root: {

                            type: "root",
                            variant: "root",
                            children: [

                                {
                                    type: "statement",
                                    variant: "insert",
                                },
                            ],
                        }
                    },
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

                availableVariants: [
                    "alias", "continued", "all columns",
                ],

                // token到句子的映射关系, 即一个token会充当句子中的什么成分(tokenMapToSentence)
                // token可能是哪种AST节点类型
                tokenReferASTNodeType: {

                    statement: ["select", "update", "delete", "insert"],

                    clause: ["from", "where", "order", "group", "having", "limit"],

                    predicate: ["left", "right", "inner", "full", "join"],

                    // 兜底
                    expression: [],
                },

                tokenValueMapVariant: {

                    "as": "alias",
                    ",": "continued",
                    "*": "all columns",
                    ".": "object operator",
                    // "on": "",
                    ">": "operator",
                    "<": "operator",
                    "=": "operator",
                    ";": "close",
                }

            },

            globalVariableContainer: {

                /**
                 * SQL解析情况
                 */
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
                statement_type: "", // 当前的 statement 类型(经过决策后的)
                ast_outline: {}, // ast 轮廓
                ast_outline_pruned: {}, // 剪枝后的 ast 轮廓
                ast_outline_transformed: {}, // 转换后的 AST
                ast: {}, // 经过优化后的最终的 AST
            },

            // 在期望的字符处插入空白
            insertWhiteSpaceInExceptChars(str, except_chars) {

                // function insertStr(source, start, newStr) { return source.slice(0, start) + newStr + source.slice(start) }

                // https://blog.csdn.net/weixin_42203183/article/details/84257252
                function replacePos(text, start, stop, replace_text) {

                    return text.substring(0, stop) + replace_text + text.substring(stop + 1);
                }

                for (let i = 0; str[i];) {

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
            },

            // 获取最后第N个右括号的下标
            getLastNthRightBracketASTIndex(n) {

                let ast_outline = SQLCompiler.prototype.tool.globalVariableContainer.ast_outline.children;
                let length = ast_outline.length;

                let times = 1;

                for (let i = length - 1; i >= 0; --i) {

                    if (")" === ast_outline[i].value) {

                        if (times === n) {

                            return i;
                        }

                        ++times;
                    }
                }

                throw new Error("Not match right bracket");
            },

            // 获取子查询个数
            getSubQueryNum() {

                let token_table = SQLCompiler.prototype.tool.globalVariableContainer.tokenTable;
                let num = 0;
                token_table.forEach((item) => {

                    if (item.value === "select") {

                        ++num; // 有几个select就是有几个子查询
                    }
                });

                num -= 1;

                if (num > 2) {

                    throw new Error("只支持2层嵌套子查询");
                }

                return num;
            },

            // 修剪函数
            pruning: {

                pruningEmptyNode(root) {

                    let root_str = JSON.stringify(root);
                    root = JSON.parse(root_str.replace(/,null/g, ""));
                    return root;
                },

                pruningSubQuery(root, sub_query_level) {

                    let ast_outline;
                    if (1 === sub_query_level) {

                        ast_outline = root.children;
                    } else {

                        for (let item of root.children) {

                            if (item && item.subquery) {

                                ast_outline = item.subquery;
                            }
                        }
                    }

                    let length = ast_outline.length;

                    let left_bracket_num = 0;

                    let start, end;

                    // 上面delete后数组长度不变, 被删除的元素会变成undefined
                    for (let i = 0; i <= length - 1 && ast_outline[i] && ast_outline[i].value; ++i) {

                        if ("(" === ast_outline[i].value) {

                            ++left_bracket_num;
                        }

                        // 如果出现子查询, 则全部都加到query中
                        if ("(" === ast_outline[i].value && i - 1 >= 0 && ast_outline[i - 1].value === "from") {

                            start = i;
                            end = SQLCompiler.prototype.tool.getLastNthRightBracketASTIndex(left_bracket_num);
                            let node_subquery = {type: "subquery", subquery: [], sub_query_level: sub_query_level};

                            // 把所有连续的 expression 都打入 node_subquery 中
                            for (let j = i + 1; j <= end && ast_outline[j]; ++j) {

                                node_subquery.subquery.push(ast_outline[j]);
                                delete ast_outline[j];
                            }
                            ast_outline[i] = node_subquery;

                            break;
                        }
                    }
                },

                pruningClause(root) {

                    let ast_outline = root.children;

                    for (let node of ast_outline) {

                        if (node && "clause" === node.type) {

                            if ("order" === node.value) {

                                node.variant = "order by";
                            } else if ("group" === node.value) {

                                node.variant = "group by";
                            }
                        }
                    }
                },

                pruningPredicate(root) {

                    let ast_outline = root.children;

                    for (let node of ast_outline) {

                        if (node && "predicate" === node.type) {

                            if ("left" === node.value) {

                                node.variant = "left join";
                            } else if ("right" === node.value) {

                                node.variant = "right join";
                            }
                        }
                    }
                },

                pruningExpression(root) {

                    let token_table = SQLCompiler.prototype.tool.globalVariableContainer.tokenTable;
                    let ast_outline = root.children;
                    let length = ast_outline.length;

                    for (let i = 0; i <= length - 1;) {

                        if (ast_outline[i] && "close" === ast_outline[i].variant) {

                            ast_outline[i].type = "close";
                            break;
                        }

                        if (ast_outline[i] && "expression" === ast_outline[i].type) {

                            let node_grouping = {type: "grouping", grouping: []};

                            // 把所有连续的 expression 都打入 node_grouping 中
                            let j = i;
                            while (j <= length - 1 && "expression" === ast_outline[j].type) {

                                if (i - 1 >= 0 && ast_outline[i - 1]) {

                                    if ("select" === ast_outline[i - 1].variant) {

                                        ast_outline[j].variant = (ast_outline[j].variant === ast_outline[j].value) ? "column" : ast_outline[j].variant;
                                    } else if ("from" === ast_outline[i - 1].variant) {

                                        ast_outline[j].variant = (ast_outline[j].variant === ast_outline[j].value) ? "table" : ast_outline[j].variant;
                                    } else if ("where" === ast_outline[i - 1].variant) {

                                        ast_outline[j].variant = (ast_outline[j].variant === ast_outline[j].value) ? "condition" : ast_outline[j].variant;
                                    }
                                    ast_outline[j].token = token_table[ast_outline[j].index].type;
                                }

                                node_grouping.grouping.push(ast_outline[j]);
                                delete ast_outline[j];
                                ++j;
                            }

                            // 从 i 至 j-1 都是连续的expression
                            ast_outline[i] = node_grouping;

                            i = j;
                            if (i === j) {

                                ++i;
                            }
                            continue;
                        }

                        ++i;
                    }
                },
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

                    getASTOutlinePruned() {

                        return SQLCompiler.prototype.tool.globalVariableContainer.ast_outline_pruned;
                    },
                }
            },
        }

    });

})();