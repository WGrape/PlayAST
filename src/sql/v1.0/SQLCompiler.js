/**
 * Tip:
 *
 * Todo:
 * 1. 默认不格式化SQL(格式化SQL会加长执行时间)
 * 2. 缺少 对 函数 的友好支持
 * 3. 字段名函数名等 identifier 被误认为关键字的bug
 * 5. 不怕输入任何的括号, 因为在词法分析阶段, 就会把那些不必要的括号都删除掉, 只留下必要的括号, 这样也方便后续处理。
 * 6. NULL 的处理
 * 7. 对 variant 属性 , value 属性的使用不太简单清晰，有点乱
 * 8. index 全部节点都有, token 只有 expression 有
 * 9. 关键字必须使用转义字符 ` , 不支持自动识别 : 如 select count ... from 此时不会自动识别 count 为 identifier
 * 10. 单纯的语法检查的话，其实不应该有那么多语义相关的判断: 如 数据库名.数据表名.字段名 , 单纯语法检查的话，是不会管到底往下写了多少个 : a.b.c.d.e.f ....
 * 11. 处理多个SQL的情况(只取第一个SQL，不支持多个SQL), 处理不必要的逗号
 * 12. 只要是括号匹配目前都可能有bug
 * 13. str[i] 替代 i<=length -1
 * 14. 未 diffingNodePropertyVariant 前用 value , diffingNodePropertyVariant 后 , 必须全部使用 variant , 除非例外
 * 15. A.* 的支持
 * Author:WGrape
 */
