/**
 * TODO:
 * 1. 编程要定义最少的数据源, 多数据源则会造成编程的杂乱(不只数据源, 修改操作等都要求少, 而不是求多)
 */
(function () {

    const FSM = {
        SCANNER: {
            STATES: {
                CHAR: 1,
                WORD: 2,
                HANDLE: 0,
            }
        },
        PARSER: {
            STATES: {
                WORD: 1,
                EXPR: 2,
                CLAUSE: 3,
                SENTENCE: 4,
                HANDLE: 0,
            }
        },
    };
    const WORD_TABLE = {
        // 序列
        "sequence": {

            keyword: {

                sentence: ["select", "update", "insert", "delete"],
                clause: ["union", "set", "values", "from", "where", "left", "inner", "right", "join", "group", "having", "order", "limit"],

                other: ["into", "between", "and", "as", "like", "not", "desc", "asc", "on", "is", "or", "all", "by", "null"],
                function: ["count", "max", "min", "sum", "avg", "distinct"],
                any: [],
            },

            identifier: {}
        },

        // 终止符
        "terminator": {

            punctuator: {

                arithmetic: ['+', '-', '*', '/', '%', 'div', 'mod'], // 算术符
                comparison: ['=', '>', '<', '!'], // 比较符
                constructors: ['.', '(', ')', ',', ';', '"', '\'', '`', ':'], // 构造符
                need_match: ['(', ')', '"', '\'', '`'], // 需要匹配的字符
                space: [' ', '\t', '\n', '\r'], // 空白符
                illegal: [',', ':'], // 不应该在末端出现的非法字符
                any: [],
            },
        },
    };

    let globalVariableContainer = {
        config: {}, // 所有的配置都写这里, 不要写在 tool 里面
    };
    let tool = {

        error(e) {

            // e.trace = e.trace.replace(/\n/g, " ");
            throw e.msg + "\n\n" + e.trace + "\n\n" + e.seq;
        },

        debug(msg, data = false) {

            if (!globalVariableContainer.config.debug) {
                return;
            }

            if (1 !== globalVariableContainer.config.log_n) {
                console.log("\n\n");
            }

            console.warn(globalVariableContainer.config.log_n + ": " + msg);

            if (false !== data) {
                console.log(data);
            }

            globalVariableContainer.config.log_n++;
        },

        truncateStr(str, end) {
            return str.slice(0, end + 1);
        },

        // 创建连续的字符串
        makeContinuousStr(n, str = " ") {

            return new Array(n + 1).join(str);
        },

        propertyIsObj(obj) {

            return $.isPlainObject(obj);
        },

        // 因为折叠会出现索引连续不上和length不变的情况, 故而需要清理掉zombie数据
        rebuildASTIndex(obj) {

            let obj_str = JSON.stringify(obj);
            return JSON.parse(obj_str.replace(/,null/g, ""));
        },

        punctuatorMatchByStack(tokens, start, punctuator) {

            let stack = [], length = tokens.length, need_found_punctuator;
            switch (punctuator) {
                case "`":
                case "'":
                case '"':
                    need_found_punctuator = punctuator;
                    break;

                case "(":
                    need_found_punctuator = ")";
                    break;

                case ")":
                    need_found_punctuator = "(";
                    break;

                default:
                    tool.error({
                        'msg': "can not match this error punctuator '" + punctuator + "'",
                        "trace": "error near : " + this.truncateStr(scanner.props.stream, tokens[start].seq),
                        "seq": "seq: " + tokens[start].seq,
                    });
                    break;
            }

            for (let i = start + 1; i <= length - 1; ++i) {

                if (need_found_punctuator === tokens[i].value && stack.length < 1) {

                    return i;
                } else if (need_found_punctuator === tokens[i].value) {
                    stack.pop();
                } else if (punctuator === tokens[i].value) {

                    stack.push(tokens[i].value);
                }
            }

            tool.error({
                'msg': "no match this punctuator '" + punctuator + "'",
                "trace": "error near : " + this.truncateStr(scanner.props.stream, tokens[start].seq),
                "seq": "seq: " + tokens[start].seq,
            });
        },

        generateASTRootNode() {

            return {
                "node": "root",
                "state": "handle",
                "next_state": "sentence",
                "next_index": 0,
                "next": [],
            };
        },

        isUndefined(obj) {

            return "undefined" === typeof obj;
        },

        implodeArrByField(arr, field = "value") {

            let str = "";
            for (let item of arr) {

                if ("value" === field && ";" === item['value']) {
                    continue;
                }

                if (!this.isUndefined(item[field])) {
                    str += item[field];
                }
            }

            return str.trim();
        },

        // 从start处开始, 寻找下一个 ch 的
        findNextCh(str, start, ch) {

            let length = str.length;
            for (let i = start; i <= length - 1; ++i) {

                if (ch === str[i]) {

                    return i;
                }
            }

            return -1;
        },

        // 正则匹配
        regTest(pattern, str, error) {

            let reg = new RegExp(pattern);
            if (!reg.test(str)) {

                tool.error(error);
            }

            return true;
        },

        // 表达式中是否含有函数
        isExistFunctionInExpression(expression) {

            let reg = new RegExp(/^[a-zA-Z0-9-_]+\(.*\)$/);
            return reg.test(expression);
        },

        trimStringArray(arr) {

            // ["", "id", ""]
            let new_arr = [];

            for (let item of arr) {

                if (item.trim().length > 0) {
                    new_arr.push(item);
                }
            }

            return new_arr;
        },

        // 语句类型: select, update, delete, insert
        judgeSQLType(sql) {

            let types = ["select", "update", "delete"]; // 暂时不支持insert语句
            for (let type of types) {

                if (sql.indexOf(type) > -1) {

                    if (("select" === type || "delete" === type) && sql.indexOf("from") < 0) {

                        this.error({"msg": "Except 'from' Clause of Statement", "trace": sql});
                    }

                    if (("update" === type) && sql.indexOf("set") < 0) {

                        this.error({"msg": "Except 'set' Clause of Statement", "trace": sql});
                    }

                    return type;
                }
            }

            this.error({"msg": "Illegal Statement, only access select, update and delete", "trace": sql});
        },

    };

    // 词法分析器
    let scanner = {

        props: {

            stream: "", // 字符流
            length: 0, // 字符流的长度
            seq: 0, // 字符流的序号
            sql_type: "select", // 语句类型
            wordTable: WORD_TABLE,

            // 产物
            tokens: [],
        },

        init(stream) {

            tool.debug("SQLCompiler Steps lexicalAnalysis: stream assign to scanner.props.stream");
            this.props.stream = stream;

            this.before();
            this.start();
            this.after();
        },

        start() {

            tool.debug("SQLCompiler Steps lexicalAnalysis: start");

            let sequence = "";
            while (!tool.isUndefined(sequence = this.gets())) {

                if (sequence.length < 2) {
                    this.fsm.events.flowtoCharState(sequence);
                } else {
                    this.fsm.events.flowtoWordState(sequence);
                }
            }

            tool.debug("SQLCompiler Steps lexicalAnalysis: start ending");
        },

        // 从输入区读取字符序列，读到终止符为止
        gets() {

            let stream = this.props.stream;
            let length = stream.length;
            let seq = this.props.seq;

            for (let i = seq; i <= length - 1; ++i) {

                let sequence, ch = stream[i];
                if (this.props.wordTable.terminator.punctuator.any.indexOf(ch) > -1) {

                    if (seq === i) {

                        sequence = stream.slice(seq, i + 1);
                        this.props.seq = i + 1;
                    } else {
                        sequence = stream.slice(seq, i);
                        this.props.seq = i;
                    }

                    return sequence;
                }

                if (length - 1 === i) {

                    this.props.seq = i + 1;
                    return stream.slice(seq, i + 1);
                }
            }

            // stream最后的符号
            if (seq === length - 1) {
                this.props.seq = seq + 1;
                return stream.slice(seq, seq + 1);
            }

            return undefined;
        },

        // 前置处理
        before() {

            // 换行符替换为空格
            this.props.stream = $.trim(this.props.stream.replace(/\n/g, " ").toLowerCase());

            // 多个空格替换为1个空格
            this.props.stream = $.trim(this.props.stream.replace(/\s+/g, " ").toLowerCase());

            // 最后添加分号
            this.props.stream = this.props.stream.split(";")[0] + ";";

            // tokens 情空
            this.props.tokens = [];
            this.props.seq = 0;

            // 判断sql类型
            this.props.sql_type = tool.judgeSQLType(this.props.stream);

            tool.debug("SQLCompiler Steps lexicalAnalysis: pre-processing", {
                stream: this.props.stream,
                "sql_type": this.props.sql_type
            });
        },

        // 后置处理
        after() {

            // 为符号做匹配处理
            for (let token of this.props.tokens) {

                if ("punctuator" !== token.type || this.props.wordTable.terminator.punctuator.need_match.indexOf(token.value) < 0) {
                    continue;
                }

                if (!tool.isUndefined(token.match_index)) {
                    continue;
                }

                let start = token.index;
                let end = tool.punctuatorMatchByStack(this.props.tokens, start, token.value);
                this.props.tokens[start].match_index = end;
                this.props.tokens[end].match_index = start;
            }

            tool.debug("SQLCompiler Steps lexicalAnalysis: after ending", {
                tokens: this.props.tokens
            });
        },

        fsm: {

            state: FSM.SCANNER.STATES.HANDLE, // 当前机器的状态

            events: {

                // 转向Char状态
                flowtoCharState(ch) {

                    let index = scanner.props.tokens.length;
                    scanner.props.tokens.push({
                        "type": "punctuator",
                        "value": ch,
                        "index": index,
                        "seq": scanner.props.seq - ch.length + 1,
                    });
                    scanner.fsm.state = FSM.SCANNER.STATES.HANDLE;
                },

                // 转向Word状态
                flowtoWordState(sequence) {

                    let type;

                    if (!isNaN(sequence)) {
                        type = "Number";
                    } else if (scanner.props.wordTable.sequence.keyword.any.indexOf(sequence) > -1) {
                        type = "Keyword";
                    } else {
                        type = "Identifier";
                    }

                    let index = scanner.props.tokens.length;
                    scanner.props.tokens.push({
                        "type": type,
                        "value": sequence,
                        "index": index,
                        "seq": scanner.props.seq - sequence.length + 1,
                    });
                    scanner.fsm.state = FSM.SCANNER.STATES.HANDLE;
                }
            }
        }
    };

    // 语法解析器
    let parser = {

        props: {

            tokens: [], // token流
            wordTable: WORD_TABLE,
            nesting_queries: [], // 记录下嵌套查询的信息 {"query":"", "left_bracket_index":10, "right_bracket_index":10"}

            // 产物
            ast: tool.generateASTRootNode(),
        },

        fsm: {

            state: FSM.PARSER.STATES.HANDLE,

            events: {

                // 转向Word状态
                flowtoWordState(token) {

                    let word = token.value;
                    if (parser.props.wordTable.sequence.keyword.sentence.indexOf(word) > -1) {

                        parser.fsm.state = FSM.PARSER.STATES.SENTENCE;
                        return;
                    } else if (parser.props.wordTable.sequence.keyword.clause.indexOf(word) > -1) {

                        parser.fsm.state = FSM.PARSER.STATES.CLAUSE;
                        return;
                    }

                    let root = parser.props.ast;
                    let sentence_node = root.next[root.next_index];
                    if (sentence_node.next_index >= sentence_node.next.length) {

                        sentence_node.next.push(parser.generateASTNode("clause", {}, {
                            "state": "clause",
                            "next_state": "word",
                        }));
                    }

                    let clause_node = sentence_node.next[sentence_node.next_index];
                    if (clause_node.next_index >= clause_node.next.length) {

                        let expression = "";
                        if (!tool.isUndefined(clause_node.value)) {
                            expression = clause_node.value;
                        } else if (!tool.isUndefined(sentence_node.value)) {
                            expression = sentence_node.value;
                        }
                        clause_node.next.push(parser.generateASTNode("expr", {}, {
                            "state": "expr",
                            "next_state": "word",
                            "expression": expression,
                        }));
                    }
                    clause_node.next_index = clause_node.next.length - 1;

                    let expr_node = clause_node.next[clause_node.next_index];
                    expr_node.next.push(parser.generateASTNode("word", token, {
                        "state": "word",
                        "next_state": "handle",
                    }));
                    expr_node.next_index = expr_node.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向expr状态
                flowtoExprState(token) {

                    let root = parser.props.ast;
                    let sentence_node = root.next[root.next_index];
                    let clause_node = sentence_node.next[sentence_node.next_index];

                    clause_node.next.push(parser.generateASTNode("expr", token, {
                        "state": "expr",
                        "next_state": "handle",
                    }));
                    clause_node.next_index = clause_node.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向clause状态
                flowtoClauseState(token) {

                    let root = parser.props.ast;
                    let sentence_node = root.next[root.next_index];
                    sentence_node.next.push(parser.generateASTNode("clause", token, {
                        "state": "clause",
                        "next_state": "handle",
                    }));
                    sentence_node.next_index = sentence_node.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向Sentence状态
                flowtoSentenceState(token) {

                    let root = parser.props.ast;
                    root.next.push(parser.generateASTNode("sentence", token, {
                        "state": "sentence",
                        "next_state": "handle",
                    }));
                    root.next_index = root.next.length - 1;

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                }
            },
        },

        parsing: {

            running() {

                if (!globalVariableContainer.config.parsing_enable) {
                    return;
                }

                tool.debug("SQLCompiler Steps syntacticAnalysis: parsing");
                this.parsingSentence.go();
            },

            // 解析句子
            parsingSentence: {

                go() {

                    switch (scanner.props.sql_type) {

                        case "select":
                            this.parsingSentenceOfSelect();
                            break;

                        case "update":
                            this.parsingSentenceOfUpdate();
                            break;

                        case "delete":
                            this.parsingSentenceOfDelete();
                            break;

                        case "insert":
                            this.parsingSentenceOfInsert();
                            break;

                        default:
                            this.error({"msg": "Illegal Statement", "trace": sql});
                            break;
                    }
                },

                parsingSentenceOfSelect() {

                    let sentence_nodes = parser.props.ast.next;

                    // 循环每一个语句
                    for (let i = 0; i <= sentence_nodes.length - 1; ++i) {

                        tool.debug("SQLCompiler Steps syntacticAnalysis: parsing select statement", {
                            "sentence_node": sentence_nodes[i],
                            "clause_nodes": sentence_nodes[i].next,
                        });

                        let clause_nodes = sentence_nodes[i].next;
                        for (let j = 0; j <= clause_nodes.length - 1; ++j) {

                            // 对表达式进行预处理
                            let expression = tool.implodeArrByField(clause_nodes[j].next[clause_nodes[j].next_index].next);

                            tool.debug("SQLCompiler Steps syntacticAnalysis: parsing clause ...", {
                                "expression": expression,
                                "clause_node_next_nodes": clause_nodes[j].next[clause_nodes[j].next_index].next,
                                "clause_node": clause_nodes[j].value,
                                "clause": clause_nodes[j].value,
                            });

                            // expression 的解析不应受到这些字符的影响
                            expression = expression.replace(/`/g, "").trim(); // 去掉"`"符号
                            // expression = expression.replace(/[(]/g, "").trim(); // 去掉括号(仅去左括号)

                            if (expression.indexOf("by") === 0) {
                                expression = expression.slice(2).trim(); // 去掉by
                            }

                            // 解决最末端写 "," 的错误SQL
                            if (parser.props.wordTable.terminator.punctuator.illegal.indexOf(expression[expression.length - 1]) > -1) {

                                tool.error({"msg": "Illegal Punctuator at The End", "trace": expression});
                            }

                            // 根据clause类型, 对表达式进行解析
                            if (0 === j) {

                                parser.parsing.parsingExpr.parsingExpressionOfSelect(expression);
                            } else if ("from" === clause_nodes[j].value) {

                                parser.parsing.parsingExpr.parsingExpressionOfFrom(expression);
                            } else if ("union" === clause_nodes[j].value) {

                                // 子查询
                                parser.parsing.parsingExpr.parsingExpressionOfSubQuery(expression, "union");
                            } else if ("join" === clause_nodes[j].value) {

                                // 因为left/right/inner和join的合并是在语义分析阶段才做, 所以目前要以join为判断条件
                                parser.parsing.parsingExpr.parsingExpressionOfJoin(expression);
                            } else if ("where" === clause_nodes[j].value) {

                                parser.parsing.parsingExpr.parsingExpressionOfWhere(expression);
                            } else if ("group" === clause_nodes[j].value) {

                                parser.parsing.parsingExpr.parsingExpressionOfGroup(expression);
                            } else if ("order" === clause_nodes[j].value) {

                                parser.parsing.parsingExpr.parsingExpressionOfOrder(expression);
                            } else if ("limit" === clause_nodes[j].value) {

                                parser.parsing.parsingExpr.parsingExpressionOfLimit(expression);
                            } else if ("having" === clause_nodes[j].value) {

                                parser.parsing.parsingExpr.parsingExpressionOfHaving(expression);
                            }
                        }
                    }
                },

                parsingSentenceOfUpdate() {

                    let sentence_nodes = parser.props.ast.next;

                    let clause_nodes = sentence_nodes[0].next;

                    for (let j = 0; j <= clause_nodes.length - 1; ++j) {

                        // 对表达式进行预处理
                        let expression = tool.implodeArrByField(clause_nodes[j].next[clause_nodes[j].next_index].next);

                        // expression 的解析不应受到这些字符的影响
                        expression = expression.replace(/`/g, "").trim(); // 去掉"`"符号

                        if (0 === j) {

                            parser.parsing.parsingExpr.parsingExpressionOfUpdate(expression);
                        } else if ("set" === clause_nodes[j].value) {

                            parser.parsing.parsingExpr.parsingExpressionOfSet(expression);
                        } else if (["left join", "right join", "inner join"].indexOf(clause_nodes[j].value) > -1) {

                            parser.parsing.parsingExpr.parsingExpressionOfJoin(expression);
                        } else if ("where" === clause_nodes[j].value) {

                            parser.parsing.parsingExpr.parsingExpressionOfWhere(expression);
                        } else if ("group" === clause_nodes[j].value) {

                            if (expression.indexOf("by") === 0) {
                                expression = expression.slice(2).trim(); // 去掉by
                            }
                            parser.parsing.parsingExpr.parsingExpressionOfGroup(expression);
                        } else if ("order" === clause_nodes[j].value) {

                            if (expression.indexOf("by") === 0) {
                                expression = expression.slice(2).trim(); // 去掉by
                            }
                            parser.parsing.parsingExpr.parsingExpressionOfOrder(expression);
                        } else if ("limit" === clause_nodes[j].value) {

                            parser.parsing.parsingExpr.parsingExpressionOfLimit(expression);
                        }
                    }
                },

                parsingSentenceOfDelete() {

                    let sentence_nodes = parser.props.ast.next;

                    let clause_nodes = sentence_nodes[0].next;

                    for (let j = 0; j <= clause_nodes.length - 1; ++j) {

                        // 对表达式进行预处理
                        let expression = tool.implodeArrByField(clause_nodes[j].next[clause_nodes[j].next_index].next);

                        // expression 的解析不应受到这些字符的影响
                        expression = expression.replace(/`/g, "").trim(); // 去掉"`"符号

                        if (0 === j) {

                            parser.parsing.parsingExpr.parsingExpressionOfDelete(expression);
                        } else if ("from" === clause_nodes[j].value) {

                            parser.parsing.parsingExpr.parsingExpressionOfFrom(expression);
                        } else if (["left join", "right join", "inner join"].indexOf(clause_nodes[j].value) > -1) {

                            parser.parsing.parsingExpr.parsingExpressionOfJoin(expression);
                        } else if ("where" === clause_nodes[j].value) {

                            parser.parsing.parsingExpr.parsingExpressionOfWhere(expression);
                        } else if ("group" === clause_nodes[j].value) {

                            if (expression.indexOf("by") === 0) {
                                expression = expression.slice(2).trim(); // 去掉by
                            }
                            parser.parsing.parsingExpr.parsingExpressionOfGroup(expression);
                        } else if ("order" === clause_nodes[j].value) {

                            if (expression.indexOf("by") === 0) {
                                expression = expression.slice(2).trim(); // 去掉by
                            }
                            parser.parsing.parsingExpr.parsingExpressionOfOrder(expression);
                        } else if ("limit" === clause_nodes[j].value) {

                            parser.parsing.parsingExpr.parsingExpressionOfLimit(expression);
                        }
                    }
                },

                parsingSentenceOfInsert() {

                },
            },

            // 解析表达式, 用正则
            parsingExpr: {

                // 共有的解析规则
                common: {

                    // 解析数字
                    parsingNumber(expression, throw_error = false) {

                        expression = expression.trim();
                        let res = (new RegExp(/^[0-9]+$/)).test(expression);

                        if (!res && throw_error) {

                            tool.error({"msg": "Not number", "trace": expression})
                        }

                        return res;
                    },

                    // 解析字符串
                    parsingString(expression) {

                        expression = expression.trim();
                        try {

                            return "string" === typeof expression;
                        } catch (e) {
                            tool.error({"msg": "Incorrect expression", "trace": expression});
                        }
                    },

                    // 解析值
                    parsingValueOfCompare(value) {

                        value = value.trim();

                        // 可能是子查询
                        // 1. 由于在parser的parsingSentenceOfSelect处理中已经把括号去掉了, 所以不会出现括号符
                        // 2. 由于在parser的before处理中已经处理了子查询, 所以之后不需要考虑子查询

                        // 非子查询
                        this.parsingValueOfAssign(value);
                    },

                    // 解析值
                    parsingValueOfAssign(value) {

                        value = value.trim();

                        // 可能是数字
                        if (this.parsingNumber(value)) {

                            return true;
                        }

                        // 可能是字符串
                        if (this.parsingString(value)) {
                            return true;
                        }

                        // 其他类型
                        return false;
                    },

                    // 解析函数参数
                    parsingFunctionParam(expression) {

                        expression = expression.trim();

                        // 数字
                        if (this.parsingNumber(expression)) {
                            return true;
                        }

                        // 字符串
                        if (this.parsingString(expression)) {
                            return true;
                        }

                        // column
                        this.parsingColumnOfDot(expression);
                    },

                    // 解析函数
                    parsingFunction(expression) {

                        expression = expression.trim();

                        let start = tool.findNextCh(expression, 0, "(") + 1;
                        let end = tool.findNextCh(expression, 0, ")");
                        let params_str = expression.slice(start, end);

                        // 解析参数列表
                        let params = params_str.split(",");
                        for (let param of params) {

                            this.parsingFunctionParam(param);
                        }
                    },

                    // 解析别名
                    parsingAlias(expression, separator = "as") {

                        expression = expression.trim();

                        let columns = tool.trimStringArray(expression.split(separator));
                        if (columns.length !== 2) {

                            tool.error({"msg": "Incorrect Alias Expression", "trace": expression});
                        }
                        for (let column of columns) {

                            column = column.trim();
                            this.parsingColumnOfDot(column);
                        }
                    },

                    // 解析 between 语法
                    parsingBetween(expression) {

                        let items = expression.split(/\s+between\s+|\s+and\s+/);

                        // 有 between, 但是 between and 表达式不符合
                        if (3 !== items.length) {

                            tool.error({"msg": "Incorrect Between Expression", "trace": expression});
                        }

                        // 解析column
                        this.parsingColumnOfDot(items[0]);

                        // 解析Number
                        this.parsingNumber(items[1], true);
                        this.parsingNumber(items[2], true);
                    },

                    // 解析列
                    parsingPlainColumn(str) {

                        str = str.trim();

                        for (let sign of ["", ")"]) {
                            if (str.indexOf(sign) > -1) {
                                return true;
                            }
                        }

                        return tool.regTest(/^[`]?[a-zA-Z0-9-_*]+[`]?$/, str, {
                            "msg": "incorrect column",
                            "trace": str,
                        });
                    },

                    // 递归解析列
                    parsingColumnOfDot(expression, dot_index = -1, level = 0, max_level = 3) {

                        expression = expression.trim();

                        // 如果有别名, 则解析别名( 如果有 as, 有右括号[不能用/\s+\)\s+/正则], 或者有空格 )
                        for (let alias_sign of [/\s+as\s+/, ")", " "]) {

                            let columns = tool.trimStringArray(expression.split(alias_sign)).length;
                            if (2 === columns) {

                                // "a as".split("as") = ["a ", ""], 故这种错误(未写别名)也会捕捉到
                                this.parsingAlias(expression, alias_sign);
                                return;
                            }

                            // 写了多个别名, 错误也会被捕捉到
                            if (2 < columns && expression.indexOf(")") < 0) {

                                tool.error({"msg": "Incorrect Columns", "trace": expression});
                                return;
                            }
                        }

                        // 如果是函数, 则解析函数
                        if (0 === level && tool.isExistFunctionInExpression(expression)) {

                            // 递归深度为0时, 才能有函数, 即 : db.table.column.func()非法, func()合法
                            this.parsingFunction(expression);
                        } else {

                            // 找到从 dot_index 到下一个 dot_index之间的字符串
                            let start = dot_index + 1;
                            let next_dot_index = tool.findNextCh(expression, start, '.');
                            let str = (next_dot_index < 0) ? expression.slice(start) : expression.slice(start, next_dot_index); // 输入非法时, str为空, 不会被正则匹配成功

                            // 解析普通字段
                            this.parsingPlainColumn(str);

                            // 后面还有 dot 字符, 还需要继续解析
                            if (next_dot_index >= 0) {

                                if (level >= max_level - 1) {

                                    tool.error({"msg": "error:max level dot parsing limit", "trace": expression});
                                }

                                this.parsingColumnOfDot(expression, next_dot_index, level + 1);
                            }
                        }
                    },

                    // 解析 assign 算式, 如set
                    parsingAssignFormula(formula) {

                        formula = formula.trim();

                        let step, items = formula.split("=");
                        for (step = 0; step <= items.length - 1; ++step) {

                            // 解析赋值表达式的左侧
                            if (0 === step % 2) {
                                this.parsingColumnOfDot(items[step]);
                            }

                            // 解析赋值表达式的右侧
                            else {

                                if (!this.parsingValueOfAssign(items[step])) {
                                    tool.error({"msg": "Incorrect Assign", "trace": formula});
                                }
                            }
                        }
                    },

                    // 解析 compare 算式, 如 where
                    parsingCompareFormula(formula) {

                        formula = formula.trim();

                        let operators = /\s+not\s+|\s+like\s+|\s+is\s+|=|!=|>|</;
                        let step = 0, items = tool.trimStringArray(formula.split(operators));

                        if (1 === items.length) {

                            // 1. 等式可能只有1个值, 如 where 1 and 1 and column and function 等这种情况
                            // 2. 在 parsingExpressionOfWhere 中把 between 也切割了, 故调用parsingCompareFormula时, 碰巧也会出现这种单值的情况
                            this.parsingString(items[0]);
                        } else {

                            for (step = 0; step <= items.length - 1; ++step) {
                                // 解析表达式左侧, 偶数为左侧, 奇数为右侧
                                if (0 === step % 2) {

                                    this.parsingColumnOfDot(items[step]);
                                }

                                // 解析表达式右侧
                                else {

                                    this.parsingValueOfCompare(items[step]);
                                }
                            }
                        }
                    },
                },

                // 解析 select 字段列表表达式
                parsingExpressionOfSelect(expression) {

                    let columns = expression.split(",");
                    for (let column of columns) {

                        this.common.parsingColumnOfDot(column);
                    }
                },

                // 解析 update 字段列表表达式
                parsingExpressionOfUpdate(expression) {

                    let columns = expression.split(",");
                    for (let column of columns) {

                        this.common.parsingColumnOfDot(column, -1, 0, 2);
                    }
                },

                // 解析 delete 字段列表表达式
                parsingExpressionOfDelete(expression) {

                    if ("" !== expression) {
                        tool.error({"msg": "Incorrect Delete", "trace": expression});
                    }
                },

                // 解析 from 表达式
                parsingExpressionOfFrom(expression) {

                    let columns = expression.split(/\s*,\s*|\s*\(\s*/);
                    for (let column of columns) {

                        this.common.parsingColumnOfDot(column, -1, 0, 2);
                    }
                },

                // 解析 order 表达式
                parsingExpressionOfOrder(expression) {

                    expression = expression.trim();

                    let order_rules = expression.split(",");

                    for (let order_rule of order_rules) {

                        order_rule = order_rule.trim();

                        let order_rule_length = order_rule.split(" ").length;
                        if (1 === order_rule_length) {

                            this.common.parsingColumnOfDot(order_rule);
                        } else if (2 === order_rule_length && ["asc", "desc"].indexOf(order_rule.split(" ")[1]) < 0) {

                            tool.error({"msg": "Incorrect Order, only access asc or desc", "trace": expression});
                        } else if (2 !== order_rule_length) {

                            tool.error({"msg": "Incorrect Order Expression", "trace": expression});
                        }
                    }
                },

                // 解析 where 表达式
                parsingExpressionOfJoin(expression) {

                    let reg = /\s+on\s+/;

                    // 解析表
                    let table = expression.split(reg)[0];
                    this.common.parsingColumnOfDot(table, -1, 0, 2);

                    // 解析join条件
                    let condition = expression.split(reg)[1];
                    this.parsingExpressionOfWhere(condition);
                },

                // 解析 where 表达式
                parsingExpressionOfWhere(expression) {

                    // where 表达式中如果有"," 则报错, 只允许有 and 等连接符
                    if (expression.indexOf(",") > -1) {

                        // 只精确到Condition即可，不要精确到Where, 因为不只Where会使用这个解析, On也会使用这个解析
                        tool.error({"msg": "Incorrect Condition Expression of ','", "trace": expression});
                    }

                    // 切除连接符
                    let formulas = expression.split(/\s+between\s+|\s+and\s+|\s+or\s+/); // 包括 between运算
                    for (let formula of formulas) {

                        this.common.parsingCompareFormula(formula);
                    }
                },

                // 解析 set 表达式
                parsingExpressionOfSet(expression) {

                    let formulas = expression.split(/,/);
                    for (let formula of formulas) {

                        this.common.parsingAssignFormula(formula);
                    }
                },

                // 解析 insert 表达式
                parsingExpressionOfInsert(expression) {

                    let columns = expression.split(/\(|\)|,/);
                    for (let column of columns) {

                        this.common.parsingColumnOfDot(column);
                    }
                },

                // 解析 values 表达式
                parsingExpressionOfValues(expression) {

                    let values = expression.split(/\(|\)|,/);
                    for (let value of values) {

                        this.common.parsingValueOfAssign(value);
                    }
                },

                // 解析 group 表达式
                parsingExpressionOfGroup(expression) {

                    let columns = expression.split(",");
                    for (let column of columns) {

                        this.common.parsingColumnOfDot(column);
                    }
                },

                // 解析 Limit 表达式
                parsingExpressionOfLimit(expression) {

                    let numbers = expression.split(",");

                    // 注意: 判断多写时不能过滤, 判断少写时需要过滤 (直接用trim前和trim后的数组长度比对是更好的方法)
                    if (numbers.length !== tool.trimStringArray(numbers).length || numbers.length > 2) {

                        tool.error({"msg": "Incorrect Limit Expression", "trace": expression});
                    }

                    for (let number of numbers) {

                        this.common.parsingNumber(number, true);
                    }
                },

                // 解析 Having 表达式
                parsingExpressionOfHaving(expression) {

                    this.parsingExpressionOfWhere(expression);
                },

                // 解析 子查询 表达式
                parsingExpressionOfSubQuery(expression, type = "from") {

                    if ("from" === type) {

                        return true;
                    } else if ("value_of_compare" === type) {

                        return true;
                    } else if ("union" === type && ("" === expression || "all" === expression)) {

                        return true;
                    } else {

                        tool.error({"msg": "Illegal sub_query", "trace": expression});
                    }
                }
            },
        },

        init(tokens) {

            tool.debug("SQLCompiler Steps syntacticAnalysis: tokens assign to parser.props.tokens");

            this.props.tokens = tokens;
            this.before();
            this.start();
        },

        before() {

            // 清理
            this.props.nesting_queries = [];

            // 先对括号进行子查询匹配处理
            let token_length = this.props.tokens.length;
            for (let token of this.props.tokens) {

                if ("(" === token.value) {

                    for (let i = token.index + 1; i <= token_length - 1; ++i) {

                        if ("select" === this.props.tokens[i].value && token.match_index > i) {

                            let right_token = this.props.tokens[token.match_index];
                            let right_bracket_seq = right_token.seq;
                            this.props.nesting_queries.push({
                                "query": scanner.props.stream.slice(token.seq, right_bracket_seq - 1),
                                "left_bracket_token": token,
                                "left_bracket_index": token.index,
                                "left_bracket_seq": token.seq,

                                "right_bracket_token": right_token,
                                "right_bracket_index": token.match_index,
                                "right_bracket_seq": right_bracket_seq,
                            });
                            break;
                        }
                    }
                }
            }

            tool.debug("SQLCompiler Steps syntacticAnalysis: pre-processing", {
                nesting_queries: this.props.nesting_queries,
            });
        },

        start() {

            tool.debug("SQLCompiler Steps syntacticAnalysis: start");

            // 状态机模型分析tokens
            for (let token of this.props.tokens) {

                // token先流向词状态, 由词状态内部去抉择下一个状态是什么, 并返回创建的这个词节点
                this.fsm.events.flowtoWordState(token);

                // 如果不属于平衡状态(HANDLE状态), 则循环运行下去直到平衡为止
                while (FSM.PARSER.STATES.HANDLE !== this.fsm.state) {

                    switch (this.fsm.state) {
                        case FSM.PARSER.STATES.SENTENCE:
                            this.fsm.events.flowtoSentenceState(token);
                            break;
                        case FSM.PARSER.STATES.CLAUSE:
                            this.fsm.events.flowtoClauseState(token);
                            break;
                        case FSM.PARSER.STATES.EXPR:
                            this.fsm.events.flowtoExprState(token);
                            break;
                        default:
                            break;
                    }
                }
            }

            // 开始解析
            this.parsing.running();

            tool.debug("SQLCompiler Steps syntacticAnalysis: start ending", {
                "ast": this.props.ast,
            });
        },

        // 生成AST节点
        generateASTNode(node, token, extra) {

            let ast_node = {

                "node": node, // 节点类型 root, sentence, clause, expr, word
                "state": extra.state, // 分析时所处状态 root, sentence, clause, expr, word 等同于 node
                "next_state": extra.next_state, // 下一个跳转状态 sentence, clause, expr, word
                "next_index": 0, // next数组的下标
                "next": [], // next数组, 新增的AST节点根据 next_index push 到目标 next 数组
            };

            if (!tool.isUndefined(token.value)) {
                ast_node.value = token.value;
            }

            if (!tool.isUndefined(extra.expression)) {
                ast_node.expression = extra.expression;
            }

            if ("{}" !== JSON.stringify(token)) {
                ast_node.token = token;
            }

            return ast_node;
        },
    };

    // 语义分析器
    let analyzer = {

        props: {},

        init() {

            this.start();
        },

        start() {

            this.optimize.combineNodes();
        },

        optimize: {

            // 节点合并
            combineNodes() {

                // left/right/inner join (group by, order by不需要)
                for (let i = 0; i <= parser.props.ast.next.length - 1; ++i) {

                    let sentence_node = parser.props.ast.next[i];
                    let clause_nodes = sentence_node.next;
                    for (let i = 0; i <= clause_nodes.length - 1; ++i) {

                        let current_clause_node = clause_nodes[i];
                        if (tool.isUndefined(current_clause_node) || tool.isUndefined(current_clause_node.value)) {
                            continue;
                        }

                        // 合并 join
                        if (["left", "right", "inner"].indexOf(current_clause_node.value) > -1) {

                            // 只有前置, 没有join
                            let next_clause_node = clause_nodes[i + 1];
                            if (tool.isUndefined(next_clause_node) || "join" !== next_clause_node.value) {

                                let seq = clause_nodes[i].token.seq - 1 + clause_nodes[i].value.length;
                                tool.error({
                                    "msg": "incorrect join expression",
                                    "trace": tool.truncateStr(scanner.props.stream, seq),
                                    "seq": seq
                                });
                            }

                            // 合并 join 后，由于left和join后面都有空格造成了多余空格的情况，所以需要删除一个空格
                            let n_index = next_clause_node.next_index;
                            let expr_node = next_clause_node.next[n_index];
                            let word_node = expr_node.next[0];
                            if (!tool.isUndefined(word_node) && " " === word_node.value) {
                                delete (expr_node.next[0]);
                            }

                            // 实现 join 合并
                            clause_nodes[i].value = clause_nodes[i].value + " join"; // concat
                            clause_nodes[i].next = clause_nodes[i].next.concat(next_clause_node.next); // attach

                            // 删除 join 并对 null 处理
                            delete (clause_nodes[i + 1]); // 删除(注 delete next_clause_node 无效)
                            sentence_node.next = tool.rebuildASTIndex(sentence_node.next);
                        }
                    }
                }
            },

        }
    };

    // 前端过程步骤
    let steps = {

        before: {

            work() {

                parser.props.ast = tool.generateASTRootNode();

                WORD_TABLE.sequence.keyword.any = (() => {

                    return WORD_TABLE.sequence.keyword.sentence.concat(
                        WORD_TABLE.sequence.keyword.clause,
                        WORD_TABLE.sequence.keyword.other,
                        WORD_TABLE.sequence.keyword.function
                    );
                })();
                WORD_TABLE.terminator.punctuator.any = (() => {

                    return WORD_TABLE.terminator.punctuator.arithmetic.concat(
                        WORD_TABLE.terminator.punctuator.comparison,
                        WORD_TABLE.terminator.punctuator.constructors,
                        WORD_TABLE.terminator.punctuator.need_match,
                        WORD_TABLE.terminator.punctuator.space,
                    );
                })();

                tool.debug("SQLCompiler Steps before", {
                    "ast": parser.props.ast,
                    "keyword_any": WORD_TABLE.sequence.keyword.any,
                    "punctuator_any": WORD_TABLE.terminator.punctuator.any
                });
            }
        },

        lexicalAnalysis: {

            work() {

                tool.debug("SQLCompiler Steps lexicalAnalysis");
                scanner.init(globalVariableContainer.config.sql);
            }
        },

        syntacticAnalysis: {

            work() {

                tool.debug("SQLCompiler Steps syntacticAnalysis");
                parser.init(scanner.props.tokens);
            }
        },

        semanticAnalysis: {

            work() {

                tool.debug("SQLCompiler Steps semanticAnalysis");
                analyzer.init();
            }
        }
    };

    let SQLCompiler = function (config = {}) {

        globalVariableContainer.config = Object.assign({
            sql: "",
            debug: true,
            log_n: 1, // 打印日志序号从n开始
            parsing_enable: true, // 是否启用语法解析
        }, config);
    };

    SQLCompiler.prototype = {

        tool: tool,
        scanner: scanner,
        parser: parser,
        steps: steps,

        boot() {

            console.clear();
            tool.debug("SQLCompiler booting");
            this.init();
            tool.debug("SQLCompiler ending", {
                tool: tool,
                scanner: scanner,
                parser: parser,
            });
        },

        init() {

            this.steps.before.work();
            this.steps.lexicalAnalysis.work();
            this.steps.syntacticAnalysis.work();
            this.steps.semanticAnalysis.work();
        },
    };

    $.fn.extend({

        SQLCompiler: function (config = {sql: ""}) {

            return $(this).each(function () {

                (new SQLCompiler(config)).boot();
            });
        },

        SQLCompilerAPI: {

            closure: {

                tool: tool,
                scanner: scanner,
                parser: parser,
            },

            format() {

                let sql = "";
                let lines = 0; // 记录当前的行数
                let sentence = 0;
                let clause_indents = 0; // 记录当前的clause缩进
                let sentence_indents = 0; // 记录当前的语句缩进

                let indent_str = ""; // 缩进字符
                let enter_str = ""; // 换行字符

                let nesting_queries = parser.props.nesting_queries;

                tool.debug("SQLCompilerAPI format start");

                function reset() {

                    sentence = 0;
                    clause_indents = 0;
                    sentence_indents = 0;
                    indent_str = "";
                    enter_str = "";
                }

                function traverseObj(obj) {

                    if (!tool.propertyIsObj(obj)) {

                        return;
                    }

                    let properties = Object.getOwnPropertyNames(obj);
                    for (let property of properties) {

                        // 属性值是数组
                        if (Array.isArray(obj[property])) {

                            for (let item of obj[property]) {

                                traverseObj(item);
                            }

                        }

                        // 属性值是对象
                        else if (tool.propertyIsObj(obj[property])) {

                            traverseObj(obj[property]);
                        }

                        // 属性值是字面值
                        else {

                            if ("state" === property) {

                                tool.debug("SQLCompilerAPI format handling ...");

                                if ("sentence" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    // 语句缩进, 当前是第n个句子, 缩进就是n*8, 之所以不乘4是因为4是从句的缩进
                                    sentence_indents = sentence * 8;

                                    enter_str = tool.makeContinuousStr(lines === 0 ? 0 : 1, "\n");
                                    indent_str = tool.makeContinuousStr(sentence_indents, " ");
                                    sql += (enter_str + indent_str + obj['value'].toUpperCase());

                                    ++lines;
                                    ++sentence;
                                    tool.debug("property is sentence: lines+1, sentence+1", {
                                        "lines": lines,
                                        "sentence": sentence,
                                    });
                                } else if ("clause" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    clause_indents = sentence_indents + 4; // 从句缩进 = 句子缩进 + 4
                                    if ("union" === obj['value']) {
                                        reset();
                                    }

                                    indent_str = tool.makeContinuousStr(clause_indents, " ");
                                    enter_str = tool.makeContinuousStr(1, "\n");
                                    sql += (enter_str + indent_str + obj['value'].toUpperCase());

                                    ++lines;
                                    tool.debug("property is sentence: lines+1, sentence+1", {
                                        "lines": lines,
                                        "clause": obj['value'],
                                        "clause_indents": clause_indents,
                                    });
                                } else if (("expr" === obj[property] || "word" === obj[property]) && !tool.isUndefined(obj['value'])) {

                                    let val = obj['value'];

                                    // 如果是右括号, 则判断是否为子查询的右括号
                                    if (")" === val) {

                                        // 是子查询的右括号
                                        for (let i = 0; i <= nesting_queries.length - 1; ++i) {

                                            if (obj.token.index === nesting_queries[i].right_bracket_index) {

                                                // 子查询缩进为 (i+1)*4, 之所以i+1是因为全部的子查询是存在nesting_queries数组中的
                                                // 第一个子查询的 i 为 0, 所以需要 +1, 以表示这是第1个子查询
                                                // 乘4是因为右括号需要和from并列, from是从句, 其缩进为每次缩进4
                                                // i*4是因为子查询SELECT间的缩进
                                                let sub_query_indents = (sentence - 2) * 8 + 4;

                                                indent_str = tool.makeContinuousStr(sub_query_indents, " ");
                                                enter_str = tool.makeContinuousStr(1, "\n");
                                                sql += (enter_str + indent_str + val);

                                                ++lines;
                                                --sentence;
                                                tool.debug("property is sentence: lines+1, sentence+1", {
                                                    "lines": lines,
                                                    "sub_query_indents": sub_query_indents,
                                                });
                                                return;
                                            }
                                        }

                                        // 不是子查询的右括号
                                        sql += val;
                                    }

                                    // 如果是关键字
                                    else if (scanner.props.wordTable.sequence.keyword.any.indexOf(val) > -1) {
                                        val = val.toUpperCase();
                                        sql += val;
                                    }

                                    // 普通字符
                                    else {

                                        sql += val;
                                    }
                                }
                            }
                        }
                    }
                }

                traverseObj(parser.props.ast);

                let res = {
                    sql: sql,
                    lines: lines,
                };

                tool.debug("SQLCompilerAPI format ending", res);

                return res;
            },
        },
    });

})();