/**
 * Todo:
 * 1. 缺少 对 having 的支持
 * 2. 缺少 对 函数 的友好支持
 * Author:Lvsi
 */
(function () {

    let constContainer = {

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

        // 支持的AST节点
        supportASTNode: {

            // 支持的所有节点属性
            properties: ["type", "variant", "value", "index", "children", "subquery", "sub_query_level", "grouping", "for", "matched_bracket_index"],

            // 支持的 type 属性值
            propertyTypeAssignment: ["statement", "clause", "predicate", "expression", "grouping", "subquery"],

            // 支持的 variant 属性值
            propertyVariantAssignment: [
                "select", "update", "insert", "delete",
                "alias",
                "all columns", "column",
                "recursive",
                "from",
                "order",
                "group",
                "grouping", "clause", "subquery", "expression", "close"],

        },

        // token与AST的映射关系
        tokenRelationAST: {

            // token到句子的映射关系, 即一个token会充当句子中的什么成分(tokenMapToSentence), 即 token 可能是哪种AST节点类型
            tokenReferASTNodeType: {

                statement: ["select", "update", "delete", "insert"],

                clause: ["from", "where", "order", "group", "having", "limit"],

                predicate: ["left", "right", "inner", "full", "join"],

                // 兜底
                expression: [],
            },

            // token 值与 Type的映射
            tokenValueMapType: {

                "select": "statement",
                "update": "statement",
                "delete": "statement",
                "insert": "statement",

                "order by": "clause",
                "group by": "clause",
                "having": "clause",
                "from": "clause",
                "where": "clause",
                "limit": "clause",

                "left join": "predicate",
                "right join": "predicate",
                "inner join": "predicate",
                "full join": "predicate",
            },

            // token 值与 Variant的映射
            tokenValueMapVariant: {

                "as": "alias",
                ",": "recursive",
                "and": "recursive",
                "&&": "recursive",
                // "*": "all columns",
                ".": "object operator",
                // "on": "",

                ">": "operator",
                "<": "operator",
                "=": "operator",
                "!=": "operator",

                ";": "close",
                "(": "left_bracket",
                ")": "right_bracket",

                "desc": "sort",
                "asc": "sort",

                // 写下支持的函数列表
                "concat": "function"
            }
        },

    };

    let globalVariableContainer = {

        /**
         * Debug
         */
        debug: false,
        debug_id: 1,

        /**
         * SQL解析情况
         */
        sql: "",
        sql_error: false,
        sql_error_msg: "",
        syntactic_model: {}, // 当前的语法模型

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
    };

    let tool = {

        constContainer: constContainer,

        globalVariableContainer: globalVariableContainer,

        // 创建错误对象
        makeErrorObj(index = 0, msg = "", code = 0, extra = {}) {

            // 选出 index 附近的那些字符, 连接到一起作为错误信息, 以方便错误定位
            return {
                msg: msg,
                code: code,
                extra: extra,
            };
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

        // 获取第N个左括号的下标(从右向左)
        getLastNthLeftBracketASTIndex(n) {

            let ast_outline = globalVariableContainer.ast_outline.children;
            let length = ast_outline.length;
            let times = 0;

            for (let i = length - 1; i >= 0; --i) {

                if ("(" === ast_outline[i].value) {

                    ++times;

                    if (times === n) {

                        return i;
                    }
                }
            }

            throw new Error("Not match left bracket");
        },

        // 获取最后第N个右括号的下标(从右向左)
        getLastNthRightBracketASTIndex(n) {

            let ast_outline = globalVariableContainer.ast_outline.children;
            let length = ast_outline.length;

            let times = 0;

            for (let i = length - 1; i >= 0; --i) {

                if (")" === ast_outline[i].value) {

                    ++times;

                    if (times === n) {

                        return i;
                    }
                }
            }

            throw new Error("Not match right bracket");
        },

        // 获取子查询个数
        getSubQueryNum() {

            let token_table = globalVariableContainer.tokenTable;
            let num = 0;
            token_table.forEach((item) => {

                if (item.value === "select") {

                    ++num; // 有几个select就是有几个子查询
                }
            });

            //num -= 1;

            if (num > 2) {

                //throw new Error("只支持2层嵌套子查询");
            }

            return num;
        },

        // 根据子查询级别获取ASTOutine TODO:代码待优化
        returnASTOutlineBySubQueryLevel(root, sub_query_level) {

            function getASTOutlineOfSubQueryLevel2(root) {

                let ast_outline;
                for (let item of root.children) {

                    if (item && item.subquery) {

                        ast_outline = item.subquery;
                    }
                }

                return ast_outline;
            }

            let ast_outline;
            if (1 === sub_query_level) {

                ast_outline = root.children;
            } else if (2 === sub_query_level) {

                ast_outline = getASTOutlineOfSubQueryLevel2(root);
            } else {

                ast_outline = getASTOutlineOfSubQueryLevel2(root);
                for (let item of ast_outline) {

                    if (item && item.subquery) {

                        ast_outline = item.subquery;
                    }
                }
            }

            return ast_outline;
        },

        // 修剪AST
        pruningAST: {

            pruning(root, sub_query_level) {

                // 先  diffing
                this.diffing.diffingNodePropertyType(root, sub_query_level);
                this.diffing.diffingNodePropertyToken(root, sub_query_level);
                this.diffing.diffingNodePropertyVariant(root, sub_query_level);
                this.diffing.diffingNodePropertyMatchedBracketIndex(root, sub_query_level);

                // 然后 collapsing
                this.collapsing.collapsingSubqueryTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                this.collapsing.collapsingFunctionTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                this.collapsing.collapsingGroupingTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                // 最后 sensing grouping 即可
                this.sensing.sensingGrouping(root, sub_query_level);

                return root;
            },

            // diffing函数
            diffing: {

                // diff节点的Type属性
                diffingNodePropertyType(root, sub_query_level) {

                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);

                    let tokenValueMapType = constContainer.tokenRelationAST.tokenValueMapType;

                    for (let node of ast_outline) {

                        // 会依次为 node 的 type 赋值: statement, clause, predicate . 如果都没有则赋兜底的值: expression
                        node.type = (tokenValueMapType[node.value]) ? tokenValueMapType[node.value] : "expression";

                        // 检查所有的 type 值是否都是受支持的
                        if (constContainer.supportASTNode.propertyTypeAssignment.indexOf(node.type) < 0) {

                            throw new Error("出现非法Type属性值(" + node.type + ")节点");
                        }
                    }
                },

                // diff节点的token属性
                diffingNodePropertyToken(root, sub_query_level) {

                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let token_table = tool.globalVariableContainer.tokenTable;

                    for (let node of ast_outline) {

                        // 只要 type 是 expression 则统一加上 token 属性
                        if ("expression" === node.type) {

                            // 预处理, 把expression类型的AST节点都加上token字段
                            node.token = token_table[node.index].type;
                        }
                    }
                },

                // diff节点的Variant属性
                diffingNodePropertyVariant(root, sub_query_level) {

                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;

                    let tokenValueMapVariant = constContainer.tokenRelationAST.tokenValueMapVariant;
                    for (let i = 0; i <= length - 1; ++i) {

                        let node = ast_outline[i];

                        // 根据当前节点的 Value 对当前节点Variant进行Diff。node.variant === node.value 表示当前节点的 variant 值还是当时创建的时候给的, 所以需要对它Diff
                        node.variant = (node.variant === node.value && tokenValueMapVariant[node.value]) ? tokenValueMapVariant[node.value] : node.variant;
                    }
                },

                // diff节点的 matched_bracket_index 属性
                diffingNodePropertyMatchedBracketIndex(root, sub_query_level) {

                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;
                    let right_bracket_num = 0;

                    for (let i = 0; i <= length - 1; ++i) {

                        let node = ast_outline[i];

                        if (")" === node.value) {

                            ++right_bracket_num;
                            node.matched_bracket_index = tool.getLastNthLeftBracketASTIndex(right_bracket_num);
                        }
                    }
                }
            },

            // sensing函数(make sense)
            sensing: {

                sensingGrouping(root, sub_query_level) {

                    let map = {

                        "select": this.understandColumnList,
                        "from": this.understandTableList,

                        "values": this.understandValueList,

                        "join": this.understandJoinExprList,
                        "left join": this.understandJoinExprList,
                        "right join": this.understandJoinExprList,
                        "full join": this.understandJoinExprList,
                        "inner join": this.understandJoinExprList,

                        "where": this.understandWhereExprList,
                        "group by": this.understandGroupByExprList,
                        "order by": this.understandOrderByExprList,

                        "limit": this.understandLimitExprList,

                    };
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        if ("grouping" !== ast_outline[i].type) {

                            continue;
                        }

                        let node = ast_outline[i];
                        map[node['for']] && map[node['for']](node['grouping']);
                    }
                },

                understandColumnList(columns) {

                    let length = columns.length;
                    for (let i = 0; i <= length - 1; ++i) {

                        let pre_pre_pre_column = columns[i - 3];
                        let pre_pre_column = columns[i - 2];
                        let pre_column = columns[i - 1];
                        let column = columns[i];

                        if ("object operator" === column.variant) {

                            // 如果上一个字段是普通列
                            if (pre_column && "column" === pre_column.variant) {

                                // 给上个字段升级为表对象
                                pre_column.variant = "table";

                                // 给上上个字段升级为库对象
                                if (pre_pre_column && "object operator" === pre_pre_column.variant) {
                                    pre_pre_pre_column && (pre_pre_pre_column.variant = "database");
                                }
                            }
                        } else if (pre_column && "Identifier" === pre_column.token && "recursive" === column.variant) {

                            pre_column.variant = "column";
                        } else {

                            "Identifier" === column.token && (column.variant = "column");
                        }
                    }

                    // 使用正则验证一下
                },

                understandWhereExprList(items) {

                    let length = items.length;
                    for (let i = 0; i <= length - 1; ++i) {

                        let pre_item = items[i - 1];
                        let item = items[i];

                        if ("operator" === item.variant) {

                            // 如果上一个字段是普通列
                            if (pre_item && "Identifier" === pre_item.token) {

                                pre_item.variant = "left";
                            }
                        } else if (pre_item && "function" !== pre_item.type && "recursive" === item.variant) {

                            pre_item.variant = "right";
                        } else {

                            "Identifier" === item.token && (item.variant = "left");
                        }
                    }
                },

                understandJoinExprList(columns) {

                    let length = columns.length;
                    for (let i = 0; i <= length - 1; ++i) {

                        let pre_pre_pre_column = columns[i - 3];
                        let pre_pre_column = columns[i - 2];
                        let pre_column = columns[i - 1];
                        let column = columns[i];

                        if ("object operator" === column.variant) {

                            // 如果上一个字段是普通列
                            if (pre_column && "column" === pre_column.variant) {

                                // 给上个字段升级为表对象
                                pre_column.variant = "table";

                                // 给上上个字段升级为库对象
                                if (pre_pre_column && "object operator" === pre_pre_column.variant) {
                                    pre_pre_pre_column && (pre_pre_pre_column.variant = "database");
                                }
                            }
                        } else if (pre_column && "Identifier" === pre_column.token && "on" === column.value) {

                            pre_column.variant = "column";
                        } else {

                            "Identifier" === column.token && (column.variant = "column");
                        }
                    }
                },

                understandOrderByExprList(first) {

                    tool.pruningAST.sensing.understandColumnList(first);
                },

                understandGroupByExprList(first) {

                    tool.pruningAST.sensing.understandColumnList(first);
                },

                understandValueList(values) {

                    let length = values.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        let value = values[i];
                        if ("Numeric" === value.token || "String" === value.token) {

                            value.variant = value.token;
                        } else if ("recursive" === value.variant) {

                        } else {

                            throw new Error(tool.makeErrorObj(number.index));
                        }
                    }
                },

                understandTableList(tables) {

                    let length = tables.length;
                    for (let i = 0; i <= length - 1; ++i) {

                        let pre_table = tables[i - 1];
                        let table = tables[i];

                        if ("object operator" === table.variant) {

                            if (pre_table && "table" === pre_table.variant) {

                                // 给上个字段升级为表对象
                                pre_table.variant = "database";
                            }
                        } else {

                            // 没有写 as 的时候, 也支持识别别名table
                            "Identifier" === table.token && (table.variant = "table");
                        }
                    }

                    // 使用正则验证一下
                },

                understandLimitExprList(numbers) {

                    let length = numbers.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        let number = numbers[i];
                        if ("Numeric" === number.token) {

                            number.variant = "Numeric";
                        } else if ("recursive" === number.variant) {

                        } else {

                            throw new Error(tool.makeErrorObj(number.index));
                        }
                    }
                },
            },

            // 折叠函数
            collapsing: {

                // 折叠出 Subquery 节点
                collapsingGroupingTypeNode(root, sub_query_level) {

                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        let node = ast_outline[i], pre_node = ast_outline[i - 1];

                        if ((node && "close" !== node.variant) && (("function" === node.type) || ("expression" === node.type && "Keyword" !== node.token))) {

                            let node_grouping = {type: "grouping", grouping: []};

                            // 把所有连续的 expression 都打入 node_grouping 中
                            let j = i;
                            while (j <= length - 1 && "close" !== ast_outline[j].variant && ("function" === ast_outline[j].type || "expression" === ast_outline[j].type)) {

                                node_grouping.grouping.push(ast_outline[j]);
                                delete ast_outline[j];
                                ++j;
                            }
                            pre_node && (node_grouping['for'] = pre_node.variant);

                            // 从 i 至 j-1 都是连续的expression
                            ast_outline[i] = node_grouping;

                            i = j;
                        }
                    }
                },

                // 折叠出 Grouping 类型的节点
                collapsingSubqueryTypeNode(root, sub_query_level) {

                    // 整理出来 Subquery, Grouping 之类的
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length, left_bracket_num = 0, start, end;

                    for (let i = 0; i <= length - 1 && ast_outline[i] && ast_outline[i].value; ++i) {

                        if ("(" === ast_outline[i].value) {

                            ++left_bracket_num;
                        }

                        // 如果出现子查询, 则全部都加到query中
                        if ("(" === ast_outline[i].value && ast_outline[i - 1] && ast_outline[i - 1].value === "from") {

                            start = i;
                            end = tool.getLastNthRightBracketASTIndex(left_bracket_num);
                            let node_subquery = {type: "subquery", subquery: [], sub_query_level: sub_query_level};

                            // 把所有连续的 expression 都打入 node_subquery 中
                            for (let j = i + 1; j <= end && ast_outline[j]; ++j) {

                                if (ast_outline[i].index !== ast_outline[j].matched_bracket_index) {

                                    node_subquery.subquery.push(ast_outline[j]);
                                }

                                delete ast_outline[j];
                            }
                            ast_outline[i] = node_subquery;

                            break; // Todo:是否需要跳出
                        }
                    }
                },

                // 折叠出 Function 类型的节点
                collapsingFunctionTypeNode(root, sub_query_level) {

                    // 整理出来 Subquery, Grouping 之类的
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;

                    for (let i = 0; i <= length - 1 && ast_outline[i]; ++i) {

                        // 如果出现子查询, 则全部都加到query中
                        if ("function" === ast_outline[i].variant) {

                            let node_function = {type: "function", function: []};

                            // 未遇到 ) 括号前, 把遇到的参数都塞进去
                            "left_bracket" === ast_outline[i + 1].variant && delete ast_outline[i + 1]; // 把左括号删掉
                            let j;
                            for (j = i + 2; "right_bracket" !== ast_outline[j].variant; ++j) {

                                ast_outline[j].variant = "param";
                                node_function.function.push(ast_outline[j]);
                                delete ast_outline[j];
                            }
                            "right_bracket" === ast_outline[j].variant && delete ast_outline[j]; // 把右括号删掉
                            ast_outline[i] = node_function;
                            i = j;
                        }
                    }
                },

                // 因为折叠会出现索引连续不上和length不变的情况, 故而需要清理掉zombie数据
                rebuildASTIndex(root) {

                    let root_str = JSON.stringify(root);
                    return JSON.parse(root_str.replace(/,null/g, ""));
                },
            },
        },
    };

    let SQLCompiler = function (sql = "") {

        globalVariableContainer.sql = sql;
    };

    let debugMsg = function (msg = "", color = "color:black", level = 0) {

        if (!globalVariableContainer.debug) {
            return;
        }

        if (Array.isArray(msg)) {

            console.log(msg);
            return;
        }

        if ("color:black" === color) {

            console.log(msg);
        } else {

            console.log("%c" + globalVariableContainer.debug_id + ": " + msg, color);
            ++globalVariableContainer.debug_id;
        }

    }, debugColor = {
        info: "color:#03A9F4",
        loading: "color:#FF9800",
        success: "color:green"
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
                    throw "Error Near " + e.index + " , " + e.msg; // alert("解析失败 : " + e.message);
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

                        // 对SQL进行trim处理, 如果没有分号, 则添加
                        let sql = globalVariableContainer.sql.toLowerCase().trim();
                        if (";" !== sql[sql.length - 1]) {

                            sql += ";";
                        }

                        // 对SQL中的目标字符两侧添加空白符
                        let breakpoint_obj = constContainer.referenceTable.symbolTable;
                        delete breakpoint_obj['*']; // delete breakpoint_arr['.'];
                        delete breakpoint_obj['"'];
                        delete breakpoint_obj["'"];
                        let breakpoint_arr = tool.objectPropertyToArray(breakpoint_obj);

                        globalVariableContainer.sql_cleared = tool.insertWhiteSpaceInExceptChars(sql, breakpoint_arr);
                    },

                    demarcate() {

                        let sql = globalVariableContainer.sql_cleared;

                        // 使用空格split, 并过滤掉空元素
                        globalVariableContainer.sql_lexicon_arr = tool.trimArray(sql.split(" "));
                    },

                    // 创建 token 表, 会合并部分目标单元
                    createTokenTable() {

                        let token_arr = [];
                        let lexicon_arr = globalVariableContainer.sql_lexicon_arr;
                        let length = lexicon_arr.length;

                        for (let i = 0; i <= length - 1;) {

                            // 生成node, 并添加 index 属性
                            let lexicon = lexicon_arr[i];
                            let next_lexicon = lexicon_arr[i + 1];
                            let node = this.generateTokenNode(lexicon);

                            // 把 node 结点扔到 lexicon_arr
                            token_arr.push(node);
                            node.index = token_arr.length - 1;

                            // 如果当前词是以下, 则需要合并
                            if (["left", "right", "inner", "full"].indexOf(lexicon) > -1) {

                                node.value = lexicon + " join";
                                i += 2;
                            } else if (["group", "order"].indexOf(lexicon) > -1) {

                                node.value = lexicon + " by";
                                i += 2;
                            } else if (["!", ">", "<"].indexOf(lexicon) > -1 && "=" === next_lexicon) {

                                node.value = lexicon + "=";
                                i += 2;
                            } else {

                                ++i;
                            }
                        }

                        // token 表创建成功
                        globalVariableContainer.tokenTable = token_arr;
                    },

                    // 根据 lexicon 词汇类型, 生成 token node
                    generateTokenNode(lexicon) {

                        // {type:"",value:""}

                        // 词汇是关键字
                        let keywordTable = constContainer.referenceTable.keywordTable;
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
                        let symbolTable = constContainer.referenceTable.symbolTable;
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
                        this.decideStatement();

                        // 生成 AST Outline (创建出 AST 的轮廓)
                        this.createASTOutline();

                        // 为 AST Outline 剪枝
                        this.makeASTOutlinePruning();

                        // 将转换 AST Outline 转换成一棵 AST
                        this.makeASTOutlineTransforming();

                        // 优化 AST
                        this.optimizeAST();

                        return true;
                    },

                    decideStatement() {

                        // 根据token表中的第一个数据判断即可
                        let token_table = globalVariableContainer.tokenTable;
                        switch (token_table[0].value) {

                            case "select":
                            case "update":
                            case "delete":
                            case "insert":
                                globalVariableContainer.statement_type = token_table[0].value;
                                break;

                            default:
                                let msg = "只支持CURD操作";
                                globalVariableContainer.sql_error = true;
                                globalVariableContainer.sql_error_msg = msg;
                                throw new Error(msg);
                        }
                    },

                    createASTOutline() {

                        let token_table = globalVariableContainer.tokenTable;
                        let root = this.generateASTNode({children: []});

                        for (let token_obj of token_table) {

                            let node = this.generateASTNode({
                                type: token_obj.value,
                                variant: token_obj.value,
                                value: token_obj.value,
                                index: token_obj.index, // 一定要保证给每个节点都有index属性, 因为这个属性值用于报错定位
                            });

                            node !== null && root.children.push(node);
                        }

                        globalVariableContainer.ast_outline = root;
                    },

                    /**
                     * 修剪是为了整理节点结构, 并删除不必要的节点数据信息(如删除 AST 节点不必要的属性)
                     */
                    makeASTOutlinePruning() {

                        let sub_query_num = tool.getSubQueryNum();
                        let root = JSON.parse(JSON.stringify(globalVariableContainer.ast_outline)); // let root = Object.assign({}, globalVariableContainer.ast_outline); 引用传递, 故使用 JSON.parse 来禁止引用传递

                        // 开始修剪(按层级)
                        for (let i = 1; i <= sub_query_num; ++i) {

                            root = tool.pruningAST.pruning(root, i);
                        }

                        globalVariableContainer.ast_outline_pruned = root;
                    },

                    makeASTOutlineTransforming() {

                        // 剪枝后的 ast outline
                        let root = globalVariableContainer.ast_outline_pruned;

                        // 如果 AST Outline 有错, 则不能转成一棵AST

                        globalVariableContainer.ast_outline_transformed = root;
                    },

                    optimizeAST() {

                        // 转换后的 AST
                        let root = globalVariableContainer.ast_outline_transformed;

                        globalVariableContainer.ast = root;
                    },

                    generateASTNode(node = {}) {

                        return Object.assign({type: "root", variant: "root",}, node);
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

        tool: tool,
    };

    // 扩展JQuery
    $.fn.extend({

        SQLCompiler: function (sql = "") {

            return $(this).each(function () {

                (new SQLCompiler(sql)).init();
            });
        },

        SQLCompilerDebug: {

            // 自动化测试
            testing(sql = "") {

                let compiler = SQLCompiler.prototype.compile.steps;
                globalVariableContainer.sql = sql;
                globalVariableContainer.debug = true;

                console.time("runtime");

                // 词法分析
                debugMsg("Lexical Analysis ...", debugColor.loading);
                debugMsg("Clear SQL ... Results are as follows", debugColor.info);
                compiler.lexicalAnalysis.clear();
                debugMsg(this.steps.lexicalAnalysis.getSQLCleared());

                debugMsg("Demarcate SQL ... Results are as follows", debugColor.info);
                compiler.lexicalAnalysis.demarcate();
                debugMsg(this.steps.lexicalAnalysis.getSQLDemarcated());

                debugMsg("Create Token Table ... Results are as follows", debugColor.info);
                compiler.lexicalAnalysis.createTokenTable();
                debugMsg(this.steps.lexicalAnalysis.getTokenTable());

                debugMsg("End Lexical Analysis\n\n", debugColor.success);

                // 语法分析
                debugMsg("Syntactic Analysis ...", debugColor.loading);
                debugMsg("Decide Statement ... Results are as follows", debugColor.info);
                compiler.syntacticAnalysis.decideStatement();
                debugMsg(this.steps.syntacticAnalysis.getStatementType());

                debugMsg("Create AST Outline ... Results are as follows", debugColor.info);
                compiler.syntacticAnalysis.createASTOutline();
                debugMsg(this.steps.syntacticAnalysis.getASTOutline());

                debugMsg("Pruning AST Outline ... Results are as follows", debugColor.info);
                compiler.syntacticAnalysis.makeASTOutlinePruning();
                debugMsg(this.steps.syntacticAnalysis.getASTOutlinePruned());


                debugMsg("End Syntactic Analysis\n\n", debugColor.success);


                console.timeEnd("runtime");
            },

            // 单步, 获取每步的执行情况
            steps: {

                lexicalAnalysis: {

                    getSQLCleared() {

                        return globalVariableContainer.sql_cleared;
                    },

                    getSQLDemarcated() {

                        return globalVariableContainer.sql_lexicon_arr;
                    },

                    getTokenTable() {

                        return globalVariableContainer.tokenTable;
                    },
                },

                syntacticAnalysis: {

                    getStatementType() {

                        return globalVariableContainer.statement_type;
                    },

                    getASTOutline() {

                        return globalVariableContainer.ast_outline;
                    },

                    getASTOutlinePruned() {

                        return globalVariableContainer.ast_outline_pruned;
                    },
                }
            },
        },
    });

})();