/**
 * TODO:
 * 1. 编程要定义最少的数据源, 多数据源则会造成编程的杂乱(不只数据源, 修改操作等都要求少, 而不是求多)
 */
(function () {

    // 常量表
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
                STATEMENT: 4,
                HANDLE: 0,
            }
        },
        TRANSLATOR: {
            STATES: {
                STATEMENT: 1,
                CLAUSE: 2,
                EXPR: 3,
                WORD: 4,
                HANDLE: 0,
            },
        },
    };
    const WORD_TABLE = {
        // 序列
        "sequence": {

            keyword: {

                statement: ["select", "update", "insert", "delete"],
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

    // 全局变量表
    let globalVariableContainer = {

        // 所有的配置都写这里, 不要写在 tool 里面
        config: {

            grammar: {

                // 配置使用的语法类型
                type: "mysql",
            }
        },
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

        // 注册AOP
        registerAOP() {

            Function.prototype.before = function (func) {

                let _self = this;
                return function () {

                    if (false === func.apply(this, arguments)) {
                        return false;
                    }
                    return _self.apply(this, arguments);
                };
            };

            Function.prototype.after = function (func) {

                let _self = this;
                return function () {

                    let ret = _self.apply(this, arguments);
                    if (false === ret) {
                        return false;
                    }
                    func.apply(this, arguments);
                    return ret;
                };
            };
        },

        propertyIsObj(obj) {

            return $.isPlainObject(obj);
        },

        isFunction(fn) {

            return Object.prototype.toString.call(fn) === '[object Function]';
        },

        deepSpread(rule){

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
                "next_state": "statement",
                "next_index": 0,
                "next": [],
            };
        },

        // 生成AST节点
        generateASTNode(node, token, extra) {

            let ast_node = {

                "node": node, // 节点类型 root, statement, clause, expr, word
                "state": extra.state, // 分析时所处状态 root, statement, clause, expr, word 等同于 node
                "next_state": extra.next_state, // 下一个跳转状态 statement, clause, expr, word
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

        visitAST(ast, visitor) {

            if (!tool.propertyIsObj(ast)) {

                return;
            }

            let properties = Object.getOwnPropertyNames(ast);
            for (let property of properties) {

                // 属性值是数组
                if (Array.isArray(ast[property])) {

                    for (let item of ast[property]) {

                        this.visitAST(item, visitor);
                    }
                }

                // 属性值是对象
                else if (tool.visitAST(ast[property])) {

                    this.visitAST(ast[property], visitor);
                }

                // 属性值是字面值
                else {

                    if (ast[property] && tool.isFunction(ast[property])) {
                        ast[property]();
                    }
                }
            }
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
        },

        init(stream) {

            this.props.stream = stream;

            this.before();
            this.start();
            this.after();
        },

        // 前置处理
        before() {

            WORD_TABLE.sequence.keyword.any = (() => {

                return WORD_TABLE.sequence.keyword.statement.concat(
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
        },

        start() {

            let sequence = "";
            while (!tool.isUndefined(sequence = this.gets())) {

                if (sequence.length < 2) {
                    this.fsm.events.flowtoCharState(sequence);
                } else {
                    this.fsm.events.flowtoWordState(sequence);
                }
            }
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
    };

    // 在构建的时候，通过flowState实现Translator最好 ！！！！
    let translator = {

        props: {

            rules: [],
        },

        init(state, token) {

            this.props.rules.push(this.packRule(state, token));
            this.start();
        },

        start() {


        },

        packRule(state, token) {

            let type = globalVariableContainer.config.grammar.type;
            type = "mysql";
            let rule = [];

            switch (state) {

                case "word":
                    break;

                case "expr":
                    break;

                case "clause":

                    break;

                case "statement":

                    if ("select" === token) {
                        rule = grammar.type.select_statement;
                    }
                    break;

                default:
                    break;
            }

            return rule;
        }
    };

    // AST构建器
    let builder = {

        props: {

            tokens: [], // token流
            wordTable: WORD_TABLE,
            nesting_queries: [], // 记录下嵌套查询的信息 {"query":"", "left_bracket_index":10, "right_bracket_index":10"}

            // 产物
            ast: {},
        },

        fsm: {

            state: FSM.PARSER.STATES.HANDLE,

            events: {

                // 转向Word状态
                flowtoWordState(token) {

                    let word = token.value;
                    if (parser.props.wordTable.sequence.keyword.statement.indexOf(word) > -1) {

                        parser.fsm.state = FSM.PARSER.STATES.STATEMENT;
                        return;
                    } else if (parser.props.wordTable.sequence.keyword.clause.indexOf(word) > -1) {

                        parser.fsm.state = FSM.PARSER.STATES.CLAUSE;
                        return;
                    }

                    let root = parser.props.ast;
                    let statement_node = root.next[root.next_index];
                    if (statement_node.next_index >= statement_node.next.length) {

                        statement_node.next.push(tool.generateASTNode("clause", {}, {
                            "state": "clause",
                            "next_state": "word",
                        }));
                    }

                    let clause_node = statement_node.next[statement_node.next_index];
                    if (clause_node.next_index >= clause_node.next.length) {

                        let expression = "";
                        if (!tool.isUndefined(clause_node.value)) {
                            expression = clause_node.value;
                        } else if (!tool.isUndefined(statement_node.value)) {
                            expression = statement_node.value;
                        }
                        clause_node.next.push(tool.generateASTNode("expr", {}, {
                            "state": "expr",
                            "next_state": "word",
                            "expression": expression,
                        }));
                    }
                    clause_node.next_index = clause_node.next.length - 1;

                    let expr_node = clause_node.next[clause_node.next_index];
                    expr_node.next.push(tool.generateASTNode("word", token, {
                        "state": "word",
                        "next_state": "handle",
                    }));
                    expr_node.next_index = expr_node.next.length - 1;

                    translator.init("expr", token);

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向expr状态
                flowtoExprState(token) {

                    let root = parser.props.ast;
                    let statement_node = root.next[root.next_index];
                    let clause_node = statement_node.next[statement_node.next_index];

                    clause_node.next.push(tool.generateASTNode("expr", token, {
                        "state": "expr",
                        "next_state": "handle",
                    }));
                    clause_node.next_index = clause_node.next.length - 1;

                    translator.init("expr", token);

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向clause状态
                flowtoClauseState(token) {

                    let root = parser.props.ast;
                    let statement_node = root.next[root.next_index];
                    statement_node.next.push(tool.generateASTNode("clause", token, {
                        "state": "clause",
                        "next_state": "handle",
                    }));
                    statement_node.next_index = statement_node.next.length - 1;

                    translator.init("clause", token);

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                },

                // 转向STATEMENT状态
                flowtoStatementState(token) {

                    let root = parser.props.ast;
                    root.next.push(tool.generateASTNode("statement", token, {
                        "state": "statement",
                        "next_state": "handle",
                    }));
                    root.next_index = root.next.length - 1;

                    translator.init("statement", token);

                    parser.fsm.state = FSM.PARSER.STATES.HANDLE;
                }
            },
        },

        init() {

            this.before();
            this.start();
            this.after();
        },

        before() {

            // 清理
            this.props.nesting_queries = [];
            this.props.ast = tool.generateASTRootNode();

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
        },

        start() {

            // 状态机模型分析tokens
            for (let token of this.props.tokens) {

                // token先流向词状态, 由词状态内部去抉择下一个状态是什么, 并返回创建的这个词节点
                this.fsm.events.flowtoWordState(token);

                // 如果不属于平衡状态(HANDLE状态), 则循环运行下去直到平衡为止
                while (FSM.PARSER.STATES.HANDLE !== this.fsm.state) {

                    switch (this.fsm.state) {
                        case FSM.PARSER.STATES.STATEMENT:
                            this.fsm.events.flowtoStatementState(token);
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
        },

        after() {

            this.optimize();
        },

        optimize() {

            // 对子查询的AST结构进行调整
            for (let token of this.props.tokens) {

            }
        },
    };

    // 前端过程步骤
    let steps = {

        // 词法分析
        lexicalAnalysis: {

            work() {

                scanner.init(globalVariableContainer.config.sql);
            }
        },

        // 语法分析
        syntacticAnalysis: {

            work() {

                builder.init();
                translator.init();
            }
        },

        // 语义分析
        semanticAnalysis: {

            work() {

            }
        }
    };

    // 定义 SQLCompiler
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

            this.steps.before.work();
            this.steps.lexicalAnalysis.work();
            this.steps.syntacticAnalysis.work();
            this.steps.semanticAnalysis.work();
        },
    };

    // 扩展 SQLCompiler 功能
    $.fn.extend({

        SQLCompilerAPI: {

            closure: {

                tool: tool,
                scanner: scanner,
                parser: parser,
            },

            format() {

                let sql = "";
                let lines = 0; // 记录当前的行数
                let statement = 0;
                let clause_indents = 0; // 记录当前的clause缩进
                let statement_indents = 0; // 记录当前的语句缩进

                let indent_str = ""; // 缩进字符
                let enter_str = ""; // 换行字符

                let nesting_queries = parser.props.nesting_queries;

                function reset() {

                    statement = 0;
                    clause_indents = 0;
                    statement_indents = 0;
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

                                if ("statement" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    // 语句缩进, 当前是第n个句子, 缩进就是n*8, 之所以不乘4是因为4是从句的缩进
                                    statement_indents = statement * 8;

                                    enter_str = tool.makeContinuousStr(lines === 0 ? 0 : 1, "\n");
                                    indent_str = tool.makeContinuousStr(statement_indents, " ");
                                    sql += (enter_str + indent_str + obj['value'].toUpperCase());

                                    ++lines;
                                    ++statement;
                                } else if ("clause" === obj[property] && !tool.isUndefined(obj['value'])) {

                                    clause_indents = statement_indents + 4; // 从句缩进 = 句子缩进 + 4
                                    if ("union" === obj['value']) {
                                        reset();
                                    }

                                    indent_str = tool.makeContinuousStr(clause_indents, " ");
                                    enter_str = tool.makeContinuousStr(1, "\n");
                                    sql += (enter_str + indent_str + obj['value'].toUpperCase());

                                    ++lines;
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
                                                let sub_query_indents = (statement - 2) * 8 + 4;

                                                indent_str = tool.makeContinuousStr(sub_query_indents, " ");
                                                enter_str = tool.makeContinuousStr(1, "\n");
                                                sql += (enter_str + indent_str + val);

                                                ++lines;
                                                --statement;
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

                return res;
            },

            visitAST() {

            },
        },

        SQLCompiler: function (config = {sql: ""}) {

            return $(this).each(function () {

                console.clear();
                (new SQLCompiler(config)).boot();
            });
        },
    });

})();