(function () {

    let constContainer = {

        // 参考表
        referenceTable: {

            // 符号表
            symbolTable: {

                "'": 1001,
                "\"": 1002,
                "`": 1003, // 不再对 ` 字符作为分割字符(不会再把 ` 单独拆开)
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
                    "inner": 20007,
                    "outer": 20008,
                    "full": 20009,
                    "left": 20005,
                    "right": 20006,
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
                    "having": 20022,
                    "union": 20023,
                    "is": 20024,
                    "or": 20025,
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
                },

                supportFunctions: {

                    // 值不同于上面, 这里的函数值必须写function, 因为要赋值到 tokenValueMapVariant 中
                    "distinct": "function",
                    "from_unixtime": "function",

                    "mid": "function",
                    "len": "function",

                    "first": "function",
                    "last": "function",

                    "ucase": "function",
                    "lcase": "function",

                    "round": "function",
                    "format": "function",

                    "concat": "function",
                    "length": "function",
                    "char_length": "function",
                    "upper": "function",
                    "lower": "function",

                    "year": "function",
                    "now": "function",

                    "avg": "function",
                    "sum": "function",
                    "max": "function",
                    "min": "function",
                    "count": "function",
                },
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
            },

            // Collapsed Grouping Node
            collapsedGrouping: ["select", "from", "where", "join", "left join", "right join", "inner join", "group", "group by", "having", "order", "order by", "limit", "union"],

            operatorTable: ["<", ">", "=", "<=", ">=", "!=", "<>"],
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
            properties: ["type", "variant", "value", "index", "children", "subquery", "sub_query_level", "grouping", "for", "matched_bracket_index", "function", "function_name"],

            // 支持的 type 属性值
            propertyTypeAssignment: ["statement", "clause", "predicate", "expression", "grouping", "subquery", "function"],

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
                "insert into": "statement",

                "set": "clause",
                "values": "clause",
                "order by": "clause",
                "group by": "clause",
                "having": "clause",
                "from": "clause",
                "where": "clause",
                "limit": "clause",

                "join": "predicate",
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
                "||": "recursive",
                "or": "recursive",
                "*": "column",
                ".": "object operator",
                // "on": "",

                "insert into": "insert",

                ">": "operator",
                "<": "operator",
                "<=": "operator",
                ">=": "operator",
                "=": "operator",
                "!=": "operator",
                "<>": "operator",
                "like": "operator",
                "is": "operator",
                "in": "operator",
                "between": "operator",
                "not between": "operator",

                "null": "Numeric",

                ";": "close",
                "(": "left_bracket",
                ")": "right_bracket",

                "desc": "sort",
                "asc": "sort",

                // 写下支持的函数列表
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
         *
         */
        config: {

            statement: 1, // 1:只支持增, 2:支持增删, 3:支持增删查, 4:支持增删查改
            sql: "",
            format: false, // 是否格式化SQL
        },

        /**
         * SQL解析情况
         */
        sql: "",
        sql_error: false,
        sql_error_msg: "",
        syntactic_model: {}, // 当前的语法模型

        sub_query_num: 1, // 子查询数
        union_num: 0,// 联合查询数

        /**
         * lexicalAnalysis 词法分析阶段的产物
         */
        sql_cleared: "", // 清洁后的SQL
        sql_lexicon_arr: [], // SQL词汇数组
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

        errorHandle(e) {

            if ("undefined" === typeof e.index) {

                if (e.msg) {

                    throw e.msg.toLocaleUpperCase();
                }
                throw e;
            }

            let token_table = globalVariableContainer.tokenTable, msg = "ERRNO " + e.index + " near : ";

            if (e.index < 3) {

                for (let i = 0; i <= (e.index + 3) && token_table[i]; ++i) {

                    msg = msg + token_table[i].value + " ";
                }
            } else {

                for (let i = e.index - 3; i <= e.index; ++i) {

                    msg = msg + token_table[i].value + " ";
                }
            }

            msg = ("[ " + e.msg + " ] ").toLocaleUpperCase() + msg;

            // 解析失败
            // console.error(msg); // alert("解析失败 : " + e.message);
            throw msg;
        },

        combineObjectToObject(obj, _obj) {

            return Object.assign(obj, _obj);
        },

        sqlFactory: {

            // 伪造 n 条 SQL
            fake(n = 10) {

                let sqls = [];
                let times = tool.getRandomNum(1, 5);

                while (n) {

                    sqls.push(this.fakeSQL(n, times));
                    --n;
                }

                return sqls;
            },

            // 伪造第 n 条SQL
            fakeSQL(n, times) {

                let single = this.fakeSingle(times);
                let single2 = this.fakeSingle(times);

                let single_from_single = "select " + this.fakeColumns(times) + " from ( " + single + " ) " + " where " + this.fakeClauseWhere(times) + " order by " + this.fakeClauseOrder(times) + " limit " + this.fakeClauseLimit();
                let single_from_single_from_single = "select " + this.fakeColumns(times) + " from ( " + single_from_single + " ) " + " where " + this.fakeClauseWhere(times) + " order by " + this.fakeClauseOrder(times) + " limit " + this.fakeClauseLimit();

                if (0 === n % 5) {

                    // 使用 1 个查询
                    return single;
                } else if (1 === n % 5) {

                    // 使用 2 个查询
                    return single_from_single;
                } else if (2 === n % 5) {

                    // 使用 3 个查询
                    return single_from_single_from_single;
                } else if (3 === n % 5) {

                    // 使用 union 查询
                    return single + " union " + single2;
                } else {

                    // 使用 2个查询 + UNION 查询
                    return single_from_single + " union " + single2;
                }
            },

            fakeSingle(times = 1) {

                return "select " + this.fakeColumns(times) + " from " + this.fakeTables(times) + " where " + this.fakeClauseWhere(times) + " order by " + this.fakeClauseOrder(times) + " limit " + this.fakeClauseLimit();
            },

            fakeColumns(times = 1, deny_star = false) {

                let functions = ["distinct", "count", "from_unixtime", "avg", "sum", "max", "min", "round", "mid", "len", "first", "last", "format", "concat", "length", "char_length", "upper", "lower", "year", "now"];
                let columns = ["*", "db1.table1.column1", "db1.table1.column1 alias_column1", "table1.column1", "table1.column1 as alias_column1", "table1.column1 alias_column1", "db2.table2.column2", "table2.column2", "table2.column2 alias_column2", "column1", "column1 alias_column1", "column1 as alias_column1",];

                let fake_columns = "";
                for (let i = 0; i <= times - 1; ++i) {

                    let cur = deny_star ? tool.getRandomNum(1, columns.length - 1) : tool.getRandomNum(0, columns.length - 1);
                    let column;
                    if (i % 2) {
                        column = functions[tool.getRandomNum(0, functions.length - 1)] + "( " + columns[cur] + " , param2 )";
                    } else {

                        column = columns[cur];
                    }

                    if (0 === i) {

                        fake_columns = column;
                    } else {

                        fake_columns += (", " + column);
                    }
                }

                return fake_columns;
            },

            fakeTables(times = 1) {

                let tables = ["db.table1", "table1"];

                let fake_tables = "";
                for (let i = 0; i <= times - 1; ++i) {

                    let cur = tool.getRandomNum(0, tables.length - 1);
                    if (0 === i) {

                        fake_tables = tables[cur];
                    } else {

                        fake_tables += (", " + tables[cur]);
                    }
                }

                return fake_tables;
            },

            // 伪造 where 子句
            fakeClauseWhere(times = 1) {

                let operators = [">", "<", "=", ">=", "<=", "!=", "<>", "like", "is null", "is not null"];

                let fake_where = "";
                for (let i = 0; i <= times - 1; ++i) {

                    let cur = tool.getRandomNum(0, operators.length - 1);
                    let left = this.fakeColumns(1, true), operator = operators[cur], right = this.fakeValues(1);

                    if (operator.indexOf("null") > -1) {

                        right = "";
                    }

                    if (0 === i) {

                        fake_where = (left + " " + operator + " " + right);
                    } else {

                        fake_where += (" AND " + left + " " + operator + " " + right);
                    }
                }

                return fake_where;
            },

            // 伪造 join 子句
            fakeClauseJoin() {

            },

            // 伪造 group 子句
            fakeClauseGroup() {

                return "group by " + this.fakeColumns(1, true);
            },

            fakeClauseHaving() {

                // return "having"
            },

            // 伪造 order 子句
            fakeClauseOrder(times = 1) {

                let fake_order = "";
                let order = ["", " desc", " asc"];

                for (let i = 0; i <= times - 1; ++i) {

                    if (0 === i) {

                        fake_order = this.fakeColumns(1, true) + order[i % 3];
                    } else {

                        fake_order += (", " + this.fakeColumns(1, true) + order[i % 3]);
                    }
                }

                return fake_order;
            },

            // 伪造 limit 子句
            fakeClauseLimit() {

                let needle = tool.getRandomNum(10, 9999);

                if (needle % 2) {

                    return this.fakeValues(1, true) + " , " + this.fakeValues(1, true);
                } else {

                    return this.fakeValues(1, true);
                }
            },

            fakeValues(times = 1, mustNumber = false) {

                let lexicon = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

                let fake_values = "";
                for (let i = 0; i <= times - 1; ++i) {

                    let fake_value;

                    if (0 === tool.getRandomNum(10, 1000) % 2 && !mustNumber) {

                        fake_value = "\"" + lexicon[tool.getRandomNum(0, lexicon.length - 1)] + "_fake\"";
                    } else {

                        fake_value = tool.getRandomNum(10, 9999);
                    }

                    if (0 === i) {

                        fake_values += fake_value;
                    } else {

                        fake_values += (", " + fake_value);
                    }
                }

                return fake_values;
            }
        },

        bracketMatchedByStack(from, ast_outline) {

            let stack = [], end = -1;
            for (let j = from; ast_outline[j]; ++j) {

                if ("left_bracket" === ast_outline[j].variant) {

                    stack.push("(");
                } else if ("right_bracket" === ast_outline[j].variant && stack.length === 0) {

                    end = j - 1;
                    delete ast_outline[j];
                    break;
                } else if ("right_bracket" === ast_outline[j].variant && "(" === stack[stack.length - 1]) {

                    stack.pop();
                }

                if (!ast_outline[j + 1]) {

                    end = j;
                    break;
                }
            }

            if (end < 0) {

                throw tool.makeErrorObj(false, "No match Subquery");
            }

            return end;
        },

        pickContinuousExpression: {

            ofBracket(from, end, nodes) {

                let node_bracket = {type: "bracket", bracket: []};
                for (let j = from; j <= end && nodes[j]; ++j) {

                    node_bracket.bracket.push(nodes[j]);
                    delete nodes[j];
                }

                return node_bracket;
            },

            ofSubquery(from, end, sub_query_level, ast_outline) {

                let node_subquery = {type: "subquery", subquery: [], sub_query_level: sub_query_level};
                for (let j = from; j <= end && ast_outline[j]; ++j) {

                    node_subquery.subquery.push(ast_outline[j]);
                    delete ast_outline[j];
                }

                return node_subquery;
            },

            ofUnion(from, union_level, ast_outline) {

                // 初始化
                let node_union = {type: "union", union: [], union_level: union_level};
                if (ast_outline[from + 1] && "all" === ast_outline[from + 1].value) {

                    from = from + 2;
                    node_union.type = "union all"
                } else {

                    from = from + 1;
                }

                // 找到 end
                let end = ast_outline.length - 1;
                for (let j = from; ast_outline[j]; ++j) {

                    if ("union" === ast_outline[j].value) {

                        end = j - 1;
                        break;
                    }
                }

                for (let j = from; j <= end && ast_outline[j]; ++j) {

                    node_union.union.push(ast_outline[j]);
                    delete ast_outline[j];
                }

                return node_union;
            },

            ofGrouping(from, keyword, ast_outline, groupingFor) {

                let j = from;
                let node_grouping = {type: "grouping", grouping: [], for: groupingFor};
                while (1) {

                    let son = ast_outline[j];
                    if (!son) {

                        break;
                    }

                    if ("union" === son.type && !son.value) {

                        break;
                    }

                    if ("close" === son.variant) {

                        break;
                    }

                    if (son.value && keyword.indexOf(son.value) > -1) {

                        break;
                    }

                    node_grouping.grouping.push(son);
                    delete ast_outline[j];
                    ++j;
                }

                return {node_grouping: node_grouping, end: j};
            },
        },

        // 获取 min-max 随机数
        getRandomNum(minNum, maxNum) {

            switch (arguments.length) {
                case 1:
                    return parseInt(Math.random() * minNum + 1, 10);
                case 2:
                    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                default:
                    return 0;
            }
        },

        // 返回关键字数组
        returnKeywordArray() {

            let arr = [];

            let curs = ['insertStatement', 'deleteStatement', 'updateStatement', 'selectStatement', 'curdStatement', 'supportFunctions'];

            for (let cur of curs) {

                let obj = constContainer.referenceTable.keywordTable[cur];
                for (let property in obj) {

                    if (obj.hasOwnProperty(property)) {

                        arr.push(property);
                    }
                }
            }

            arr.push("null");

            return arr;
        },

        // 根据属性把一个数组转成一个新数组
        arrayToNewArrayByProperty(arr, property, callback = () => true) {

            let new_array = [];

            for (let item of arr) {

                callback(item) && item[property] && new_array.push(item[property]);
            }

            return new_array;
        },

        // 对象的属性是否还是对象(供遍历对象使用)
        propertyIsObj(obj) {

            return $.isPlainObject(obj);
        },

        // 对象遍历
        traverseObj(obj, callback) {

            if (!tool.propertyIsObj(obj)) {

                return;
            }

            let properties = Object.getOwnPropertyNames(obj);

            for (let property of properties) {


                if (Array.isArray(obj[property])) {

                    for (let item of obj[property]) {

                        tool.traverseObj(item, callback);
                    }

                } else if (tool.propertyIsObj(obj[property])) {

                    tool.traverseObj(obj[property], callback);
                } else {

                    // console.log("property : " + property + " , value : " + obj[property]);
                    callback(obj, property);
                }
            }
        },

        // 创建连续的字符串
        makeContinuousStr(n, str = " ") {

            return new Array(n + 1).join(str);
        },

        // 创建错误对象
        makeErrorObj(index = false, msg = "", code = 0, extra = {}) {

            // 选出 index 附近的那些字符, 连接到一起作为错误信息, 以方便错误定位
            let obj = {
                msg: msg,
                index: index,
                code: code,
                extra: extra,
            };

            false === index && delete obj.index;

            return obj;
        },

        makeErrorObjOfRegError(obj, msg) {

            if (Array.isArray(obj)) {

                return tool.makeErrorObj((obj[0] && obj[0].index) ? obj[0].index : false, msg);
            }

            return tool.makeErrorObj((obj && obj.index) ? obj.index : false, msg);
        },

        // 在特定位置替换字符
        strReplacePos(text, start, stop, replace_text) {

            return text.substring(0, stop) + replace_text + text.substring(stop + 1);
        },

        // 在期望的字符处插入空白
        insertWhiteSpaceInExceptChars(str, except_chars) {

            // function insertStr(source, start, newStr) { return source.slice(0, start) + newStr + source.slice(start) }
            // https://blog.csdn.net/weixin_42203183/article/details/84257252
            // function replacePos(text, start, stop, replace_text) { return text.substring(0, stop) + replace_text + text.substring(stop + 1); }

            for (let i = 0; str[i];) {

                if (["'", '"', "`"].indexOf(str[i]) > -1) {

                    // 跳过, 跳到下一个非 ["'", '"', "`"] 字符为止
                    let j, boundary = str[i];
                    for (j = i + 1; str[j]; ++j) {

                        if (boundary === str[j]) {

                            break;
                        }
                    }
                    i = j + 1;
                }

                // 发现符号
                let index = except_chars.indexOf(str[i]);
                if (index >= 0) {

                    str = this.strReplacePos(str, i, i, " " + except_chars[index] + " ");
                    i = i + 3;
                    continue;
                }
                ++i;
            }

            return str;
        },

        // 过滤数组空元素
        trimArray(arr) {

            arr = arr.filter((item) => item.length > 0 && item.trim() !== "");

            return arr.map((item) => {

                // 处理的特殊字符(如换行符号)
                return item.replace(/[\r\n]/g, "");
            });
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
        getLastNthLeftBracketASTIndex(n, fromleft = false) {

            let ast_outline = globalVariableContainer.ast_outline.children;
            let length = ast_outline.length;
            let times = 0;

            if (fromleft) {

                for (let i = 0; i <= length - 1; ++i) {

                    if ("(" === ast_outline[i].value) {

                        ++times;

                        if (times === n) {

                            return i;
                        }
                    }
                }

            } else {

                for (let i = length - 1; i >= 0; --i) {

                    if ("(" === ast_outline[i].value) {

                        ++times;

                        if (times === n) {

                            return i;
                        }
                    }
                }
            }

            throw tool.makeErrorObj(false, "Not " + n + "th match left bracket");
        },

        // 获取最后第N个右括号的下标(从右向左)
        getLastNthRightBracketASTIndex(n, fromleft = false) {

            let ast_outline = globalVariableContainer.ast_outline.children;
            let length = ast_outline.length;
            let times = 0;

            if (fromleft) {

                for (let i = 0; i <= length - 1; ++i) {

                    if (")" === ast_outline[i].value) {

                        ++times;

                        if (times === n) {

                            return i;
                        }
                    }
                }
            } else {

                for (let i = length - 1; i >= 0; --i) {

                    if (")" === ast_outline[i].value) {

                        ++times;

                        if (times === n) {

                            return i;
                        }
                    }
                }
            }

            throw tool.makeErrorObj(false, "Not " + n + "th match right bracket");
        },

        getStrLastNthCharIndex(str, ch, n) {

            let length = str.length, times = 0;
            for (let i = length - 1; str[i]; --i) {

                if (ch === str[i]) {

                    ++times;
                }

                if (n === times) {

                    return i;
                }
            }

            throw tool.makeErrorObj(false, "No last " + n + "th char in " + str);
        },

        // 获取下一个目标字符的下标
        getStrNextTargetCharIndex(str, target, from = 0) {

            let i;
            for (i = from; str[i]; ++i) {

                if (target === str[i]) {

                    return i;
                }
            }

            throw tool.makeErrorObj(false, "No next " + target + " in " + str);
        },

        // 获取字符串中匹配的右括号的下标
        getStrMatchedRightBracketIndex(str, from = 0) {

            let stack = [];

            for (let i = from; str[i]; ++i) {

                if ("(" === str[i]) {

                    stack.push(str[i]);
                } else if (")" === str[i] && stack.length === 0) {

                    return i;
                } else if (")" === str[i] && "(" === stack[stack.length - 1]) {

                    stack.pop();
                }
            }

            throw tool.makeErrorObj(false, "No matched right bracket" + " in " + str);
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

            if (num > 3) {

                throw tool.makeErrorObj(false, "只支持3层嵌套子查询");
            }

            num = (num < 1) ? 1 : num;

            globalVariableContainer.sub_query_num = num;

            return num;
        },

        // 根据子查询级别获取ASTOutine TODO:代码待优化
        returnASTOutlineBySubQueryLevel(root, sub_query_level) {

            function getASTOutlineOfSubQueryLevel2(root) {

                for (let item of root.children) {

                    if (item && item.subquery) {

                        return item.subquery;
                    }

                    if (item && item.union) {

                        return item.union;
                    }
                }
            }

            // 1. select from ( select ) union
            // 2. select from ( select union select )
            // 3. select union select from ( select )
            function getASTOutlineOfSubQueryLevel3(root) {

                let parent_node = null;

                for (let item of root.children) {

                    if (item && item.subquery) {

                        parent_node = item.subquery;
                    }

                    if (item && item.union) {

                        parent_node = item.union
                    }
                }

                return parent_node;
            }

            let ast_outline;
            if (1 === sub_query_level) {

                ast_outline = root.children;
            } else if (2 === sub_query_level) {

                ast_outline = getASTOutlineOfSubQueryLevel2(root);
            } else {

                ast_outline = getASTOutlineOfSubQueryLevel3(root);
                for (let item of ast_outline) {

                    if (item && item.subquery) {

                        ast_outline = item.subquery;
                        break;
                    }

                    if (item && item.union) {

                        ast_outline = item.union;
                        break;
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

                // 然后 collapsing
                this.collapsing.collapsingSubqueryTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                this.collapsing.collapsingUnionTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                this.collapsing.collapsingFunctionTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                this.collapsing.collapsingGroupingTypeNode(root, sub_query_level);
                root = this.collapsing.rebuildASTIndex(root);

                // 最后 sensing grouping 即可
                this.sensing.sensingGrouping(root, sub_query_level);
                root = tool.pruningAST.collapsing.rebuildASTIndex(root);// 最后再重建一下索引, 因为understandWhere那里又有删除节点的操作

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

                            throw tool.makeErrorObj(node.index, "出现非法Type属性值(" + node.type + ")节点");
                        }
                    }
                },

                // diff节点的token属性
                diffingNodePropertyToken(root, sub_query_level) {

                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let token_table = tool.globalVariableContainer.tokenTable;

                    for (let node of ast_outline) {

                        // 只要 type 是 expression 则统一加上 token 属性
                        if ("expression" === node.type && token_table[node.index]) {

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
            },

            // sensing函数(make sense)
            sensing: {

                sensingGrouping(root, sub_query_level) {

                    let grouping_for_map = {

                        "select": (columns) => this.understandColumnList(columns, "select"),

                        // "insert": (tables) => this.understandTableList(tables, "insert"),
                        "from": (tables) => this.understandTableList(tables, "from"),
                        "update": (tables) => this.understandTableList(tables, "update"),

                        // "values": this.understandValueList,

                        "where": (items) => this.understandWhereExprList(items, "where"),
                        "set": (items) => this.understandWhereExprList(items, "set"),
                        "having": (items) => this.understandWhereExprList(items, "having"),

                        "group by": this.understandGroupByExprList,
                        "order by": this.understandOrderByExprList,

                        "limit": this.understandLimitExprList,

                    };
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        let node = ast_outline[i];

                        if ("grouping" !== node.type) {

                            continue;
                        } else if ("values" === node['for']) {

                            this.sensingGroupingSpeciallyForValues(node);
                            continue;
                        } else if ("insert" === node['for']) {

                            this.sensingGroupingSpeciallyForInsert(node);
                            continue;
                        } else if (node['for'] && node['for'].indexOf("join") > -1) {

                            this.sensingGroupingSpeciallyForJoin(node);
                            continue;
                        }

                        grouping_for_map[node['for']] && grouping_for_map[node['for']](node['grouping']);
                    }
                },

                sensingGroupingSpeciallyForValues(node) {

                    node = node.grouping;

                    // 从第一个左括号(不包括)到第1个右括号的都是待 understand values
                    let is_target = false;
                    let values = [];
                    for (let column of node) {

                        if ("(" === column.value) {

                            is_target = true;
                            continue;
                        } else if (")" === column.value) {

                            is_target = false;
                            break;
                        }

                        is_target && values.push(column);
                    }

                    tool.pruningAST.sensing.understandValueList(values);
                },

                sensingGroupingSpeciallyForInsert(node) {

                    node = node.grouping;

                    // understand tables & understand columns

                    // 从当前到第一个左括号之前的都是待 understand tables
                    let tables = [];
                    for (let table of node) {

                        if ("(" === table.value) {

                            break;
                        }
                        tables.push(table);
                    }
                    tool.pruningAST.sensing.understandTableList(tables, "insert");

                    // 从第一个左括号(不包括)到第1个右括号的都是待 understand columns
                    let is_target = false;
                    let columns = [];
                    for (let column of node) {

                        if ("(" === column.value) {

                            is_target = true;
                            continue;
                        } else if (")" === column.value) {

                            is_target = false;
                            break;
                        }

                        is_target && columns.push(column);
                    }

                    tool.pruningAST.sensing.understandColumnList(columns, "insert");
                },

                sensingGroupingSpeciallyForJoin(node) {

                    node = node.grouping;

                    // understand tables & understand columns

                    // 从 on 之前的都是 understand tables
                    let tables = [];
                    for (let table of node) {

                        if ("on" === table.value && "on" === table.variant && "Keyword" === table.token) {

                            break;
                        }
                        tables.push(table);
                    }
                    tool.pruningAST.sensing.understandTableList(tables, "join");

                    // 从 on 之后的都是 understand where
                    let is_target = false;
                    let columns = [];
                    for (let column of node) {

                        if ("on" === column.value) {

                            is_target = true;
                            continue;
                        }

                        is_target && columns.push(column);
                    }

                    tool.pruningAST.sensing.understandWhereExprList(columns, "join");
                },

                understandColumnList(columns, clause = "select") {

                    let length = columns.length;
                    if ("insert" !== globalVariableContainer.statement_type && length < 1) {

                        throw tool.makeErrorObj(false, "column must be not empty");
                    }
                    for (let i = 0; i <= length - 1; ++i) {

                        let pre_pre_pre_column = columns[i - 3];
                        let pre_pre_column = columns[i - 2];
                        let pre_column = columns[i - 1];
                        let column = columns[i];

                        if ("order by" === clause && "sort" === column.variant) {

                            continue;
                        } else if ("object operator" === column.variant) {

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

                            ("function" === column.variant || "Identifier" === column.token || "String" === column.token) && (column.variant = "column");
                        }
                    }

                    // 使用正则验证一下
                    let reg = new RegExp(/^\s*((database\s*object operator\s*table\s*object operator\s*column|table\s*object operator\s*column|(column\s*){1,2})\s*(column){0,1}\s*)(|recursive\s*(database\s*object operator\s*table\s*object operator\s*column|table\s*object operator\s*column|(column\s*){1,2})\s*(column){0,1}\s*)+$/g);
                    let str = tool.arrayToNewArrayByProperty(columns, "variant", (column) => ["alias"].indexOf(column.variant) < 0).join(" ");
                    if ("order by" !== clause && !reg.test(str)) {

                        throw tool.makeErrorObjOfRegError(columns, clause + " clause error");
                    }
                },

                understandWhereExprList(items, clause = "where") {

                    let operator_num = 0;
                    for (let i = 0; items[i]; ++i) {

                        let pre_item = items[i - 1];
                        let item = items[i];

                        if ("set" === clause && "operator" === item.variant && "=" !== item.value) {

                            throw tool.makeErrorObjOfRegError(item, "operator error, set clause must be equal operator");
                        }

                        if ("left_bracket" === item.variant) {

                            // 找出 end 节点
                            let end = tool.bracketMatchedByStack(i + 1, items);
                            delete items[i];
                            items[i] = tool.pickContinuousExpression.ofBracket(i + 1, end, items);
                            items[i].variant = "right";
                            i = end;
                            continue;
                        }
                        // 运算符和间断符
                        if ("operator" === item.variant) {

                            item.variant = "operator";
                            ++operator_num;
                            continue;
                        } else if ("recursive" === item.variant) {

                            operator_num = ("left" === pre_item.variant) ? (operator_num + 2) : (operator_num + 1)
                            continue;
                        }

                        // 左右运算数
                        if (0 === operator_num % 2) {

                            item.variant = "left";
                        } else {

                            item.variant = "right";
                        }
                    }

                    items = tool.pruningAST.collapsing.rebuildASTIndex(items); // 因为前面的循环中又做了删除节点的操作

                    // 使用正则验证一下
                    // let reg = new RegExp(/^((\s*left)*(\s*operator)*(\s*right)*\s*)(\s*recursive\s*(\s*left)+\s*operator(\s*right)+\s*)*$/);
                    let reg = new RegExp(/^(((\s*left)*(\s*operator)*(\s*right)*\s*)|(((\s*left)*(\s*operator)*(\s*right)*\s*recursive\s*left)))(\s*recursive\s*(\s*left)+\s*operator(\s*right)+\s*)*$/);
                    let str = tool.arrayToNewArrayByProperty(items, "variant", (expr) => ["left_bracket", "right_bracket"].indexOf(expr.variant) < 0).join(" ");
                    if (!reg.test(str)) {

                        throw tool.makeErrorObjOfRegError(items, clause + " clause error");
                    }
                },

                understandOrderByExprList(first) {

                    tool.pruningAST.sensing.understandColumnList(first, "order by");

                    // 使用正则验证一下
                    let reg = new RegExp(/^\s*((database\s*object operator\s*table\s*object operator\s*column|table\s*object operator\s*column|column)\s*(column){0,1}\s*(sort){0,1}\s*)(|recursive\s*(database\s*object operator\s*table\s*object operator\s*column|table\s*object operator\s*column|column)\s*(column){0,1}\s*(sort){0,1}\s*)+$/g);
                    let str = tool.arrayToNewArrayByProperty(first, "variant", (column) => ["alias"].indexOf(column.variant) < 0).join(" ");
                    if (!reg.test(str)) {

                        throw tool.makeErrorObjOfRegError(first, "order by clause error");
                    }
                },

                understandGroupByExprList(first) {

                    tool.pruningAST.sensing.understandColumnList(first, "group by");
                },

                understandValueList(values) {

                    let length = values.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        let value = values[i];
                        if ("Numeric" === value.token || "String" === value.token) {

                            value.variant = value.token;
                        } else if ("recursive" === value.variant) {

                        } else {

                            throw tool.makeErrorObj(value.index, "value list error");
                        }
                    }

                    // 正则匹配
                    let reg = new RegExp(/^\s*(Numeric|String)(|\s*recursive\s*(Numeric|String))+$/);
                    let str = tool.arrayToNewArrayByProperty(values, "variant").join(" ");
                    if (!reg.test(str)) {

                        throw tool.makeErrorObjOfRegError(values, "value list error");
                    }
                },

                understandTableList(tables, clause = "") {

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
                    let reg = new RegExp(/^\s*((database\s*object operator\s*table\s*table|database\s*object operator\s*table|table\s*table|table)\s*)(|recursive\s*(database\s*object operator\s*table\s*table|database\s*object operator\s*table|table\s*table|table)\s*)+$/g);
                    let str = tool.arrayToNewArrayByProperty(tables, "variant", (column) => "alias" !== column.variant).join(" ");
                    if (!reg.test(str)) {

                        throw tool.makeErrorObjOfRegError(tables, clause + " table list error");
                    }
                },

                understandLimitExprList(numbers) {

                    let length = numbers.length;

                    for (let i = 0; i <= length - 1; ++i) {

                        let number = numbers[i];
                        if ("Numeric" === number.token) {

                            number.variant = "Numeric";
                        } else if ("recursive" === number.variant) {

                        } else {

                            throw tool.makeErrorObj(number.index, "limit clause error");
                        }
                    }

                    // 使用正则验证一下
                    let reg = new RegExp(/^\s*Numeric(|\srecursive\sNumeric)$/);
                    if (!reg.test(tool.arrayToNewArrayByProperty(numbers, "variant").join(" "))) {

                        throw tool.makeErrorObjOfRegError(numbers, "limit clause error");
                    }
                },
            },

            // 折叠函数
            collapsing: {

                // 折叠出 Grouping 类型的节点
                collapsingGroupingTypeNode(root, sub_query_level) {

                    let keyword = constContainer.referenceTable.collapsedGrouping;
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    for (let i = 0; ast_outline[i]; ++i) {

                        let pre_node = ast_outline[i - 1];
                        if (!pre_node || keyword.indexOf(pre_node.value) < 0) {

                            continue;
                        }

                        // 如果 pre_node 是from节点, 那么 node 可能是子查询, 所以需要判断一下当前节点是否含有 node.value 来判断是否是可以捡入 node_grouping 中
                        if ("from" === pre_node.variant) {
                            continue;
                        }

                        // 把所有连续的 expression 都捡入 node_grouping 中 (如果还有其他不得捡入的情况, 也需要加到上面的if条件中)
                        let obj = tool.pickContinuousExpression.ofGrouping(i, keyword, ast_outline, pre_node.value);
                        ast_outline[i] = obj.node_grouping;
                        i = obj.end;
                    }
                },

                // 折叠出 Subquery 节点
                collapsingSubqueryTypeNode(root, sub_query_level) {

                    // 整理出来 Subquery, Grouping 之类的
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);

                    for (let i = 0; ast_outline[i]; ++i) {

                        let node = ast_outline[i], pre_node = ast_outline[i - 1];
                        if (!ast_outline[i - 1]) {

                            continue;
                        }

                        // 如果出现子查询, 则全部都加到query中
                        if ("left_bracket" === node.variant && pre_node.variant === "from") {

                            // 找出 end 节点
                            let end = tool.bracketMatchedByStack(i + 1, ast_outline);

                            // 把所有连续的 expression 都打入 node_subquery 中
                            ast_outline[i] = tool.pickContinuousExpression.ofSubquery(i + 1, end, sub_query_level, ast_outline);
                            break; // 就算是不break,由于未重建索引, 不会再存在i+1节点了, 所以走到for循环那里也不会通过ast_outline[i]条件的
                        }
                    }
                },

                // 折叠出 UNION 节点
                collapsingUnionTypeNode(root, union_level) {

                    // 整理出来 Subquery, Grouping 之类的
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, union_level);

                    for (let i = 0; ast_outline[i]; ++i) {

                        if ("union" !== ast_outline[i].value) {

                            continue;
                        }

                        // 把所有连续的 expression 都打入 node_union 中
                        ast_outline[i] = tool.pickContinuousExpression.ofUnion(i, union_level, ast_outline);
                    }
                },

                // 折叠出 Function 类型的节点
                collapsingFunctionTypeNode(root, sub_query_level) {

                    // 整理出来 Subquery, Grouping 之类的
                    let ast_outline = tool.returnASTOutlineBySubQueryLevel(root, sub_query_level);
                    let length = ast_outline.length;

                    for (let i = 0; i <= length - 1 && ast_outline[i]; ++i) {

                        // 如果出现函数, 则全部都加到node_function中
                        if ("function" === ast_outline[i].variant) {

                            let node_function = {
                                type: "function",
                                variant: "function",
                                function: [],
                                function_name: ast_outline[i].value
                            };

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

                        if ("insert" !== globalVariableContainer.statement_type && ast_outline[i] && "Keyword" !== ast_outline[i].token && ast_outline[i + 1] && "(" === ast_outline[i + 1].value) {

                            // 疑似函数, 但此并不是支持的函数, 暂时不检查不存在的函数, 因为可能会存在一些自定义的函数
                            // throw tool.makeErrorObj(ast_outline[i].index, ast_outline[i].value + "不是所支持的函数");
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
    constContainer.tokenRelationAST.tokenValueMapVariant = tool.combineObjectToObject(
        constContainer.tokenRelationAST.tokenValueMapVariant,
        constContainer.referenceTable.keywordTable.supportFunctions
    );

    let SQLCompiler = function (config = {sql: ""}) {


        globalVariableContainer.config = Object.assign({sql: ""}, config);
        globalVariableContainer.sql = config.sql;
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

                    tool.errorHandle(e);
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

                    preClear: {

                        doing() {

                            let sql = globalVariableContainer.sql;

                            sql = this.preClearMixResolving(sql);
                            sql = this.preClearBoundarySymbol(sql);

                            return sql;
                        },

                        preClearMixResolving(sql) {

                            // 不能出现不支持的字符
                            let not_allowed_chars = [];


                            // 处理分号
                            sql = sql.split(";")[0];
                            sql = sql.trim().replace(";", "");
                            if (";" !== sql[sql.length - 1]) {

                                sql += ";";
                            }

                            // 把 SQL 中的换行符全部替代成空格
                            sql = sql.replace(/[\r\n]/g, " ").trim();

                            return sql;
                        },

                        preClearBoundarySymbol(sql) {

                            // 处理不必要的括号(OR运算符除外)
                            // 如果不是函数, 不是子查询 则就是不必要的括号
                            // 函数的区分方式是 当前字符是(, 且前面的字符不是空格, 是一个字符
                            // 子查询区分方式是 当前字符是(, 且前面的字符是空格
                            let j, k;
                            for (let i = 0; sql[i]; ++i) {

                                if ("(" === sql[i]) {

                                    if (" " === sql[i - 1]) {

                                        // 判断是否是子查询 : 向左搜到第一个不为空格的字符为止, 向右搜到第一个不为空格的字符为止
                                        for (j = i - 1; " " === sql[j]; --j) ;
                                        for (k = i + 1; " " === sql[k]; ++k) ;
                                        if ("from" === sql.slice(j - 3, j + 1).toLocaleLowerCase() && "select" === sql.slice(k, k + 6).toLocaleLowerCase()) {

                                            continue;
                                        }

                                        // 从下一个匹配的右括号开始向右找到第一个不为空格的字符为止
                                        for (j = tool.getStrNextTargetCharIndex(sql, ")", i) + 1; " " === sql[j]; ++j) {
                                        }
                                        if ("values" === sql.slice(j, j + 6).toLocaleLowerCase()) {

                                            continue;// 判断是否是values插入操作 :
                                        } else if ("or" === sql.slice(j, j + 2).toLocaleLowerCase()) {

                                            continue;// 判断是否是or运算符
                                        }


                                        // 从当前字符开始向左搜到第一个不为空格的字符为止
                                        for (j = i - 1; " " === sql[j]; --j) {
                                        }
                                        if ("values" === sql.slice(j - 5, j + 1).toLocaleLowerCase()) {

                                            continue;
                                        }
                                        if ("in" === sql.slice(j - 1, j + 1).toLocaleLowerCase()) {

                                            continue;
                                        }


                                    } else if (" " !== sql[i - 1]) {

                                        // 函数 不做处理
                                        continue;
                                    }

                                    // 删除掉无用的括号
                                    sql = tool.strReplacePos(sql, i, i, " ");

                                    // 找到下一个右括号并删除
                                    j = tool.getStrNextTargetCharIndex(sql, ")", i);
                                    sql = tool.strReplacePos(sql, j, j, " ");
                                }
                            }

                            return sql;
                        },
                    },

                    clear() {

                        // 对SQL进行trim处理, 如果没有分号, 则添加
                        let sql = this.preClear.doing();

                        // 对SQL中的目标字符两侧添加空白符
                        let breakpoint_obj = constContainer.referenceTable.symbolTable; // delete breakpoint_obj['*']; // delete breakpoint_arr['.']; // delete breakpoint_obj['"']; // delete breakpoint_obj["'"]; // delete breakpoint_obj["`"];
                        let breakpoint_arr = tool.objectPropertyToArray(breakpoint_obj);
                        globalVariableContainer.sql_cleared = tool.insertWhiteSpaceInExceptChars(sql, breakpoint_arr);
                    },

                    demarcate() {

                        let sql = globalVariableContainer.sql_cleared;

                        // 先跳过引号和转义号包着的字符串
                        let length = sql.length;
                        let sql_lexicon_arr = [];
                        let quotes = ["'", '"', "`", "["];
                        let left, leftChar, right, rightChar;
                        for (let i = 0; i <= length - 1;) {

                            left = i;
                            leftChar = (sql[i] === "[") ? "]" : sql[i];

                            // 当前字符是引号
                            if (quotes.indexOf(sql[i]) > -1) {

                                // 找下一个匹配的右边字符
                                for (right = left + 1; right <= length - 1; ++right) {

                                    if (leftChar === sql[right]) {

                                        rightChar = sql[right];
                                        break;
                                    }
                                }
                                if (length === right) {

                                    throw tool.makeErrorObj(false, "右侧没有找到匹配的字符" + leftChar);
                                }
                                sql_lexicon_arr.push(sql.slice(left, right + 1));
                                i = right + 1;
                            }

                            // 当前字符是空格
                            else if (" " === sql[i]) {

                                ++i;
                            }

                            // 当前是普通字符
                            else {

                                // 找出连续没有空格的字符串
                                for (right = left + 1; right <= length - 1 && " " !== sql[right]; ++right) {
                                }
                                sql_lexicon_arr.push(sql.slice(left, right));
                                i = right + 1;
                            }
                        }

                        // 使用空格split, 并过滤掉空元素
                        globalVariableContainer.sql_lexicon_arr = tool.trimArray(sql_lexicon_arr);

                        this.afterDemarcate.doing();
                    },

                    afterDemarcate: {

                        doing() {

                        },
                    },

                    // 根据 lexicon 词汇类型, 生成 token node
                    generateTokenNode(lexicon) {

                        // {type:"",value:""}

                        // 词汇是关键字
                        let lexiconLowerCase = lexicon.toLocaleLowerCase();
                        let keywordTable = tool.returnKeywordArray();
                        if (keywordTable.indexOf(lexiconLowerCase) > -1) {

                            return {type: "Keyword", value: lexiconLowerCase};
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
                    },

                    // 创建 token 表, 会合并部分目标单元
                    createTokenTable() {

                        let token_arr = [];
                        let lexicon_arr = globalVariableContainer.sql_lexicon_arr;
                        let length = lexicon_arr.length;

                        for (let i = 0; i <= length - 1;) {

                            // 生成node, 并添加 index 属性
                            let lexicon_raw = lexicon_arr[i];
                            let last_node = token_arr[token_arr.length - 1];
                            let node = this.generateTokenNode(lexicon_raw);
                            let lexicon = lexicon_arr[i].toLocaleLowerCase();
                            let next_lexicon = (lexicon_arr[i + 1]) ? lexicon_arr[i + 1].toLocaleLowerCase() : undefined;

                            // 如果当前词是以下, 则需要合并
                            if ("insert" === lexicon) {

                                if (next_lexicon && "into" !== next_lexicon) {

                                    throw tool.makeErrorObj(1, "Insert语句缺少into");
                                }
                                node.value = lexicon + " into";
                                i += 2;
                            } else if (["left", "right", "inner", "full"].indexOf(lexicon) > -1) {

                                node.value = lexicon + " join";
                                i += 2;
                            } else if (["group", "order"].indexOf(lexicon) > -1) {

                                node.value = lexicon + " by";
                                i += 2;
                            } else if ("Punctuator" === node.type && "Punctuator" === last_node.type && ["<>", ">=", "<=", "!=", "=<", "=>", "=!"].indexOf(last_node.value + node.value) > -1) {

                                last_node.value += node.value;
                                i++;
                                continue;
                            } else if ("not" === lexicon && "between" === next_lexicon) {

                                node.value = "not between";
                                i += 2;
                            } else {

                                ++i;
                            }

                            // 把 node 结点扔到 lexicon_arr
                            token_arr.push(node);
                            node.index = token_arr.length - 1;
                        }

                        // 检查并修复token表
                        token_arr = this.afterCreateTokenTable.checkAndFixTokenTable(token_arr);

                        // token 表创建成功
                        globalVariableContainer.tokenTable = token_arr;
                    },

                    afterCreateTokenTable: {

                        checkAndFixTokenTable(token_arr) {

                            let length = token_arr.length;
                            for (let i = 0; i <= length - 1; ++i) {

                                let last_token = token_arr[i - 1];
                                let token = token_arr[i];
                                if (last_token && "." === last_token.value && "Keyword" === token.type) {

                                    token.type = "Identifier";
                                }
                            }

                            return token_arr;
                        }
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
                            case "insert into":
                                globalVariableContainer.statement_type = token_table[0].value;
                                globalVariableContainer.statement_type = ("insert into" === token_table[0].value) ? "insert" : token_table[0].value;
                                break;

                            default:
                                let msg = "只支持CURD操作";
                                globalVariableContainer.sql_error = true;
                                globalVariableContainer.sql_error_msg = msg;
                                throw tool.makeErrorObj(false, "只支持CURD操作");
                        }

                        let allow = {

                            1: ["insert"],

                            2: ["insert", "delete"],
                            20: ["delete"], // 只支持删

                            3: ["insert", "delete", "select"],
                            30: ["select"],

                            4: ["insert", "delete", "select", "update"],
                            40: ["update"],
                        };

                        if (allow[globalVariableContainer.config.statement].indexOf(globalVariableContainer.statement_type) < 0) {

                            throw tool.makeErrorObj(false, "设置的 statement 级别不支持 " + globalVariableContainer.statement_type + " 操作");
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

        SQLCompiler: function (config = {sql: ""}) {

            return $(this).each(function () {

                (new SQLCompiler(config)).init();
            });
        },

        SQLCompilerAPI: {

            // 调试
            debug(sql = "") {

                let compiler = SQLCompiler.prototype.compile.steps;
                globalVariableContainer.config.statement = 4;
                globalVariableContainer.config.sql = sql;
                globalVariableContainer.sql = sql;
                globalVariableContainer.debug = true;

                console.time("runtime");

                try {

                    // 词法分析
                    debugMsg("Lexical Analysis ...", debugColor.loading);
                    debugMsg("pure sql : " + sql);
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

                    debugMsg("Transforming AST Outline ... Results are as follows", debugColor.info);
                    compiler.syntacticAnalysis.makeASTOutlineTransforming();
                    debugMsg(this.steps.syntacticAnalysis.getASTOutlineTransformed());

                    debugMsg("Optimizing AST ... Results are as follows", debugColor.info);
                    compiler.syntacticAnalysis.optimizeAST();
                    debugMsg(this.steps.syntacticAnalysis.getAST());

                    debugMsg("End Syntactic Analysis\n\n", debugColor.success);

                    console.timeEnd("runtime");

                    debugMsg("Format SQL ...", debugColor.loading);
                    let sql_format = this.formatSQL();
                    console.log(sql_format.sql);
                    return sql_format;

                } catch (e) {

                    tool.errorHandle(e);
                }
            },

            // 单步, 获取每步的执行情况, 仅适用于SQLCompiler
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

                    getASTOutlineTransformed() {

                        return globalVariableContainer.ast_outline_transformed;
                    },

                    getAST() {

                        return globalVariableContainer.ast;
                    },
                }
            },

            // SQL格式化: 通过 AST 树的属性(或者token表的属性, 反正就是需要借助这2个工具, 在特定的字符前加回车, 在特定字符前加N个空白格)实现
            formatSQL() {

                let obj = this.steps.syntacticAnalysis.getAST();
                let token_table = globalVariableContainer.tokenTable;

                // 如果 ast 的type 是下面的, 则换行且缩进
                let enter_indent_arr = ["statement", "clause", "predicate", "function"];

                let sub_query_num = globalVariableContainer.sub_query_num;
                let sub_query_level = 1;
                let whitespace = true;
                let last_char = "";
                let indent = 0; // 记录当前的缩进
                let enters = 1; // 记录当前的行数
                let sql = "";

                function traverseObj(obj) {

                    if (!tool.propertyIsObj(obj)) {

                        return;
                    }

                    let properties = Object.getOwnPropertyNames(obj);

                    for (let property of properties) {

                        if (Array.isArray(obj[property])) {

                            if ("subquery" === property) {

                                ++sub_query_level;

                                sql = sql + "\n" + tool.makeContinuousStr(indent) + "(";
                                indent += 4;
                                ++enters;
                            } else if ("union" === property || "union all" === property) {

                                sql = sql + "\n" + tool.makeContinuousStr(indent) + obj['type'].toLocaleUpperCase();
                                indent += 4;
                                ++enters;
                            } else if ("bracket" === property) {

                                sql = sql + " (";
                            } else if ("function" === property) {

                                sql = sql + " " + obj['function_name'].toLocaleUpperCase() + "(";
                            }

                            for (let item of obj[property]) {

                                traverseObj(item);
                            }

                            if ("subquery" === property) {

                                --sub_query_level;

                                indent -= 4;
                                sql = sql + "\n" + tool.makeContinuousStr(indent) + (sub_query_level === sub_query_num ? "" : ")");
                                ++enters;
                            } else if ("union" === property || "union all" === property) {

                                indent -= 4;
                                ++enters;
                            } else if ("bracket" === property) {

                                sql = sql + " )";
                            } else if ("function" === property) {

                                sql = sql + " " + ")";
                            }

                        } else if (tool.propertyIsObj(obj[property])) {

                            traverseObj(obj[property]);
                        } else {

                            if ("value" === property) {

                                let lexicon = JSON.parse(JSON.stringify(obj.value));
                                if ("Keyword" === token_table[obj.index].type) {

                                    lexicon = lexicon.toLocaleUpperCase();
                                } else {

                                    lexicon = token_table[obj.index].value;
                                }

                                if (enter_indent_arr.indexOf(obj['type']) > -1) {

                                    enters = (sql !== "") ? (++enters) : enters;
                                    sql = sql + (sql === "" ? "" : "\n") + tool.makeContinuousStr(indent) + lexicon;
                                } else {

                                    whitespace = !("." === lexicon || "." === last_char);
                                    sql = sql + (whitespace ? " " : "") + lexicon;
                                    last_char = lexicon;
                                }
                            }
                        }
                    }
                }

                traverseObj(obj);

                return {
                    sql: sql,
                    enters: enters,
                };
            },

            // 自动化测试
            testing(n = 10) {

                return tool.sqlFactory.fake(n);
            }
        },
    });

})();
